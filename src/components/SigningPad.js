import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button, Message, Progress } from "semantic-ui-react";

export default function SigningPad({
  onSubmit,
  totalPlaceHolders,
  totalSignatures
}) {
  const canvasRef = useRef(null);
  const onSubmitSignature = () => {
    onSubmit(canvasRef.current.toDataURL("image/png", 1.0));
    canvasRef.current.clear();
  };

  const diff = totalPlaceHolders - totalSignatures;
  const progressState = {
    waiting: {
      processBarMes: "Almost Done",
      messageState: {
        warning: true,
        header: `You have ${
          diff > 1 ? `${diff} signatures` : `${diff} signature`
        } left`
      }
    },
    success: {
      processBar: "Complete",
      messageState: {
        positive: true,
        header: `You finished`
      }
    }
  };

  const currentState = diff === 0 ? "success" : "waiting";

  return (
    <>
      <Progress
        value={totalSignatures}
        total={totalPlaceHolders}
        progress="ratio"
      >
        {progressState[currentState].processBarMes}
      </Progress>
      <Message {...progressState[currentState].messageState} />
      <div className="signing-pad">
        <SignatureCanvas
          ref={canvasRef}
          penColor="black"
          canvasProps={{ width: 500, height: 200, className: "sigCanvas" }}
        />
      </div>
      <br />
      <Button
        inverted
        color="green"
        onClick={onSubmitSignature}
        style={{ zIndex: "100" }}
      >
        Submit
      </Button>
      <Button
        inverted
        color="blue"
        onClick={() => canvasRef.current.clear()}
        style={{ zIndex: "100" }}
      >
        Clear
      </Button>
    </>
  );
}
