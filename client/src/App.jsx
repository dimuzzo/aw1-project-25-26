import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import { useEffect, useState } from 'react';
import { Container, Row, Col, Alert } from 'react-bootstrap/';
import { Route, Routes, Navigate, useNavigate } from 'react-router-dom';

import NavHeader from "./components/NavHeader.jsx";
import HomePage from "./components/HomePage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import GameBoard from "./components/GameBoard.jsx";
import StatsTable from "./components/StatsTable.jsx";
import { LoginForm } from './components/AuthComponents.jsx';
import API from "./API.js";

function App() {
  const [user, setUser] = useState({}); //
  const [loggedIn, setLoggedIn] = useState(false); // indica se l'utente è loggato
  const [feedback, setFeedback] = useState(''); // memorizza il feedback da mostrare

  const navigate = useNavigate();

  // helper per impostare il feedback da un errore
  const setFeedbackFromError = (err) => {
    let message = "Errore Sconosciuto";
    // le API di gioco lanciano direttamente la stringa del messaggio, quelle auth un oggetto Error
    if (typeof err === 'string') message = err;
    else if (err.message) message = err.message;
    setFeedback(message); // assumendo un solo messaggio di errore alla volta
  };

  useEffect(() => {
    // controlla se l'utente è loggato
    // viene eseguito solo la prima volta che la pagina viene (ri)caricata
    API.getUserInfo()
      .then(user => {
        setLoggedIn(true);
        setUser(user); // info dell'utente, se è già loggato
      }).catch(e => {
        if (loggedIn) // stampa l'errore solo se lo stato è inconsistente (cioè, se l'app era configurata per essere loggata)
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
      <NavHeader
        user={user}
        loggedIn={loggedIn}
        logout={handleLogout}
      />
      <Container fluid className="mt-3">
        {feedback && <Row><Col md={12}>
          <Alert variant="info" dismissible onClose={() => setFeedback('')}>{feedback}</Alert>
        </Col></Row>}
        <Routes>
          <Route path="/" element={<HomePage loggedIn={loggedIn} playCasual={playCasual} />} />

          <Route path="/login" element={loggedIn ? <Navigate replace to="/" /> : <LoginForm login={handleLogin} />} />

          <Route path="/dashboard" element={loggedIn ? <Dashboard /> : <Navigate replace to="/" />} />

          <Route path="/game/:id" element={<GameBoard />} />

          <Route path="/stats" element={<StatsTable />} />

          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </Container>
    </>
  )
}

export default App