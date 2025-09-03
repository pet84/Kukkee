import { Button, Spinner } from "react-bootstrap";
import { useState, Dispatch } from "react";
import Router from "next/router";
import { markTimes } from "../../utils/api/server";
import { Vote, PollFromDB } from "../../models/poll";
import { isUserPresentInVotes } from "../../helpers";

const SubmitTimes = (props: {
  newVote: Vote;
  pollID: string;
  hidden: boolean;
  pollFromDB: PollFromDB;
  setResponse: Dispatch<{
    status: boolean;
    msg: string;
  }>;
}): JSX.Element => {
  const { newVote, pollID, hidden, pollFromDB, setResponse } = props;

  const [disabled, setDisabled] = useState<boolean>(false);

  const handleSubmit = async (
    e: React.MouseEvent<HTMLInputElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!newVote.username) {
      setResponse({
        status: true,
        msg: "Prosím zadejte své jméno.",
      });
      return;
    }

    if (
      pollFromDB.votes &&
      isUserPresentInVotes(newVote.username, pollFromDB.votes)
    ) {
      setResponse({
        status: true,
        msg: "Nemůžete hlasovat více než jednou.",
      });
      return;
    }

    if (newVote.times.length === 0) {
      setResponse({
        status: true,
        msg: "Prosím vyberte alespoň jeden dostupný termín.",
      });
      return;
    }

    setDisabled(true);
    try {
      let submitTimeResponse;
      const voterArgs = {
        newVote,
        pollID,
      };
      submitTimeResponse = await markTimes(voterArgs);
      if (submitTimeResponse && submitTimeResponse.statusCode === 201) {
        setResponse({
          status: true,
          msg: "Váš hlas byl úspěšně zaznamenán.",
        });
        Router.reload();
      } else if (submitTimeResponse && submitTimeResponse.statusCode === 404) {
        setResponse({
          status: true,
          msg: "Anketa byla smazána.",
        });
        Router.push("/");
      } else if (submitTimeResponse && submitTimeResponse.statusCode === 400) {
        setResponse({
          status: true,
          msg: "Anketa byla uzavřena.",
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
    }
  };

  return (
    <div hidden={hidden}>
      <Button
        className="global-primary-button"
        type="submit"
        disabled={disabled}
        onClick={handleSubmit}
      >
        {!disabled ? (
          `Odeslat dostupnost`
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

export default SubmitTimes;
