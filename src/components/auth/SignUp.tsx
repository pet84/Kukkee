import { useState } from "react";
import { Button, Form, Container, Jumbotron, Spinner } from "react-bootstrap";
import Router from "next/router";
import { signIn } from "next-auth/react";
import ResponseMessage from "../ResponseMessage";
import { signupUser } from "../../utils/api/server";
import { validEmail, validPassword } from "../../helpers/auth";

const SignUp = (): JSX.Element => {
  const [userCredentials, setUserCredentials] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [response, setResponse] = useState({
    status: false,
    msg: "",
  });

  const [disabled, setDisabled] = useState<boolean>(false);

  const { username, email, password } = userCredentials;

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
    if (!email) {
      setResponse({
        status: true,
        msg: "Zadejte prosím e-mailovou adresu.",
      });
      return;
    }
    if (!validEmail.test(email)) {
      setResponse({
        status: true,
        msg: "Zadejte prosím platnou e-mailovou adresu.",
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
    if (!validPassword.test(password)) {
      setResponse({
        status: true,
        msg:
          "Heslo musí mít 8–15 znaků a obsahovat alespoň jedno malé písmeno, jedno velké písmeno, jednu číslici a jeden speciální znak.",
      });
      return;
    }

    setDisabled(true);
    try {
      const signupUserResponse = await signupUser({
        username,
        email,
        password,
      });

      if (signupUserResponse.statusCode === 201) {
        await signIn("credentials", {
          redirect: false,
          username,
          password,
        });
        Router.push("/");
      } else if (signupUserResponse.statusCode === 422) {
        setDisabled(false);
        setResponse({
          status: true,
          msg: signupUserResponse.data.message,
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
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;

    setUserCredentials({
      ...userCredentials,
      [name]: value,
    });
  };

  return (
    <Container className="auth-outer-container">
      <div className="auth-inner-container">
        <div className="auth-logo">
          <img alt="logo" src="/logo.svg" />
        </div>
        <Jumbotron className="auth-first-jumbo">
          <Form>
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
            <Form.Group controlId="email">
              <Form.Label className="form-label">E-mailová adresa</Form.Label>
              <Form.Control
                className="form-text"
                type="text"
                placeholder="E-mailová adresa"
                name="email"
                onChange={handleChange}
              />
            </Form.Group>
            <Form.Group controlId="password">
              <Form.Label className="form-label">Heslo</Form.Label>
              <Form.Control
                className="form-text "
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
                  `Vytvořit účet`
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
          Už máte účet?{" "}
          <a onClick={(): Promise<undefined> => signIn()} aria-hidden="true">
            Přihlásit se
          </a>
          .
        </Jumbotron>
        <ResponseMessage response={response} setResponse={setResponse} />
      </div>
    </Container>
  );
};

export default SignUp;
