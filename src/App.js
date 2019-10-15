import React from "react";
import { Button } from "semantic-ui-react";
import SigningPad from "./components/SigningPad";
import Dropzone from "react-dropzone";
import PDFJS from "pdfjs-dist";
import jsPDF from "jspdf";

import "./App.css";

class App extends React.Component {
  state = {
    showSigning: false,
    placeholders: [],
    signatures: []
  };

  componentDidMount() {
    PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.js`;
  }

  packAllPagesToDownload = () => {
    const finalPDF = new jsPDF();
    const canvasContainer = document.getElementById("canvas-container");
    canvasContainer.childNodes.forEach((child, index) => {
      const imgData = child.toDataURL("image/jpeg", 1.0);
      if (index === 0) {
        finalPDF.addImage(imgData, "JPEG", 0, 0);
      } else {
        const newPage = finalPDF.addPage();
        newPage.addImage(imgData, "JPEG", 0, 0);
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
      pdf.drawImage(
        img,
        placeholder.mousePos.x,
        placeholder.mousePos.y - 20,
        100,
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
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport(1);
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

  render() {
    const { showSigning, placeholders, signatures } = this.state;
    return (
      <div className="App" id="App">
        <br />
        <Dropzone onDrop={this.handleDrop}>
          {({ getRootProps, getInputProps }) => (
            <section>
              <div {...getRootProps()}>
                <input {...getInputProps()} />
                <Button color="blue">Upload</Button>
              </div>
            </section>
          )}
        </Dropzone>

        <Button
          onClick={() => this.setState({ showSigning: !showSigning })}
          style={{ margin: "20px 0px" }}
        >
          Show Signing Pad
        </Button>
        <Button onClick={this.packAllPagesToDownload}>Download</Button>
        {showSigning && (
          <SigningPad
            onSubmit={this.onSubmitSig}
            totalPlaceHolders={placeholders.length}
            totalSignatures={signatures.length}
          />
        )}
        <div id="canvas-container"></div>
      </div>
    );
  }
}

export default App;
