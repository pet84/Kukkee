import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import KukkeePoll, { Vote, PollDoc } from "../src/models/poll";
import {
  isTimePresentInPollTimes,
  isUserPresentInVotes,
} from "../src/helpers";
import connectToDatabase from "../src/utils/db";

export default async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<NextApiResponse | void> => {
  const session = await getSession({ req });

  const {
    query: { id },
    method,
    body,
  } = req;

  switch (method) {
    case "PUT": {
      try {
        await connectToDatabase();

        const poll: PollDoc | null = await KukkeePoll.findOne({
          _id: id,
        });

        if (!poll) {
          return res.status(404).json({ message: "Poll does not exist" });
        }

        if (poll.type === "protected" && !session) {
          return res.status(401).json({ message: "User not logged in" });
        }

        const vote: Vote = JSON.parse(body as string);

        if (!poll.open) {
          return res.status(400).json({ message: "Poll closed" });
        }

        if (
          !vote.times.every((time) =>
            isTimePresentInPollTimes(time, poll.times)
          )
        ) {
          return res.status(400).json({ message: "Invalid times" });
        }

        if (
          poll.type === "protected" &&
          session &&
          vote.username !== session.username
        ) {
          return res.status(403).json({
            message:
              "Zakázáno. Jméno nesedí s přihlášeným uživatelem.",
          });
        }

        if (poll.votes && isUserPresentInVotes(vote.username, poll.votes)) {
          return res
            .status(403)
            .json({ message: "User cannot vote more than once" });
        }

        const currentVotes: Vote[] | undefined = poll.votes;
        const newVotes: Vote[] = currentVotes
          ? [...currentVotes, { username: vote.username, times: vote.times }]
          : [{ username: vote.username, times: vote.times }];

        const updatedPoll: PollDoc | null =
          await KukkeePoll.findOneAndUpdate(
            { _id: id },
            { votes: newVotes },
            { new: true }
          );

        return res.status(201).json(updatedPoll);
      } catch (err: any) {
        return res.status(400).json({ message: err.message });
      }
    }
    default: {
      res.setHeader("Allow", ["PUT"]);
      return res.status(405).end(`Method ${method} Not Allowed`);
    }
  }
};
