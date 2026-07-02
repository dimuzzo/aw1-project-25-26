import { Row, Col, Table, Alert } from "react-bootstrap";
import { useState, useEffect } from "react";
import API from "../API.js";

// le tre difficoltà, nell'ordine in cui vengono visualizzate
const DIFFICULTIES = ["Facile", "Intermedio", "Difficile"];

// pagina pubblica delle statistiche
// mostra, divise per difficoltà, le partite giocate, vinte, perse e la percentuale di vittorie di ogni giocatore
function StatsTable() {
  const [stats, setStats] = useState([]); // righe di statistiche ricevute dal server
  const [error, setError] = useState(""); // errore locale alla pagina

  // carica le statistiche dal server al primo caricamento della pagina
  useEffect(() => {
    API.getStats()
      .then(s => setStats(s))
      .catch(e => setError(e));
  }, []);

  return (
    <>
      <Row className="mb-3">
        <Col>
          <h1>Statistiche</h1>
          <p className="lead">Partite giocate, vinte, perse e percentuale di vittorie di ogni giocatore, divise per livello di difficoltà.</p>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

      <Row>
        <Col lg={8}>
          {/* una sezione per ogni livello di difficoltà */}
          {DIFFICULTIES.map((difficulty) =>
            <DifficultySection
              key={difficulty}
              difficulty={difficulty}
              rows={stats.filter(row => row.difficulty === difficulty)}
            />
          )}
        </Col>
      </Row>
    </>
  );
}

// tabella delle partite giocate a un certo livello di difficoltà
function DifficultySection(props) {
  return (
    <>
      <h2 className="pb-2 border-bottom">Livello {props.difficulty}</h2>
      {props.rows.length === 0
        ? <p className="text-muted mb-5">Ancora nessuna partita giocata a questo livello.</p>
        : <Table striped bordered hover className="mb-5">
          <thead>
            <tr>
              <th>Giocatore</th>
              <th className="text-center">Giocate</th>
              <th className="text-center">Vinte</th>
              <th className="text-center">Perse</th>
              <th className="text-center">% Vittorie</th>
            </tr>
          </thead>
          <tbody>
            {props.rows.map((row) =>
              <StatRow key={row.username} stat={row} />
            )}
          </tbody>
        </Table>}
    </>
  );
}

// mostra una riga della tabella con i dati di un giocatore al livello indicato
function StatRow(props) {
  return (
    <tr>
      <td>{props.stat.username}</td>
      <td className="text-center">{props.stat.played}</td>
      <td className="text-center">{props.stat.won}</td>
      <td className="text-center">{props.stat.lost}</td>
      <td className="text-center">{props.stat.winPct}%</td>
    </tr>
  );
}

export default StatsTable;