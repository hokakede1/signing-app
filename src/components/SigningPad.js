import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button, Message, Progress, Modal } from "semantic-ui-react";

export default function SigningPad({
  onSubmit,
  totalPlaceHolders,
  totalSignatures,
  showSigning,
  onClose
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
    <Modal open={showSigning} onClose={onClose}>
      <Modal.Header>
        <Progress
          value={totalSignatures}
          total={totalPlaceHolders}
          warning={currentState === "waiting"}
          success={currentState === "success"}
          active={true}
          progress="ratio"
        ></Progress>
        <Message {...progressState[currentState].messageState} />
      </Modal.Header>

      <Modal.Description
        style={{ border: "none", display: "flex", justifyContent: "center" }}
      >
        <div className="signing-pad">
          <SignatureCanvas
            ref={canvasRef}
            penColor="black"
            canvasProps={{ width: 500, height: 200, className: "sigCanvas" }}
          />
        </div>
      </Modal.Description>
      <Modal.Actions>
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
      </Modal.Actions>
    </Modal>
  );
}
