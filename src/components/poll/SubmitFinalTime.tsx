import { Button, Spinner } from "react-bootstrap";
import { useState, Dispatch } from "react";
import Router from "next/router";
import { markFinalTime } from "../../utils/api/server";
import { Time } from "../../models/poll";

const SubmitFinalTime = (props: {
  finalTime: Time | undefined;
  pollID: string;
  setResponse: Dispatch<{
    status: boolean;
    msg: string;
  }>;
}): JSX.Element => {
  const { finalTime, pollID, setResponse } = props;

  const [disabled, setDisabled] = useState<boolean>(false);

  const handleSubmit = async (
    e: React.MouseEvent<HTMLInputElement>
  ): Promise<void> => {
    e.preventDefault();
    if (finalTime) {
      setDisabled(true);
      try {
        const voterArgs = {
          finalTime: {
            finalTime,
            open: false,
          },
          pollID,
        };
        const submitFinalTimeResponse = await markFinalTime(voterArgs);
        if (submitFinalTimeResponse.statusCode === 201) {
          setResponse({
            status: true,
            msg: "Termín byl úspěšně uzavřen a anketa je uzavřena.",
          });
          Router.reload();
        } else {
          setDisabled(false);
          setResponse({
            status: true,
            msg: "Zkuste to prosím znovu později.",
          });
          Router.reload();
        }
      } catch (err) {
        setDisabled(false);
        setResponse({
          status: true,
          msg: "Zkuste to prosím znovu později.",
        });
        Router.reload();
      }
    } else {
      setResponse({
        status: true,
        msg: "Prosím vyberte finální termín.",
      });
    }
  };

  return (
    <div>
      <Button
        className="global-primary-button mb-3"
        type="submit"
        disabled={disabled}
        onClick={handleSubmit}
      >
        {!disabled ? (
          `Uzavřít termín`
        ) : (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
              className="form-button-spinner"
            />
          </>
        )}
      </Button>
    </div>
  );
};

export default SubmitFinalTime;
