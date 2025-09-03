import { Card, Container } from "react-bootstrap";
import { useSession, getSession } from "next-auth/react";
import Router from "next/router";
import { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { getPolls } from "../src/utils/api/server";
import { PollFromDB } from "../src/models/poll";
import Layout from "../src/components/Layout";

const NEXT_PUBLIC_BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || "";

const Dashboard = (props: { polls: PollFromDB[] }): JSX.Element => {
  const { polls } = props;

  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      Router.push("auth/signin");
    },
  });

  if (!session) return <></>;

  return (
    <>
      <Head>
        <title>Přehled | {NEXT_PUBLIC_BRAND_NAME}</title>
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Layout>
        <div className="global-page-heading">
          <Container className="global-container">Přehled</Container>
        </div>
        <div className="global-page-section">
          <Container className="global-container">
            {polls.filter((poll) => poll.open).length > 0 && (
              <span className="dashboard-polls-heading">Otevřené ankety</span>
            )}
            {polls.filter((poll) => poll.open).length > 0 &&
              polls
                .filter((poll) => poll.open)
                .map((poll) => (
                  <Card className="dashboard-poll-card" key={poll._id}>
                    <Card.Body>
                      <Card.Title>{poll.title}</Card.Title>
                      <Card.Text>
                        <a
                          className="stretched-link"
                          href={`/poll/${poll._id}`}
                        >
                          {poll.description}
                        </a>
                      </Card.Text>
                    </Card.Body>
                  </Card>
                ))}
            {polls.filter((poll) => poll.open).length === 0 && (
              <span className="dashboard-polls-heading">
                Nemáte žádné otevřené ankety.{" "}
                <Link href="/new">
                  <a>Vytvořte novou</a>
                </Link>
                !
              </span>
            )}
          </Container>
        </div>
      </Layout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const {
    headers: { cookie },
  } = context.req;

  const session = await getSession(context);

  const getPollResponse = await getPolls(cookie);

  if (getPollResponse.statusCode === 401) {
    return {
      redirect: {
        destination: `/auth/signin`,
        permanent: false,
      },
    };
  }

  const polls = getPollResponse.data;

  return {
    props: { polls, session },
  };
};

export default Dashboard;
