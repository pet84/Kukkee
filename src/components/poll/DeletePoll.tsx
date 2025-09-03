import { Trash } from "react-bootstrap-icons";
import { Dispatch } from "react";
import Router from "next/router";
import { deletePoll } from "../../utils/api/server";

const DeletePoll = (props: {
  pollID: string;
  setResponse: Dispatch<{
    status: boolean;
    msg: string;
  }>;
}): JSX.Element => {
  const { pollID, setResponse } = props;

  const handleDelete = async (
    e: React.MouseEvent<HTMLInputElement>
  ): Promise<void> => {
    e.preventDefault();
    try {
      let deletePollResponse;
      const deleteArgs = {
        pollID,
      };
      deletePollResponse = await deletePoll(deleteArgs);
      if (deletePollResponse && deletePollResponse.statusCode === 200) {
        setResponse({
          status: true,
          msg: "Anketa byla úspěšně smazána.",
        });
        Router.push("/");
      } else {
        setResponse({
          status: true,
          msg: "Zkuste to prosím později.",
        });
        Router.reload();
      }
    } catch (err) {
      setResponse({
        status: true,
        msg: "Zkuste to prosím později.",
      });
    }
  };

  return (
    <span
      onClick={handleDelete}
      className="poll-delete-icon"
      aria-hidden="true"
    >
      <Trash />
    </span>
  );
};

export default DeletePoll;
