import { useState } from "react";
import { Form, Button, Row, Col, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router"

export function LoginForm(props) {
    const [username, setUsername] = useState(""); // nome utente inserito nel form
    const [password, setPassword] = useState(""); // password inserita nel form
    const [error, setError] = useState(""); // eventuale messaggio di errore del login

    const handleSubmit = async (event) => {
        event.preventDefault(); // blocca il refresh della pagina
        const credentials = { username, password };

        try {
            await props.login(credentials); // login in api.js non è sincrono
        } catch {
            setError('Credenziali non valide'); // se il login fallisce, mostra l'errore
        }
    }

    return (
        <Row>
            <Col md={6}>
                <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="username" className="mb-3">
                        <Form.Label>Username</Form.Label>
                        <Form.Control type="text" name="username" required value={username} onChange={(ev) => setUsername(ev.target.value)} />
                    </Form.Group>
                    <Form.Group controlId="password" className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control type="password" name="password" required value={password} onChange={(ev) => setPassword(ev.target.value)} />
                    </Form.Group>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Button type="submit">Login</Button>
                    <Link className="btn btn-danger mx-2 my-2" to={"/"}>Cancel</Link>
                </Form>
            </Col>
        </Row>
    );
}

function LogoutButton(props) {
    return (
        <Button variant="outline-light" onClick={props.logout}>Logout</Button>
    )
}

function LoginButton() {
    const navigate = useNavigate();
    return (
        <Button variant="outline-light" onClick={() => navigate('/login')}>Login</Button>
    )
}

export { LogoutButton, LoginButton };