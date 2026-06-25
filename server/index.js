// imports
import express from "express";
import morgan from 'morgan'; // middleware per il logging
import cors from 'cors'; // middleware per il CORS
import { check, validationResult } from 'express-validator'; // middleware per la validazione
import passport from "passport"; // middleware per l'autenticazione
import session from "express-session"; // middleware per la strategia di autenticazione
import LocalStrategy from "passport-local"; // strategia di autenticazione locale
import UserDao from "./dao-users.js"; // dao per gli utenti

const userDao = new UserDao();

// inizializza express
const app = express();

/* middlewares */
app.use(morgan('dev'));
app.use(express.json());


/* imposta e abilita il cross origin resource sharing (CORS) */
const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));


/* passport */
// strategia di autenticazione locale (con username e password)
passport.use(new LocalStrategy(async function verify(username, password, callback) {
  const user = await userDao.getUserByCredentials(username, password);
  if (!user) {
    return callback(null, false, 'Username o password non corretti');
  }
  return callback(null, user);
}));

// salva l'utente nella sessione
passport.serializeUser(function (user, callback) {
  callback(null, user);
});

// recupera l'utente salvato precedentemente nella sessione
passport.deserializeUser(function (user, callback) {
  callback(null, user);
});


/* express-session */
// crea una sessione
app.use(session({
  secret: "This is a very secret information used to initialize the session!",
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.authenticate('session')); // ripristina l'utente dopo ogni request

// definisce il middleware di verifica dell'autenticazione
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Non autorizzato' });
};

// definisce il middleware di verifica della non autenticazione
const isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Non autorizzato' });
};

// definisce il middleware di verifica della difficoltà
const isDifficultyValid = (req, res, next) => {
  const { difficulty } = req.body;
  if (difficulty === 'Facile' || difficulty === 'Intermedio' || difficulty === 'Difficile') {
    return next();
  }
  return res.status(422).json({ error: 'Difficoltà non valida' });
};


/* API utenti */
// POST /api/sessions: login dell'utente
app.post('/api/sessions', function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info }); // credenziali errate

    // login dell'utente avvenuto con successo, viene stabilita una sessione
    req.login(user, function (err) {
      if (err) return next(err);
      // restituisce i dati dell'utente loggato
      return res.json(req.user);
    });
  })(req, res, next);
})

// GET /api/sessions/current: verifica se l'utente è loggato
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) return res.json(req.user);
  return res.status(401).json({ error: 'Non autenticato' });
});

// DELETE /api/sessions/current: logout dell'utente
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.end();
  });
});

// attivare il server
const port = 3001;
app.listen(port, () => { console.log(`Server attivo all'indirizzo http://localhost:${port}`); });