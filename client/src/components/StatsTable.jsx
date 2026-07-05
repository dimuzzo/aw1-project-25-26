import { Row, Col, Table, Alert } from "react-bootstrap";
import { useState, useEffect } from "react";
import { useParams } from "react-router";
import API from "../API.js";
import Filters from "./Filters.jsx";

// le tre difficoltà, nell'ordine in cui vengono visualizzate
const DIFFICULTIES = ["Facile", "Intermedio", "Difficile"];

// pagina pubblica delle statistiche
// mostra, divise per difficoltà, le partite giocate, vinte, perse e la percentuale di vittorie di ogni giocatore
function StatsTable() {
  const [stats, setStats] = useState([]); // righe delle statistiche ricevute dal server
  const [error, setError] = useState(""); // errore locale alla pagina
  const { level } = useParams(); // livello selezionato dalla barra dei filtri (undefined se "tutti i livelli")

  // carica le statistiche dal server al primo caricamento della pagina
  useEffect(() => {
    API.getStats()
      .then(s => setStats(s))
      .catch(e => setError(e));
  }, []);

  // livelli da mostrare, solo quello selezionato, oppure tutti se non c'è un filtro valido nell'URL
  const shown = DIFFICULTIES.includes(level) ? [level] : DIFFICULTIES;

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
        {/* sidebar con i filtri per livello, a sinistra */}
        <Col md={3}>
          <Filters levels={DIFFICULTIES} />
        </Col>
        {/* le tabelle delle statistiche, a destra */}
        <Col md={9} lg={8}>
          {/* una sezione per ogni livello da mostrare */}
          {shown.map((difficulty) =>
            <DifficultySection
              key={difficulty} // chiave univoca per ogni sezione
              difficulty={difficulty} // nome del livello
              rows={stats.filter(row => row.difficulty === difficulty)} // statistiche relative al livello
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
      <h2>Livello {props.difficulty}</h2>
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