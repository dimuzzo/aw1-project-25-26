import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import { useEffect, useState } from 'react';
import { Container, Alert } from 'react-bootstrap/';
import { Route, Routes, Navigate } from 'react-router-dom';

import NavHeader from "./components/NavHeader.jsx";
import HomePage from "./components/HomePage.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { LoginForm } from './components/AuthComponents.jsx';
import API from "./API.js";

function App() {
  const [user, setUser] = useState({}); //
  const [loggedIn, setLoggedIn] = useState(false); // indica se l'utente e' loggato
  const [feedback, setFeedback] = useState(''); // memorizza il feedback da mostrare

  // helper per impostare il feedback da un errore
  const setFeedbackFromError = (err) => {
    let message = '';
    if (err.message) message = err.message;
    else message = "Errore Sconosciuto";
    setFeedback(message); // assumendo un solo messaggio di errore alla volta
  };

  useEffect(() => {
    // controlla se l'utente e' loggato
    // viene eseguito solo la prima volta che il componente viene montato (cioe', quando la pagina viene (ri)caricata.)
    API.getUserInfo()
      .then(user => {
        setLoggedIn(true);
        setUser(user);  // qui hai le info dell'utente, se e' gia' loggato
      }).catch(e => {
        if (loggedIn)    // stampiamo l'errore solo se lo stato e' inconsistente (cioe', se l'app era configurata per essere loggata)
          setFeedbackFromError(e);
        setLoggedIn(false); setUser({});
      });
  }, []);

  // funzione usata per gestire il processo di login.
  // richiede username e password dentro un oggetto "credentials"
  const handleLogin = async (credentials) => {
    const user = await API.logIn(credentials);
    setUser(user); setLoggedIn(true);
    setFeedback("Benvenuto, " + user.username);
  };

  // funzione usata per gestire il processo di logout.
  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false); setUser({});
  };

  // avvia una partita Casual dalla Home
  // TODO: chiama l'API per creare la partita e mostra la griglia.
  const playCasual = (difficulty) => {
    setFeedback(`Modalità Casual (${difficulty}): avvio partita in arrivo.`);
  };

  return (
    <Container fluid className="main_container">
      <NavHeader
        user={user}
        loggedIn={loggedIn}
        logout={handleLogout}
      />
      {feedback && <Alert variant="info" dismissible onClose={() => setFeedback('')}>{feedback}</Alert>}
      <Routes>
        <Route path="/" element={<HomePage loggedIn={loggedIn} playCasual={playCasual} />} />

        <Route path="/login" element={loggedIn ? <Navigate replace to="/" /> : <LoginForm login={handleLogin} />} />

        <Route path="/dashboard" element={loggedIn ? <Dashboard /> : <Navigate replace to="/" />} />

        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </Container>
  )
}

export default App