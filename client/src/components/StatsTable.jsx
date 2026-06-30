import { Row, Col, Table, Alert } from "react-bootstrap";
import { useState, useEffect } from "react";
import API from "../API.js";

// pagina pubblica delle statistiche: mostra, per ogni giocatore e difficoltà,
// partite giocate, vinte, perse e percentuale di vittorie
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
      <Row className="mb-4">
        <Col>
          <h1>Statistiche</h1>
          <p className="lead">Partite di tutti i giocatori, divise per livello di difficoltà.</p>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError("")}>{error}</Alert>}

      <Row>
        <Col lg={10} className="mx-auto">
          <Table striped>
            <thead>
              <tr>
                <th>Giocatore</th>
                <th>Difficoltà</th>
                <th>Giocate</th>
                <th>Vinte</th>
                <th>Perse</th>
                <th>% Vittorie</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((row) =>
                <StatRow key={`${row.username}-${row.difficulty}`} stat={row} />
              )}
            </tbody>
          </Table>
        </Col>
      </Row>
    </>
  );
}

// una riga della tabella: i dati di un giocatore a una certa difficoltà
function StatRow(props) {
  return (
    <tr>
      <td>{props.stat.username}</td>
      <td>{props.stat.difficulty}</td>
      <td>{props.stat.played}</td>
      <td>{props.stat.won}</td>
      <td>{props.stat.lost}</td>
      <td>{props.stat.winPct}%</td>
    </tr>
  );
}

export default StatsTable;