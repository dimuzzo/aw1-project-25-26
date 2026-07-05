import { useState } from "react";
import { Row, Col, Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router";

// pagina iniziale: si sceglie la modalità (casual o torneo) e, per la casual, la difficoltà
function HomePage(props) {
  const navigate = useNavigate();
  const DIFFICULTIES = props.difficulties; // info difficoltà, provengono da App (i valori veri li decide il server)

  const [showCasual, setShowCasual] = useState(false); // il selettore di difficoltà appare solo dopo aver cliccato casual
  const [casualHint, setCasualHint] = useState(false); // mostra l'avviso di logout dopo aver cliccato casual da autenticati
  const [torneoHint, setTorneoHint] = useState(false); // mostra l'invito al login dopo aver cliccato torneo da non autenticati
  const [difficulty, setDifficulty] = useState("Facile"); // difficoltà scelta per la partita casual

  const info = DIFFICULTIES[difficulty]; // info sulla difficoltà scelta

  // gestisce il click sul pulsante casual, dato che chi è loggato non può giocare in casual
  const handleCasual = () => {
    if (props.loggedIn) setCasualHint(true);
    else setShowCasual(true);
  };

  // gestisce il click sul pulsante torneo
  const handleTorneo = () => {
    if (props.loggedIn) navigate("/dashboard");
    else setTorneoHint(true);
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
        <Col md={6} className="mb-4 mb-md-0">
          <h2>Casual</h2>
          <p>Partita singola e anonima. Nessun dato viene salvato.</p>
          <Button onClick={handleCasual}>Nuova partita Casual</Button>

          {/* avviso per chi è loggato: la casual è solo per utenti anonimi */}
          {props.loggedIn && casualHint &&
            <div><Alert variant="secondary" className="mt-3 d-inline-block">Esci dal tuo account per giocare in Casual.</Alert></div>}

          {/* scelta della difficoltà, compare solo dopo il click su casual */}
          {!props.loggedIn && showCasual &&
            <Form className="mt-3">
              <Form.Group className="mb-3">
                <Form.Label>Difficoltà:</Form.Label>
                {/* ciclo sulle difficoltà, una per ogni opzione */}
                {Object.keys(DIFFICULTIES).map((d) =>
                  <Form.Check
                    key={d} // obbligatorio per ogni elemento generato da map
                    type="radio" // opzione a scelta singola
                    name="difficulty" // raggruppa le tre opzioni così se ne seleziona una sola
                    id={d} // collega la label all'input, cliccando sul testo avviene la selezione
                    label={d} // nome della difficoltà
                    checked={difficulty === d} // mantiene la selezione finché non si sceglie un'altra opzione
                    onChange={() => setDifficulty(d)}
                  />
                )}
              </Form.Group>
              <p>Griglia {info.gridSize}×{info.gridSize} | {info.ships} navi | {info.torpedoes} siluri</p>
              <Button onClick={() => props.playCasual(difficulty)}>Inizia partita</Button>
            </Form>}
        </Col>

        {/* torneo: serve l'accesso, la gestione vera è nella dashboard */}
        <Col md={6}>
          <h2>Torneo</h2>
          <p>Sfida altri utenti sulla stessa griglia, condivisa tramite un codice. Serve l'accesso.</p>
          <Button onClick={handleTorneo}>Crea o Entra in un Torneo</Button>
          {torneoHint && !props.loggedIn &&
            <div><Alert variant="secondary" className="mt-3 d-inline-block">Accedi per partecipare a un Torneo.</Alert></div>}
        </Col>
      </Row>
    </>
  );
}

export default HomePage;