// imports
import express from "express";
import morgan from 'morgan'; // middleware per il logging
import cors from 'cors'; // middleware per il CORS
import { check, validationResult } from 'express-validator'; // middleware per la validazione
import passport from "passport"; // middleware per l'autenticazione
import session from "express-session"; // middleware per la gestione delle sessioni
import LocalStrategy from "passport-local"; // strategia di autenticazione locale
import UserDao from "./dao-users.js"; // dao per gli utenti
import GameDao from "./dao-games.js"; // dao per le partite
import placeShipsOnGrid, { computeShotResult, applyShot } from "./gameLogic.js"; // logica di gioco


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


/* CORS: client (5173) e server (3001) sono due origini diverse, quindi senza questo permesso
  esplicito il browser bloccherebbe le richieste tra le due porte */
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

// contiene solo il messaggio di errore nella risposta
const errorFormatter = ({ msg }) => msg;

// gestisce gli errori di validazione restituendo 422
const onValidationErrors = (validationResult, res) => {
  const errors = validationResult.formatWith(errorFormatter);
  return res.status(422).json({ validationErrors: errors.mapped() });
};

// regola di validazione per la difficoltà
const difficultyValidation = [
  check('difficulty').isIn(['Facile', 'Intermedio', 'Difficile'])
];

// helper che mantiene solo le dimensioni delle navi, mai le posizioni
const sizesOnly = (ships) => ships.map(s => ({ size: s.size }));


/* API utenti */

// POST /api/sessions - login dell'utente
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

// GET /api/sessions/current - verifica se l'utente è loggato
app.get('/api/sessions/current', (req, res) => {
  if (req.isAuthenticated()) return res.json(req.user);
  return res.status(401).json({ error: 'Non autenticato' });
});

// DELETE /api/sessions/current - logout dell'utente
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => {
    res.end();
  });
});


/* API partite */

// POST /api/games - avvia una partita casual (solo per utenti anonimi, stato salvato in sessione)
app.post('/api/games', isNotLoggedIn, difficultyValidation, (req, res) => {
  const invalidFields = validationResult(req);
  if (!invalidFields.isEmpty()) {
    return onValidationErrors(invalidFields, res);
  }
  const { difficulty } = req.body;
  const config = DIFFICULTY_CONFIG[difficulty];

  try {
    // genera la griglia e posiziona le navi
    const { ships } = placeShipsOnGrid(config.gridSize, config.shipSizes);

    // salva lo stato della partita nella sessione
    req.session.game = { difficulty, gridSize: config.gridSize, ships, torpedoesRemaining: config.torpedoes, shots: [], status: 'attivo' };

    // invia al client solo i dati non sensibili durante la partita
    res.status(201).json({ gameId: 'casual', gridSize: config.gridSize, ships: sizesOnly(ships), torpedoesRemaining: config.torpedoes, shots: [], status: 'attivo' });
  } catch (err) {
    res.status(500).json({ error: 'Errore nella creazione della partita' });
  }
});

// POST /api/tournaments - crea un torneo
app.post('/api/tournaments', isLoggedIn, difficultyValidation, async (req, res) => {
  const invalidFields = validationResult(req);
  if (!invalidFields.isEmpty()) {
    return onValidationErrors(invalidFields, res);
  }
  const { difficulty } = req.body;
  const config = DIFFICULTY_CONFIG[difficulty];

  try {
    // genera la griglia e posiziona le navi
    const { ships } = placeShipsOnGrid(config.gridSize, config.shipSizes);

    // genera un codice casuale di 6 caratteri maiuscoli (base36 per usare cifre e lettere)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // crea il torneo nel database (le navi devono essere passate come stringhe JSON nel db)
    const tournamentId = await gameDao.createTournament(difficulty, config.gridSize, JSON.stringify(ships), code);

    // crea la partita del creatore nel database
    const gameId = await gameDao.createGame(req.user.id, tournamentId, config.torpedoes);

    res.status(201).json({ code, gameId, gridSize: config.gridSize, ships: sizesOnly(ships), torpedoesRemaining: config.torpedoes, shots: [], status: 'attivo' });
  } catch (err) {
    res.status(500).json({ error: 'Errore nella creazione del torneo' });
  }
})

// POST /api/tournaments/:code/join - partecipa a un torneo
app.post('/api/tournaments/:code/join', isLoggedIn, async (req, res) => {
  const { code } = req.params;
  const { id: userId } = req.user;

  try {
    // cerca il torneo nel database
    const tournament = await gameDao.getTournamentByCode(code);
    if (tournament.error) {
      return res.status(404).json({ error: 'Torneo non trovato' });
    }

    // se l'utente ha già una partita in questo torneo non può accedervi di nuovo
    const existing = await gameDao.getGameByTournament(userId, tournament.id);
    if (existing) {
      return res.status(409).json({ error: 'Hai già una partita in questo torneo' });
    }

    const config = DIFFICULTY_CONFIG[tournament.difficulty];

    const ships = JSON.parse(tournament.ships);

    // crea la partita nel database del giocatore
    const gameId = await gameDao.createGame(userId, tournament.id, config.torpedoes);

    res.status(201).json({ gameId, gridSize: tournament.grid_size, ships: sizesOnly(ships), torpedoesRemaining: config.torpedoes, shots: [], status: 'attivo' });
  } catch (err) {
    res.status(500).json({ error: 'Errore nell\'adesione al torneo' });
  }
});

// GET /api/games/:id - ottieni lo stato di una partita (senza le posizioni delle navi)
app.get('/api/games/:id', async (req, res) => {
  const { id } = req.params;

  // casual: stato nella sessione
  if (id === 'casual') {
    const game = req.session.game;
    if (!game) {
      return res.status(404).json({ error: 'Partita non trovata' });
    }
    return res.json({
      gridSize: game.gridSize,
      ships: sizesOnly(game.ships),
      torpedoesRemaining: game.torpedoesRemaining,
      status: game.status,
      shots: game.shots
    });
  }

  // torneo: stato nel DB, serve autenticazione e proprietà
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  try {
    const game = await gameDao.getGameById(id, req.user.id);
    if (game.error) {
      return res.status(404).json({ error: 'Partita non trovata' });
    }
    // i tiri vengono da una tabella separata
    const shots = await gameDao.getShotsByGame(id);
    // le posizioni complete restano nel server, al client vengono mandate solo le dimensioni
    const ships = JSON.parse(game.ships);
    return res.json({
      gridSize: game.grid_size,
      ships: sizesOnly(ships),
      torpedoesRemaining: game.torpedoes_remaining,
      status: game.status,
      shots
    });
  } catch (err) {
    return res.status(500).json({ error: 'Errore nel recupero della partita' });
  }
});

// POST /api/games/:id/shots - lancia un siluro
// .toInt() converte le coordinate in numero, dato che computeShotResult le confronta con === e con una stringa fallirebbe
app.post('/api/games/:id/shots',
  [check('row').isInt({ min: 0 }).toInt(), check('col').isInt({ min: 0 }).toInt()],
  async (req, res) => {
    const invalidFields = validationResult(req);
    if (!invalidFields.isEmpty()) {
      return onValidationErrors(invalidFields, res);
    }

    const { id } = req.params;
    const { row, col } = req.body;

    // casual: stato nella sessione
    if (id === 'casual') {
      const game = req.session.game;
      if (!game) {
        return res.status(404).json({ error: 'Partita non trovata' });
      }
      if (game.status !== 'attivo') {
        return res.status(400).json({ error: 'La partita non è attiva' });
      }
      if (row >= game.gridSize || col >= game.gridSize) {
        return res.status(422).json({ error: 'Cella fuori dalla griglia' });
      }
      if (game.shots.some(s => s.row === row && s.col === col)) {
        return res.status(400).json({ error: 'Cella già colpita' });
      }

      // calcola l'esito e registra il tiro
      const { result, won } = computeShotResult(game.ships, game.shots, row, col);
      game.shots.push({ row, col, result });

      const { torpedoesRemaining, status } = applyShot(result, won, game.torpedoesRemaining);
      game.torpedoesRemaining = torpedoesRemaining;
      game.status = status;

      return res.json({ result, torpedoesRemaining, status });
    }

    // torneo: stato nel DB, serve autenticazione e proprietà
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Non autorizzato' });
    }

    try {
      // la partita deve esistere ed essere del giocatore loggato
      const game = await gameDao.getGameById(id, req.user.id);
      if (game.error) {
        return res.status(404).json({ error: 'Partita non trovata' });
      }
      if (game.status !== 'attivo') {
        return res.status(400).json({ error: 'La partita non è attiva' });
      }
      if (row >= game.grid_size || col >= game.grid_size) {
        return res.status(422).json({ error: 'Cella fuori dalla griglia' });
      }

      // tiri già effettuati in questa partita
      const shots = await gameDao.getShotsByGame(id);
      if (shots.some(s => s.row === row && s.col === col)) {
        return res.status(400).json({ error: 'Cella già colpita' });
      }

      // le posizioni delle navi sono salvate come stringhe JSON nel db, dunque sono da parsificare in array per usarle
      const ships = JSON.parse(game.ships);
      const { result, won } = computeShotResult(ships, shots, row, col);

      const { torpedoesRemaining, status } = applyShot(result, won, game.torpedoes_remaining);

      // salva il tiro e aggiorna la partita nel database
      await gameDao.addShot(id, row, col, result);
      await gameDao.updateGame(id, torpedoesRemaining, status);

      return res.json({ result, torpedoesRemaining, status });
    } catch (err) {
      return res.status(500).json({ error: 'Errore nel lancio del siluro' });
    }
  });

// GET /api/games/:id/ships - ottieni le posizioni delle navi di una partita (solo a partita finita)
app.get('/api/games/:id/ships', async (req, res) => {
  const { id } = req.params;

  // casual: stato nella sessione
  if (id === 'casual') {
    const game = req.session.game;
    if (!game) {
      return res.status(404).json({ error: 'Partita non trovata' });
    }
    // le posizioni si rivelano solo a partita finita
    if (game.status === 'attivo') {
      return res.status(400).json({ error: 'La partita è ancora in corso' });
    }
    return res.json(game.ships);
  }

  // torneo: stato nel DB, serve autenticazione e proprietà
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Non autorizzato' });
  }

  try {
    const game = await gameDao.getGameById(id, req.user.id);
    if (game.error) {
      return res.status(404).json({ error: 'Partita non trovata' });
    }
    if (game.status === 'attivo') {
      return res.status(400).json({ error: 'La partita è ancora in corso' });
    }
    return res.json(JSON.parse(game.ships)); // le navi vengono parsificate in array
  } catch (err) {
    return res.status(500).json({ error: 'Errore nel recupero delle navi' });
  }
});

// GET /api/stats - statistiche di tutti i giocatori, per difficoltà (pubbliche)
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await gameDao.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Errore nel recupero delle statistiche' });
  }
});


// attivare il server
const port = 3001;
app.listen(port, () => { console.log(`Server attivo all'indirizzo http://localhost:${port}`); });