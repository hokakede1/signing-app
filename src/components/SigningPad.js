import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "semantic-ui-react";

export default function SigningPad({ onSubmit }) {
  const canvasRef = useRef(null);
  const onSubmitSignature = () => {
    onSubmit(canvasRef.current.toDataURL("image/jpeg", 1.0));
    canvasRef.current.clear();
  };
  return (
    <>
      <div className="signing-pad">
        <SignatureCanvas
          ref={canvasRef}
          penColor="black"
          canvasProps={{ width: 500, height: 200, className: "sigCanvas" }}
        />
      </div>
      <br />
      <Button inverted color="green" onClick={onSubmitSignature}>
        Submit
      </Button>
      <Button inverted color="blue" onClick={() => canvasRef.current.clear()}>
        Clear
      </Button>
    </>
  );
}
