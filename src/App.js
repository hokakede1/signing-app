import React from "react";
import { Button, Icon } from "semantic-ui-react";
import SigningPad from "./components/SigningPad";
import Dropzone from "react-dropzone";
import PDFJS from "pdfjs-dist";
import jsPDF from "jspdf";

import "./App.css";

class App extends React.Component {
  state = {
    showSigning: false,
    uploadedFile: false,
    placeholders: [],
    signatures: []
  };

  componentDidMount() {
    PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.js`;
  }

  packAllPagesToDownload = () => {
    const finalPDF = new jsPDF("p", "mm", "letter");
    const width = finalPDF.internal.pageSize.getWidth();
    const height = finalPDF.internal.pageSize.getHeight();
    const canvasContainer = document.getElementById("canvas-container");
    canvasContainer.childNodes.forEach((child, index) => {
      const imgData = child.toDataURL("image/png", 1.0);
      if (index === 0) {
        finalPDF.addImage(imgData, "PNG", 0, 0, width, height);
      } else {
        const newPage = finalPDF.addPage();
        newPage.addImage(imgData, "PNG", 0, 0, width, height);
      }
    });
    finalPDF.save("download.pdf");
  };

  generatePlaceholder = (mousePos, canvas) => {
    const { placeholders } = this.state;
    const ctx = canvas.getContext("2d");
    const imgData = ctx.getImageData(mousePos.x, mousePos.y, 100, 50);
    ctx.rect(mousePos.x, mousePos.y, 100, 50);
    ctx.fillStyle = "yellow";
    ctx.fill();

    this.setState({
      placeholders: [...placeholders, { canvas, mousePos, imgData }]
    });
  };

  canvasUpdated = pageNumbers => {
    const canvasContainer = document.getElementById("canvas-container");
    if (pageNumbers === canvasContainer.childNodes.length) {
      function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        return {
          x: evt.clientX - rect.left - 20,
          y: evt.clientY - rect.top - 20
        };
      }

      canvasContainer.childNodes.forEach(child => {
        child.addEventListener(
          "click",
          evt => {
            const mousePos = getMousePos(child, evt);
            this.generatePlaceholder(mousePos, child);
          },
          false
        );
      });
      this.setState({ uploadedFile: true });
    }
  };

  onSubmitSig = url => {
    this.setState({ signatures: [...this.state.signatures, url] }, () => {
      const lastIndexSig = this.state.signatures.length - 1;
      this.addSignature(lastIndexSig);
    });
  };

  addSignature = index => {
    const placeholder = this.state.placeholders[index];
    const signature = this.state.signatures[index];

    const pdf = placeholder.canvas.getContext("2d");
    // clear the yellow box
    pdf.clearRect(placeholder.mousePos.x, placeholder.mousePos.y, 100, 50);
    pdf.putImageData(
      placeholder.imgData,
      placeholder.mousePos.x,
      placeholder.mousePos.y
    );

    // add signature
    const img = document.createElement("img");
    img.setAttribute("src", signature);
    img.setAttribute("style", { display: "none" });
    document.getElementById("App").appendChild(img);

    img.onload = () => {
      function scaleIt(source, scaleFactor) {
        var c = document.createElement("canvas");
        var ctx = c.getContext("2d");
        var w = source.width * scaleFactor;
        var h = source.height * scaleFactor;
        c.width = w;
        c.height = h;
        ctx.drawImage(source, 0, 0, w, h);
        return c;
      }

      var c1 = scaleIt(img, 0.6);

      pdf.drawImage(
        c1,
        placeholder.mousePos.x,
        placeholder.mousePos.y - 20,
        200,
        100
      );
    };
  };

  handleDrop = acceptedFiles => {
    this.loadPDFtoCanvas(acceptedFiles[0], this);
  };

  loadPDFtoCanvas = (file, componentContext) => {
    if (file.type !== "application/pdf") {
      console.error(file.name, "is not a pdf file.");
      return;
    }

    const fileReader = new FileReader();

    fileReader.onload = function() {
      const typedArray = new Uint8Array(this.result);
      PDFJS.getDocument(typedArray).then(pdf => {
        // you can now use *pdf* here
        const renderPage = async pageNum => {
          try {
// might need a new solution for Mobile
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport(3);
            const canvas = document.createElement("canvas");
            canvas.setAttribute("id", `page-${pageNum}`);
            const canvasContainer = document.getElementById("canvas-container");
            const ctx = canvas.getContext("2d");
            const renderContext = {
              canvasContext: ctx,
              viewport: viewport
            };
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            canvasContainer.appendChild(canvas);
            page.render(renderContext);
            componentContext.canvasUpdated(pdf.numPages);
          } catch (err) {
            console.log("ERROR", err);
          }
        };

        const pageNumbers = [...Array(pdf.numPages).keys()]; // Produce array [0,1,2,...]
        pageNumbers.forEach(pageNum => renderPage(pageNum + 1));
      });
    };
    PDFJS.disableWorker = true;
    fileReader.readAsArrayBuffer(file);
  };

  singingPadToggle = () => {
    this.setState({ showSigning: !this.state.showSigning });
  };

  render() {
    const { showSigning, placeholders, signatures } = this.state;
    const showSigningModal = !(
      this.state.uploadedFile && this.state.placeholders.length > 0
    );

    return (
      <div className="App" id="App">
        <br />
        <section className="dropzone-wrapper">
          <Dropzone onDrop={this.handleDrop}>
            {({ getRootProps, getInputProps }) => (
              <section className="drop-box">
                <div {...getRootProps()}>
                  <input {...getInputProps()} />
                  <div>
                    <h1>
                      <Icon name="upload"></Icon> Drop a PDF here
                    </h1>
                  </div>
                </div>
              </section>
            )}
          </Dropzone>
        </section>

        <div className="buttons-wrapper">
          <Button
            onClick={this.singingPadToggle}
            style={{ margin: "20px 0px" }}
            disabled={showSigningModal}
            positive
          >
            <Icon name="pencil alternate"></Icon>
            Show Signing Pad
          </Button>
          <Button onClick={this.packAllPagesToDownload} primary>
            <Icon name="download"></Icon>Download
          </Button>
          <SigningPad
            onSubmit={this.onSubmitSig}
            totalPlaceHolders={placeholders.length}
            totalSignatures={signatures.length}
            showSigning={showSigning}
            onClose={this.singingPadToggle}
          />
        </div>

        <div id="canvas-container"></div>
      </div>
    );
  }
}

export default App;
