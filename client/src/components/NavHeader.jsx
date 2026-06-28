import { Container, Navbar } from "react-bootstrap";
import { Link } from "react-router-dom";
import { LoginButton, LogoutButton } from "./AuthComponents.jsx";

function NavHeader(props) {
    return (
        <Navbar bg="primary" data-bs-theme="dark" className="mb-3">
            <Container fluid>
                {/* nome del gioco cliccabile che porta alla homepage */}
                <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
                    <i className="bi bi-water me-2"></i>
                    Battaglia Navale
                </Navbar.Brand>
                {/* pulsante statistiche (per tutti), nome utente se loggato e pulsante login/logout */}
                <div className="d-flex align-items-center gap-3">
                    <Link to="/stats" className="link-light text-decoration-none">Statistiche</Link>
                    {props.loggedIn
                        ? <span className="text-light me-2">Ciao, {props.user.username}</span>
                        : null}
                    {props.loggedIn
                        ? <LogoutButton logout={props.logout} />
                        : <LoginButton />}
                </div>
            </Container>
        </Navbar>
    );
}

export default NavHeader;