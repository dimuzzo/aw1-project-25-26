import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

import { useEffect, useState } from 'react';
import { Container } from 'react-bootstrap/';
import { Route, Routes, Navigate } from 'react-router-dom';

import Header from "./components/Header.jsx";
import { LoginForm } from './components/Auth.jsx';
import API from "./API.js";

function App() {
  const [user, setUser] = useState({}); //
  const [loggedIn, setLoggedIn] = useState(false); // indica se l'utente e' loggato
  const [feedback, setFeedback] = useState(''); // memorizza il feedback da mostrare

  // Funzione helper per impostare il feedback da un errore
  const setFeedbackFromError = (err) => {
    let message = '';
    if (err.message) message = err.message;
    else message = "Errore Sconosciuto";
    setFeedback(message); // Assumendo un solo messaggio di errore alla volta
  };

  useEffect(() => {
    // Controlla se l'utente e' loggato
    // Viene eseguito solo la prima volta che il componente viene montato (cioe', quando la pagina viene (ri)caricata.)
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

  // Funzione usata per gestire il processo di login.
  // Richiede username e password dentro un oggetto "credentials".
  const handleLogin = async (credentials) => {
    const user = await API.logIn(credentials);
    setUser(user); setLoggedIn(true);
    setFeedback("Benvenuto, " + user.username);
  };

  // Funzione usata per gestire il processo di logout.
  const handleLogout = async () => {
    await API.logOut();
    setLoggedIn(false); setUser({});
  };

  return (
    <Container fluid className="main_container">
      <Header
        user={user}
        loggedIn={loggedIn}
        handleLogout={handleLogout}
      />
      <Routes>
        <Route path="/" element="Home" />

        <Route path="/login" element={<LoginForm login={handleLogin} />} />

        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </Container>
  )
}

export default App