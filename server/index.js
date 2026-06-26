// imports
import express from "express";
import morgan from 'morgan'; // middleware per il logging
import cors from 'cors'; // middleware per il CORS
import { check, validationResult } from 'express-validator'; // middleware per la validazione
import passport from "passport"; // middleware per l'autenticazione
import session from "express-session"; // middleware per la strategia di autenticazione
import LocalStrategy from "passport-local"; // strategia di autenticazione locale
import UserDao from "./dao-users.js"; // dao per gli utenti
import GameDao from "./dao-games.js"; // dao per le partite
import placeShipsOnGrid from "./gameLogic.js";


const userDao = new UserDao();
const gameDao = new GameDao();
const DIFFICULTY_CONFIG = {
  'Facile': { gridSize: 7, shipSizes: [2, 2, 3, 3], torpedoes: 18 },
  'Intermedio': { gridSize: 10, shipSizes: [2, 2, 3, 3, 4, 4, 5], torpedoes: 28 },
  'Difficile': { gridSize: 14, shipSizes: [2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5], torpedoes: 45 }
};


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
// POST /api/sessions : login dell'utente
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

// GET /api/sessions/current : verifica se l'utente è loggato
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) return res.json(req.user);
  return res.status(401).json({ error: 'Non autenticato' });
});

// DELETE /api/sessions/current : logout dell'utente
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.end();
  });
});


/* API partite e tornei */

// POST /api/games : avvia una partita Casual
app.post('/api/games', (req, res) => {

});

// POST /api/tournaments : crea un torneo
app.post('/api/tournaments', isLoggedIn, isDifficultyValid, async (req, res) => {
  const { difficulty } = req.body;
  const config = DIFFICULTY_CONFIG[difficulty];

  try {
    // genera la griglia e posiziona le navi
    const { ships } = placeShipsOnGrid(config.gridSize, config.shipSizes);

    // genera un codice univoco di 6 caratteri maiuscoli per il torneo
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // crea il torneo nel database
    const tournamentId = await gameDao.createTournament(difficulty, config.gridSize, JSON.stringify(ships), code);

    // crea la partita del creatore nel database
    const gameId = await gameDao.createGame(req.user.id, tournamentId, config.torpedoes);

    res.status(201).json({ code, gameId, gridSize: config.gridSize, ships: ships.map(s => ({ size: s.size })), torpedoesRemaining: config.torpedoes });
  } catch (err) {
    res.status(500).json({ error: 'Errore nella creazione del torneo' });
  }
})

// POST /api/tournaments/:code/join : partecipa a un torneo
app.post('/api/tournaments/:code/join', isLoggedIn, async (req, res) => {
  const { code } = req.params;
  const { id: userId } = req.user;

  try {
    // cerca il torneo nel database
    const tournament = await gameDao.getTournamentByCode(code);
    if (tournament.error) {
      return res.status(404).json({ error: 'Torneo non trovato' });
    }

    const config = DIFFICULTY_CONFIG[tournament.difficulty];

    const ships = JSON.parse(tournament.ships);

    // crea la partita nel database del giocatore
    const gameId = await gameDao.createGame(userId, tournament.id, config.torpedoes);

    res.status(201).json({ gameId, gridSize: tournament.grid_size, ships: ships.map(s => ({ size: s.size })), torpedoesRemaining: config.torpedoes });
  } catch (err) {
    res.status(500).json({ error: 'Errore nell\'adesione al torneo' });
  }
});

// GET /api/games/:id : ottieni lo stato di una partita
app.get('/api/games/:id', (req, res) => {

});

// POST /api/games/:id/shots : lancia un siluro
app.post('/api/games/:id/shots', (req, res) => {

});

// GET /api/games/:id/ships : ottieni le posizioni delle navi di una partita (solo alla fine della partita)
app.get('/api/games/:id/ships', (req, res) => {

});

// GET /api/stats : ottieni le statistiche dell'utente
app.get('/api/stats', isLoggedIn, async (req, res) => {
  try {
    const stats = await gameDao.getStats(req.user.id);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero delle statistiche' });
  }
});


// attivare il server
const port = 3001;
app.listen(port, () => { console.log(`Server attivo all'indirizzo http://localhost:${port}`); });