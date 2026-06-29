import { useState } from "react";
import { Row, Col, Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import API from "../API.js";

// info delle difficoltà, mostrate solo per orientare l'utente
const DIFFICULTIES = {
  Facile: { gridSize: 7, ships: 4, torpedoes: 18 },
  Intermedio: { gridSize: 10, ships: 7, torpedoes: 28 },
  Difficile: { gridSize: 14, ships: 12, torpedoes: 45 },
};

// hub dei tornei per utenti autenticati: crea un torneo, mostrando il codice, oppure entra con un codice
function Dashboard() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState("Facile");
  const [code, setCode] = useState("");
  const [created, setCreated] = useState({}); // { code, gameId } del torneo appena creato (vuoto finché non se ne crea uno)
  const [error, setError] = useState(""); // errore locale alla pagina

  const info = DIFFICULTIES[difficulty];

  // crea un torneo e mostra il codice da condividere, senza reindirizzare subito
  const handleCreate = async () => {
    try {
      setError("");
      const game = await API.createTournament(difficulty);
      setCreated({ code: game.code, gameId: game.gameId });
    } catch (e) {
      setError(e);
    }
  };

  // entra in un torneo con il codice e va direttamente alla partita
  const handleJoin = async (event) => {
    event.preventDefault();
    try {
      setError("");
      const game = await API.joinTournament(code.trim());
      navigate(`/game/${game.gameId}`);
    } catch (e) {
      setError(e);
    }
  };

  return (
    <>
      <Row className="mb-4">
        <Col>
          <h1>Tornei</h1>
          <p className="lead">Crea un torneo e condividi il codice, oppure entra in uno esistente.</p>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

      <Row>
        {/* creazione di un torneo */}
        <Col md={6}>
          <h2>Crea un torneo</h2>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Difficoltà</Form.Label>
              {Object.keys(DIFFICULTIES).map((d) =>
                <Form.Check
                  key={d}
                  type="radio"
                  name="difficulty"
                  id={`create-${d}`}
                  label={d}
                  checked={difficulty === d}
                  onChange={() => setDifficulty(d)}
                />
              )}
            </Form.Group>
            <p>Griglia {info.gridSize}×{info.gridSize}, {info.ships} navi, {info.torpedoes} siluri.</p>
            <Button onClick={handleCreate}>Crea torneo</Button>
          </Form>

          {/* codice del torneo appena creato, da condividere con gli altri giocatori */}
          {created.code &&
            <Alert variant="success" className="mt-3">
              <p>Torneo creato. Condividi questo codice con gli altri giocatori:</p>
              <h3>{created.code}</h3>
              <Button variant="primary" onClick={() => navigate(`/game/${created.gameId}`)}>
                Vai alla partita
              </Button>
            </Alert>}
        </Col>

        {/* ingresso in un torneo esistente tramite codice */}
        <Col md={6}>
          <h2>Entra in un torneo</h2>
          <Form onSubmit={handleJoin}>
            <Form.Group className="mb-3">
              <Form.Label>Codice del torneo</Form.Label>
              <Form.Control
                type="text"
                value={code}
                onChange={(ev) => setCode(ev.target.value.toUpperCase())}
                required
              />
            </Form.Group>
            <Button type="submit">Entra</Button>
          </Form>
        </Col>
      </Row>
    </>
  );
}

export default Dashboard;