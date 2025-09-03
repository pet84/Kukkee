import { useState } from "react";
import { NextRouter } from "next/router";
import { Button, Form, Container, Jumbotron, Spinner } from "react-bootstrap";
import { signIn, useSession, SignInResponse } from "next-auth/react";
import Link from "next/link";
import ResponseMessage from "../ResponseMessage";

const SignIn = (props: {
  router: NextRouter;
  csrfToken: string;
}): JSX.Element => {
  const { router, csrfToken } = props;

  const [userCredentials, setUserCredentials] = useState({
    username: "",
    password: "",
    csrfToken: "",
  });

  const [response, setResponse] = useState({
    status: false,
    msg: "",
  });

  const [disabled, setDisabled] = useState<boolean>(false);

  const { data: session } = useSession();

  const { username, password } = userCredentials;

  const handleSubmit = async (
    e: React.MouseEvent<HTMLInputElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!username) {
      setResponse({
        status: true,
        msg: "Zadejte prosím uživatelské jméno.",
      });
      return;
    }
    if (!password) {
      setResponse({
        status: true,
        msg: "Zadejte prosím heslo.",
      });
      return;
    }

    if (!session) {
      setDisabled(true);
      try {
        const result: SignInResponse | undefined = await signIn<"credentials">(
          "credentials",
          {
            redirect: false,
            username,
            password,
          }
        );

        if (result && !result.error) {
          if (router.query.from && typeof router.query?.from === "string") {
            router.push(router.query.from);
          } else if (
            router.query.callbackUrl &&
            typeof router.query?.callbackUrl === "string" &&
            !router.query?.callbackUrl.includes("signup")
          ) {
            router.push(router.query.callbackUrl);
          } else {
            router.replace("/");
          }
        } else {
          setDisabled(false);
          setResponse({
            status: true,
            msg: "Zkontrolujte prosím uživatelské jméno a heslo.",
          });
          return;
        }
      } catch (error) {
        setDisabled(false);
        setResponse({
          status: true,
          msg: "Zkuste to prosím znovu později.",
        });
      }
    } else {
      router.push("/");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setUserCredentials({ ...userCredentials, [name]: value });
  };

  return (
    <Container className="auth-outer-container">
      <div className="auth-inner-container">
        <div className="auth-logo">
          <img alt="logo" src="/logo.svg" />
        </div>
        <Jumbotron className="auth-first-jumbo">
          <Form>
            <input
              name="csrfToken"
              onChange={handleChange}
              type="hidden"
              defaultValue={csrfToken}
              hidden
            />
            <Form.Group controlId="username">
              <Form.Label className="form-label">Uživatelské jméno</Form.Label>
              <Form.Control
                className="form-text"
                type="text"
                placeholder="Uživatelské jméno"
                name="username"
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group controlId="password">
              <Form.Label className="form-label">Heslo</Form.Label>
              <Form.Control
                className="form-text"
                type="password"
                placeholder="•••••••••••••"
                name="password"
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group>
              <Button
                className="auth-button"
                onClick={handleSubmit}
                disabled={disabled}
                type="submit"
              >
                {!disabled ? (
                  `Přihlásit se`
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
            </Form.Group>
          </Form>
        </Jumbotron>
        <Jumbotron className="auth-second-jumbo">
          Jste tu poprvé?{" "}
          <Link href="/auth/signup">
            <a>Vytvořit účet</a>
          </Link>
          .
        </Jumbotron>
        <ResponseMessage response={response} setResponse={setResponse} />
      </div>
    </Container>
  );
};

export default SignIn;
