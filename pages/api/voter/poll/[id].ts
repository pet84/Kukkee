import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import KukkeePoll, { Vote, PollDoc } from "../../../../src/models/poll";
import {
  isTimePresentInPollTimes,
  isUserPresentInVotes,
} from "../../../../src/helpers";
import connectToDatabase from "../../../../src/utils/db";

export default async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<NextApiResponse | void> => {
  const session = await getSession({ req });

  const {
    query: { id },
    method,
  } = req;

  switch (method) {
    case "PUT":
      try {
        await connectToDatabase();
        const poll: PollDoc | null = await KukkeePoll.findOne({ _id: id });

        if (!poll) {
          return res.status(404).json({ message: "Anketa neexistuje." });
        }

        if (poll.type === "protected" && !session) {
          return res.status(401).json({ message: "Uživatel není přihlášen." });
        }

        // Next.js obvykle parsuje body -> req.body je objekt.
        // Když by byl string (např. custom bodyParser), fallback na JSON.parse:
        const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        // Základní validace payloadu
        const vote: Vote = {
          username: body?.username ?? "",
          times: Array.isArray(body?.times) ? body.times : [],
        };

        if (!poll.open) {
          return res.status(400).json({ message: "Anketa je uzavřena." });
        }

        // kontrola, že všechny zvolené časy existují v definovaných časech ankety
        const allTimesValid =
          vote.times.length > 0 &&
          vote.times.every((time) => isTimePresentInPollTimes(time, poll.times));

        if (!allTimesValid) {
          return res.status(400).json({ message: "Neplatné termíny." });
        }

        if (poll.type === "protected" && session && vote.username !== session.username) {
          return res.status(403).json({ message: "Zakázáno. Jméno nesedí s přihlášeným uživatelem." });
        }

        if (poll.votes && isUserPresentInVotes(vote.username, poll.votes)) {
          return res.status(403).json({ message: "Nelze hlasovat více než jednou." });
        }

        const currentVotes: Vote[] = Array.isArray(poll.votes) ? poll.votes : [];
        const newVotes: Vote[] = [...currentVotes, { username: vote.username, times: vote.times }];

        const updatedPoll: PollDoc | null = await KukkeePoll.findOneAndUpdate(
          { _id: id },
          { votes: newVotes },
          { new: true }
        );

        return res.status(201).json(updatedPoll);
      } catch (err: any) {
        return res.status(400).json({ message: err?.message ?? "Neočekávaná chyba." });
      }

    default:
      res.setHeader("Allow", ["PUT"]);
      return res.status(405).end(`Method ${method} není povolena`);
  }
};
