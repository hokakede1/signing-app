import React, { useState } from "react";
import { Button } from "semantic-ui-react";
import SigningPad from "./components/SigningPad";
import Dropzone from "react-dropzone";
import PDFJS from "pdfjs-dist";

import "./App.css";

function App() {
  const [showSigning, setShowSigning] = useState(false);
  PDFJS.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS.version}/pdf.worker.js`;

  const handleDrop = acceptedFiles => {
    loadPDFtoCanvas(acceptedFiles[0]);
  };

  const loadPDFtoCanvas = file => {
    if (file.type !== "application/pdf") {
      console.error(file.name, "is not a pdf file.");
      return;
    }

    const fileReader = new FileReader();

    fileReader.onload = function() {
      const typedArray = new Uint8Array(this.result);

      PDFJS.getDocument(typedArray).then(function(pdf) {
        // you can now use *pdf* here
        const renderPage = async pageNum => {
          try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport(1);
            const canvas = document.createElement("canvas");
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
          } catch (err) {
            console.log("ERROR", err);
          }
        };

        const pageNumbers = [...Array(pdf.numPages).keys()]; // Produce array [0,1,2,...]

        console.log("pageNumbers", pageNumbers);
        pageNumbers.forEach(pageNum => {
          console.log("check", pageNum + 1);
          renderPage(pageNum + 1);
        });
      });
    };
    PDFJS.disableWorker = true;
    fileReader.readAsArrayBuffer(file);
  };

  return (
    <div className="App">
      <br />
      <Dropzone onDrop={handleDrop}>
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
        onClick={() => setShowSigning(!showSigning)}
        style={{ margin: "20px 0px" }}
      >
        Show Signing Pad
      </Button>
      {showSigning && <SigningPad />}
      <div id="canvas-container"></div>
    </div>
  );
}

export default App;
