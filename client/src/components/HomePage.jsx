import { useState } from "react";
import { Row, Col, Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

// info delle difficoltà, mostrate solo per orientare l'utente
// la verità (posizioni, numeri esatti) resta sul server
const DIFFICULTIES = {
  Facile: { gridSize: 7, ships: 4, torpedoes: 18 },
  Intermedio: { gridSize: 10, ships: 7, torpedoes: 28 },
  Difficile: { gridSize: 14, ships: 12, torpedoes: 45 },
};

function HomePage(props) {
  const navigate = useNavigate();
  // il selettore di difficoltà appare solo dopo aver cliccato casual
  const [showCasual, setShowCasual] = useState(false);
  // mostra l'avviso di logout dopo aver cliccato casual da autenticati
  const [casualHint, setCasualHint] = useState(false);
  // mostra l'invito al login dopo aver cliccato torneo da non autenticati
  const [torneoHint, setTorneoHint] = useState(false);
  const [difficulty, setDifficulty] = useState("Facile");

  const info = DIFFICULTIES[difficulty];

  // gestisce il click sul pulsante casual, dato che chi è loggato non può giocare in casual
  const handleCasual = () => {
    if (props.loggedIn)
      setCasualHint(true);
    else
      setShowCasual(true);
  };

  // gestisce il click sul pulsante torneo
  const handleTorneo = () => {
    if (props.loggedIn)
      navigate("/dashboard");
    else
      setTorneoHint(true);
  };

  return (
    <>
      <Row className="mb-4">
        <Col>
          <h1>Battaglia Navale</h1>
          <p className="lead">Affonda tutte le navi nascoste prima di restare senza siluri!</p>
        </Col>
      </Row>

      <Row>
        {/* casual: solo per chi non è loggato (anonima, niente dati salvati) */}
        <Col md={6}>
          <h2>Casual</h2>
          <p>Partita singola e anonima. Nessun dato viene salvato.</p>
          <Button onClick={handleCasual}>Avvia partita Casual</Button>

          {/* avviso per chi è loggato: la casual è solo per utenti anonimi */}
          {props.loggedIn && casualHint &&
            <Alert variant="secondary" className="mt-3">Esci dal tuo account per giocare in Casual.</Alert>}

          {/* scelta della difficoltà, compare solo dopo il click su casual */}
          {!props.loggedIn && showCasual &&
            <Form className="mt-3">
              <Form.Group className="mb-3">
                <Form.Label>Difficoltà</Form.Label>
                {Object.keys(DIFFICULTIES).map((d) =>
                  <Form.Check
                    key={d}
                    type="radio"
                    name="difficulty"
                    id={d}
                    label={d}
                    checked={difficulty === d}
                    onChange={() => setDifficulty(d)}
                  />
                )}
              </Form.Group>
              <p>Griglia {info.gridSize}×{info.gridSize}, {info.ships} navi, {info.torpedoes} siluri.</p>
              <Button onClick={() => props.playCasual(difficulty)}>Inizia partita</Button>
            </Form>}
        </Col>

        {/* torneo: serve l'accesso, la gestione vera è nella dashboard */}
        <Col md={6}>
          <h2>Torneo</h2>
          <p>Sfida altri utenti sulla stessa griglia, condivisa tramite un codice. Serve l'accesso.</p>
          <Button onClick={handleTorneo}>Crea o Entra in un Torneo</Button>
          {torneoHint && !props.loggedIn &&
            <Alert variant="secondary" className="mt-3">Accedi per partecipare a un Torneo.</Alert>}
        </Col>
      </Row>
    </>
  );
}

export default HomePage;