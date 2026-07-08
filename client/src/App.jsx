import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap';
import { Route, Routes, Navigate, useNavigate } from 'react-router';

import NavHeader from "./components/NavHeader.jsx";
import HomePage from "./components/HomePage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import GameBoard from "./components/GameBoard.jsx";
import StatsTable from "./components/StatsTable.jsx";
import { LoginForm } from './components/AuthComponents.jsx';
import API from "./API.js";

function App() {
  const [user, setUser] = useState({}); // memorizza le informazioni dell'utente loggato
  const [loggedIn, setLoggedIn] = useState(false); // indica se l'utente è loggato
  const [feedback, setFeedback] = useState(''); // memorizza il feedback da mostrare

  const navigate = useNavigate(); // navigazione tra le route

  // info delle difficoltà, mostrate solo per orientare l'utente
  // la verità (posizioni, numeri esatti) resta sul server
  const difficulties = {
    Facile: { gridSize: 7, ships: 4, torpedoes: 18 },
    Intermedio: { gridSize: 10, ships: 7, torpedoes: 28 },
    Difficile: { gridSize: 14, ships: 12, torpedoes: 45 },
  };

  // helper per impostare il feedback da un errore
  const setFeedbackFromError = (err) => {
    let message = "Errore Sconosciuto";
    // le API di gioco lanciano direttamente la stringa del messaggio (throwError), quelle auth un oggetto Error (handleInvalidResponse)
    if (typeof err === 'string') message = err;
    else if (err.message) message = err.message;
    setFeedback(message); // il feedback mantiene un solo messaggio, questo sostituisce l'eventuale precedente
  };

  useEffect(() => {
    // controlla se l'utente è loggato
    // viene eseguito solo la prima volta che la pagina viene caricata
    API.getUserInfo()
      .then(user => {
        setLoggedIn(true);
        setUser(user); // info dell'utente, se è già loggato
      }).catch(e => {
        if (loggedIn) // sempre falso fa solo da guardia
          setFeedbackFromError(e);
        setLoggedIn(false);
        setUser({});
      });
  }, []);

  // funzione usata per gestire il processo di login.
  // richiede username e password dentro un oggetto "credentials"
  const handleLogin = async (credentials) => {
    const user = await API.logIn(credentials);
    setUser(user);
    setLoggedIn(true);
    setFeedback("Avvia subito un torneo, " + user.username);
  };

  // funzione usata per gestire il processo di logout.
  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false);
    setUser({});
  };

  // avvia una partita casual dalla home: crea la partita sul server e va alla griglia
  const playCasual = async (difficulty) => {
    try {
      await API.createGame(difficulty);
      navigate('/game/casual');
    } catch (e) {
      setFeedbackFromError(e);
    }
  };

  return (
    <>
      {/* barra di navigazione */}
      <NavHeader
        user={user}
        loggedIn={loggedIn}
        logout={handleLogout}
      />
      <Container fluid className="mt-3">
        {/* messaggio di feedback (login o errori), appare se presente ed è chiudibile */}
        {feedback && <Row><Col md={12}>
          <Alert variant="info" dismissible onClose={() => setFeedback('')}>{feedback}</Alert>
        </Col></Row>}
        <Routes>
          {/* homepage */}
          <Route path="/" element={<HomePage loggedIn={loggedIn} playCasual={playCasual} difficulties={difficulties} />} />

          {/* se già loggato non ha senso rivedere il login, dunque si torna alla home */}
          <Route path="/login" element={loggedIn ? <Navigate replace to="/" /> : <LoginForm login={handleLogin} />} />

          {/* route protetta la dashboard del torneo è solo per utenti loggati */}
          <Route path="/dashboard" element={loggedIn ? <Dashboard difficulties={difficulties} /> : <Navigate replace to="/" />} />

          {/* casual e torneo condividono questa pagina, la guardia sul login sta dentro GameBoard */}
          <Route path="/game/:id" element={<GameBoard loggedIn={loggedIn} />} />

          {/* statistiche pubbliche, con o senza filtro per livello */}
          <Route path="/stats" element={<StatsTable />} />
          <Route path="/stats/:level" element={<StatsTable />} />

          {/* qualunque rotta sconosciuta torna alla home */}
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </Container>
    </>
  )
}

export default App