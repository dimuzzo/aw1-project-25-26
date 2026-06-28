import { Row, Col } from "react-bootstrap";

// hub dei tornei per utenti autenticati
// TODO: crea un torneo (scelta difficoltà, ricevi un codice)
// oppure entra con un codice, poi naviga a /game/:id
function Dashboard() {
  return (
    <Row>
      <Col>
        <h1>Tornei</h1>
        <p>Da qui potrai creare un torneo o entrare con un codice.</p>
      </Col>
    </Row>
  );
}

export default Dashboard;