import Router from "next/router";
import Head from "next/head";
import dynamic from "next/dynamic";
import { Form, Container, Jumbotron, Button, Spinner } from "react-bootstrap";
import { format } from "url";
import { useState, useEffect } from "react"; // <-- Přidán import useEffect
import { useSession } from "next-auth/react";
import Layout from "../src/components/Layout";
import ResponseMessage from "../src/components/ResponseMessage";
import { Time, Poll, PollType } from "../src/models/poll";
import { createPoll } from "../src/utils/api/server";

const NEXT_PUBLIC_BRAND_NAME = process.env.NEXT_PUBLIC_BRAND_NAME || "";

const AvailableTimes: any = dynamic(() => import("react-available-times"), {
  ssr: false,
});

const New = (): JSX.Element => {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      Router.push({
        pathname: "/auth/signin",
        query: { from: "/new" },
      });
    },
  });

  // ✅ PŘIDÁNO: Efekt pro překlad kalendáře po vykreslení
  useEffect(() => {
    const translations = {
      Sun: "Ne", Mon: "Po", Tue: "Út", Wed: "St", Thu: "Čt", Fri: "Pá", Sat: "So",
      Jan: "Led", Feb: "Úno", Mar: "Bře", Apr: "Dub", May: "Kvě", Jun: "Čer",
      Jul: "Čvc", Aug: "Srp", Sep: "Zář", Oct: "Říj", Nov: "Lis", Dec: "Pro",
      "All-day": "Celý den",
    };

    const translateCalendar = () => {
      // Překlad dnů v záhlaví (např. "Sun 31" -> "Ne 31")
      document.querySelectorAll(".rat-DayHeader_day").forEach((el) => {
        const text = el.textContent || "";
        const [day, num] = text.split(" ");
        if (translations[day]) {
          el.textContent = `${translations[day]} ${num}`;
        }
      });

      // Překlad rozsahu měsíců (např. "Aug 31 – Sep 6" -> "Srp 31 – Zář 6")
      const intervalEl = document.querySelector(".rat-AvailableTimes_interval");
      if (intervalEl) {
        let text = intervalEl.textContent || "";
        Object.keys(translations).forEach((key) => {
          if (text.includes(key)) {
            text = text.replace(new RegExp(key, "g"), translations[key]);
          }
        });
        intervalEl.textContent = text;
      }
      
      // Překlad "All-day"
      const allDayEl = document.querySelector(".rat-Week_allDayLabel");
      if (allDayEl && translations[allDayEl.textContent]) {
          allDayEl.textContent = translations[allDayEl.textContent];
      }
    };

    // Knihovna překresluje obsah bez znovunačtení stránky,
    // musíme na to reagovat. Sledujeme změny a po každé překreslíme.
    const observer = new MutationObserver(() => {
        translateCalendar();
    });
    
    const calendarElement = document.querySelector('.rat-AvailableTimes_component');
    if (calendarElement) {
        observer.observe(calendarElement, {
            childList: true,
            subtree: true
        });
    }

    // Uklidíme po sobě, když komponenta zmizí
    return () => observer.disconnect();

  }, []); // Prázdné pole znamená, že se tento kód spustí jen jednou po načtení komponenty

  const [pollDetails, setPollDetails] = useState<{
    pollTitle: string;
    pollLocation: string;
    pollDescription: string;
  }>({
    pollTitle: "",
    pollLocation: "",
    pollDescription: "",
  });

  const [pollType, setPollType] = useState<PollType>("protected");

  const handlePollTypeChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const { value } = e.target;
    const pollTypeFromOptions = value as PollType;
    setPollType(pollTypeFromOptions);
  };

  const { pollTitle, pollLocation, pollDescription } = pollDetails;

  const [pollTimes, setTimes] = useState<Time[]>();
  const [disabled, setDisabled] = useState<boolean>(false);

  const [response, setResponse] = useState({
    status: false,
    msg: "",
  });

  const handlePollDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value } = e.target;

    setPollDetails({
      ...pollDetails,
      [name]: value,
    });
  };

  const onTimesChange = (selections: { start: Date; end: Date }[]): void => {
    const newTimes: Time[] = selections.map(
      (time): Time => ({
        start: time.start.getTime(),
        end: time.end.getTime(),
      })
    );
    setTimes(newTimes);
  };

  const areTimesValid = (times: Time[] | undefined): boolean => {
    if (!times) return false;
    if (times.some((time: Time) => time.start < Date.now())) return false;
    return true;
  };

  const handleSubmit = async (
    e: React.MouseEvent<HTMLInputElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!pollTitle) {
      setResponse({
        status: true,
        msg: "Zadejte prosím název ankety.",
      });
      return;
    }
    if (!pollTimes || (pollTimes && pollTimes?.length === 0)) {
      setResponse({
        status: true,
        msg: "Vyberte prosím alespoň jeden termín pro pozvané.",
      });
      return;
    }
    if (!areTimesValid(pollTimes)) {
      setResponse({
        status: true,
        msg: "Zvolené termíny nesmí být v minulosti.",
      });
      return;
    }

    if (!session || !session.username) return;

    const poll: Poll = {
      title: pollTitle,
      description: pollDescription,
      location: pollLocation,
      type: pollType,
      username: session.username,
      times: pollTimes,
    };

    try {
      setDisabled(true);

      const createPollResponse = await createPoll({
        poll,
      });

      if (createPollResponse.statusCode === 201) {
        Router.push(
          "/poll/[id]",
          format({ pathname: `/poll/${createPollResponse.data._id}` })
        );
      } else {
        setDisabled(false);
        setResponse({
          status: true,
          msg: "Vytvoření ankety se nezdařilo, zkuste to prosím později.",
        });
      }
    } catch (err) {
      setDisabled(false);
      setResponse({
        status: true,
        msg: "Vytvoření ankety se nezdařilo, zkuste to prosím později.",
      });
    }
  };

  if (!session) return <></>;

  return (
    <>
      <Head>
        <title>Nová anketa | {NEXT_PUBLIC_BRAND_NAME}</title>
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Layout>
        <div className="global-page-heading">
          <Container className="global-container">Nová anketa</Container>
        </div>
        <div className="global-page-section">
          <Container className="global-container">
            <Jumbotron className="new-poll-jumbo">
              <Form.Group controlId="pollTitle">
                <Form.Label className="form-label">Název</Form.Label>
                <Form.Control
                  className="form-text"
                  type="text"
                  placeholder="O čem to bude?"
                  name="pollTitle"
                  onChange={handlePollDetailsChange}
                />
              </Form.Group>
              <Form.Group controlId="pollDescription">
                <Form.Label className="form-label">
                  Popis (nepovinné)
                </Form.Label>
                <Form.Control
                  className="form-text"
                  type="text"
                  name="pollDescription"
                  placeholder="Řekněte účastníkům více informací"
                  onChange={handlePollDetailsChange}
                />
              </Form.Group>
              <Form.Group controlId="pollLocation">
                <Form.Label className="form-label">
                  Místo (nepovinné)
                </Form.Label>
                <Form.Control
                  className="form-text"
                  type="text"
                  name="pollLocation"
                  placeholder="Kde se to bude konat?"
                  onChange={handlePollDetailsChange}
                />
              </Form.Group>
              <Form.Group controlId="pollType">
                <Form.Label className="form-label">Typ ankety</Form.Label>
                <Form.Control
                  as="select"
                  className="form-select"
                  name="pollType"
                  onChange={handlePollTypeChange}
                  defaultValue="protected"
                >
                  <option value="protected">Soukromá</option>
                  <option value="public">Veřejná</option>
                </Form.Control>
              </Form.Group>
            </Jumbotron>
            <Jumbotron className="new-poll-timeslot-jumbo">
              <AvailableTimes
                weekStartsOn="mon"
                onChange={onTimesChange}
                height="42rem"
              />
            </Jumbotron>
            <Button
              className="global-primary-button mb-3"
              onClick={handleSubmit}
              disabled={disabled}
            >
              {!disabled ? (
                `Vytvořit anketu`
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
            <ResponseMessage response={response} setResponse={setResponse} />
          </Container>
        </div>
      </Layout>
    </>
  );
};

export default New;
