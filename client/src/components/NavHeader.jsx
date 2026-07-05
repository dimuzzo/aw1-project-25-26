import { Container, Navbar } from "react-bootstrap";
import { Link } from "react-router";
import { LoginButton, LogoutButton } from "./AuthComponents.jsx";

function NavHeader(props) {
    return (
        <Navbar bg="primary" data-bs-theme="dark" className="shadow-sm">
            <Container fluid>
                {/* nome del gioco cliccabile che porta alla homepage */}
                <Link to="/" className="navbar-brand d-flex align-items-center fw-semibold">
                    <i className="bi bi-water me-2"></i>
                    Battaglia Navale
                </Link>
                {/* statistiche a sinistra (per tutti) */}
                <Link to="/stats" className="stats-link me-auto">Statistiche</Link>
                {/* pulsante login/logout e saluto se loggato a destra */}
                <div className="d-flex align-items-center gap-2">
                    {props.loggedIn && <span className="navbar-text text-light me-1">Capitan {props.user.username} a rapporto!</span>}
                    {props.loggedIn ? <LogoutButton logout={props.logout} /> : <LoginButton />}
                </div>
            </Container>
        </Navbar>
    );
}

export default NavHeader;