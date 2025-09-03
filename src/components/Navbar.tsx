import { Container, Nav, Navbar } from "react-bootstrap";
import { useRouter } from "next/router";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

const NavBar = (): JSX.Element => {
  const router = useRouter();

  const { data: session } = useSession();

  return (
    <Navbar className="navbar" variant="light" expand="lg" collapseOnSelect>
      <Container className="global-container">
        <Navbar.Brand href="/">
          <img alt="logo" src="/logo.svg" className="navbar-logo" />
        </Navbar.Brand>
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          className="navbar-hamburger"
        />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ml-auto">
            {session && (
              <>
                <Link href="/new">
                  <a className="navbar-link new-poll">+ Nová anketa</a>
                </Link>
                <Link href="/">
                  <a className="navbar-link">Přehled</a>
                </Link>
              </>
            )}
            {!session && router.pathname !== "/auth/signup" && (
              <Link href="/auth/signup">
                <a className="navbar-link">Registrace</a>
              </Link>
            )}
            {!session && router.pathname !== "/auth/signin" && (
              <a
                onClick={(): Promise<undefined> => signIn()}
                className="navbar-link"
                aria-hidden="true"
              >
                Přihlášení
              </a>
            )}
            {session && (
              <a
                onClick={(): Promise<undefined> =>
                  signOut({ callbackUrl: "/auth/signin" })
                }
                className="navbar-link"
                aria-hidden="true"
              >
                Odhlásit se
              </a>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavBar;
