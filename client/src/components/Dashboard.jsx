import { useState } from "react";
import { Row, Col, Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router";
import API from "../API.js";

// pagina dei tornei per utenti autenticati: crea un torneo, mostrando il codice, oppure entra con un codice
function Dashboard(props) {
  const navigate = useNavigate();
  const DIFFICULTIES = props.difficulties; // info difficoltà, arrivano da App (i valori veri li decide il server)

  const [difficulty, setDifficulty] = useState("Facile"); // difficoltà del torneo da creare
  const [code, setCode] = useState(""); // codice inserito per entrare nel torneo
  const [created, setCreated] = useState({}); // { code, gameId } del torneo appena creato (vuoto finché non se ne crea uno)
  const [error, setError] = useState(""); // errore locale alla pagina

  const info = DIFFICULTIES[difficulty]; // info sulla difficoltà scelta

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
          <p className="lead">Crea un Torneo e condividi il codice, oppure entra in uno esistente.</p>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

      <Row>
        {/* creazione di un torneo */}
        <Col md={6}>
          <h2>Crea un Torneo</h2>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Difficoltà:</Form.Label>
              {/* ciclo sulle difficoltà, una per ogni opzione */}
              {Object.keys(DIFFICULTIES).map((d) =>
                <Form.Check
                  key={d} // obbligatorio per ogni elemento generato da map
                  type="radio" // opzione a scelta singola
                  name="difficulty" // raggruppa le tre opzioni così se ne seleziona una sola
                  id={`create-${d}`} // collega la label all'input, cliccando sul testo avviene la selezione
                  label={d} // nome della difficoltà
                  checked={difficulty === d} // mantiene la selezione finché non si sceglie un'altra opzione
                  onChange={() => setDifficulty(d)}
                />
              )}
            </Form.Group>
            <p>Griglia {info.gridSize}×{info.gridSize} | {info.ships} navi | {info.torpedoes} siluri</p>
            <Button onClick={handleCreate}>Crea Torneo</Button>
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
          <h2>Entra in un Torneo</h2>
          <Form onSubmit={handleJoin}>
            <Form.Group className="mb-3">
              <Form.Label>Codice del Torneo</Form.Label>
              <Form.Control
                type="text" // campo di testo
                value={code} // valore dell'input che proviene dallo useState di code
                onChange={(ev) => setCode(ev.target.value.toUpperCase())} // quando si digita il codice, forza il maiuscolo
                required // blocca l'invio se è vuoto
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