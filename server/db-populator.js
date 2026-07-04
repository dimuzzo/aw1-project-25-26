/* script per la creazione delle tabelle e l'inserimento dei dati iniziali (utenti, tornei, partite) - node db-populator.js */
import sqlite3 from 'sqlite3';
import crypto from 'crypto';

const db = new sqlite3.Database('battaglia_navale.db');

// genera salt casuale e hash della password (scrypt), come richiesto dall'autenticazione
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return { hash, salt };
};

// db.serialize garantisce che le query vengano eseguite in ordine, una alla volta
db.serialize(() => {
  // tabelle
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT    NOT NULL UNIQUE,
    password TEXT    NOT NULL,
    salt     TEXT    NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tournaments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT    NOT NULL UNIQUE,
    difficulty TEXT    NOT NULL CHECK(difficulty IN ('Facile','Intermedio','Difficile')),
    grid_size  INTEGER NOT NULL,
    ships      TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS games (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL REFERENCES users(id),
    tournament_id       INTEGER NOT NULL REFERENCES tournaments(id),
    torpedoes_remaining INTEGER NOT NULL,
    status              TEXT    NOT NULL CHECK(status IN ('attivo','vinto','perso')),
    created_at          TEXT    NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS shots (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id  INTEGER NOT NULL REFERENCES games(id),
    row      INTEGER NOT NULL,
    col      INTEGER NOT NULL,
    result   TEXT    NOT NULL CHECK(result IN ('acqua','colpito','affondato')),
    shot_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  )`);


  // seed degli utenti

  const alice = hashPassword('alice123');
  const bob = hashPassword('bob123');
  const charlie = hashPassword('charlie123');

  db.run(`INSERT OR IGNORE INTO users(username, password, salt) VALUES(?,?,?)`,
    ['alice', alice.hash, alice.salt]);
  db.run(`INSERT OR IGNORE INTO users(username, password, salt) VALUES(?,?,?)`,
    ['bob', bob.hash, bob.salt]);
  db.run(`INSERT OR IGNORE INTO users(username, password, salt) VALUES(?,?,?)`,
    ['charlie', charlie.hash, charlie.salt]);


  // seed dei tornei
  // le posizioni delle navi sono fisse, sempre dentro la griglia e mai adiacenti tra loro

  // torneo Facile 7x7, navi [2,2,3,3], siluri 18
  const ships1 = JSON.stringify([
    { row: 0, col: 0, size: 2, dir: 'H' },
    { row: 0, col: 4, size: 2, dir: 'H' },
    { row: 3, col: 0, size: 3, dir: 'H' },
    { row: 3, col: 4, size: 3, dir: 'H' }
  ]);

  const ships2 = JSON.stringify([
    { row: 1, col: 1, size: 2, dir: 'V' },
    { row: 1, col: 4, size: 2, dir: 'V' },
    { row: 4, col: 0, size: 3, dir: 'H' },
    { row: 4, col: 4, size: 3, dir: 'H' }
  ]);

  // torneo Intermedio 10x10, navi [2,2,3,3,4,4,5], siluri 28
  const ships3 = JSON.stringify([
    { row: 0, col: 0, size: 5, dir: 'H' },
    { row: 0, col: 7, size: 2, dir: 'H' },
    { row: 2, col: 0, size: 4, dir: 'H' },
    { row: 2, col: 5, size: 3, dir: 'H' },
    { row: 4, col: 0, size: 4, dir: 'H' },
    { row: 4, col: 5, size: 3, dir: 'H' },
    { row: 6, col: 0, size: 2, dir: 'H' }
  ]);

  // torneo Difficile 14x14, navi [2,2,2,2,3,3,3,4,4,4,5,5], siluri 45
  const ships4 = JSON.stringify([
    { row: 0, col: 0, size: 5, dir: 'H' },
    { row: 0, col: 7, size: 5, dir: 'H' },
    { row: 2, col: 0, size: 4, dir: 'H' },
    { row: 2, col: 5, size: 4, dir: 'H' },
    { row: 2, col: 10, size: 4, dir: 'H' },
    { row: 4, col: 0, size: 3, dir: 'H' },
    { row: 4, col: 4, size: 3, dir: 'H' },
    { row: 4, col: 8, size: 3, dir: 'H' },
    { row: 6, col: 0, size: 2, dir: 'H' },
    { row: 6, col: 3, size: 2, dir: 'H' },
    { row: 6, col: 6, size: 2, dir: 'H' },
    { row: 6, col: 9, size: 2, dir: 'H' }
  ]);

  db.run(`INSERT OR IGNORE INTO tournaments(code, difficulty, grid_size, ships)
          VALUES(?,?,?,?)`, ['NAVALE01', 'Facile', 7, ships1]);
  db.run(`INSERT OR IGNORE INTO tournaments(code, difficulty, grid_size, ships)
          VALUES(?,?,?,?)`, ['NAVALE02', 'Facile', 7, ships2]);
  db.run(`INSERT OR IGNORE INTO tournaments(code, difficulty, grid_size, ships)
          VALUES(?,?,?,?)`, ['NAVALE03', 'Intermedio', 10, ships3]);
  db.run(`INSERT OR IGNORE INTO tournaments(code, difficulty, grid_size, ships)
          VALUES(?,?,?,?)`, ['NAVALE04', 'Difficile', 14, ships4]);


  // seed delle partite
  // ogni partita collega un utente e un torneo tramite i loro id numerici
  // invece di scriverli a mano, l'INSERT ... SELECT li recupera cercando utente e torneo per nome (username e code)

  // NAVALE01 e NAVALE02 - Facile
  // alice ha vinto NAVALE01 (18 siluri, ne rimangono 5)
  db.run(`INSERT OR IGNORE INTO games(user_id, tournament_id, torpedoes_remaining, status)
          SELECT u.id, t.id, 5, 'vinto'
          FROM users u, tournaments t
          WHERE u.username='alice' AND t.code='NAVALE01'`);

  // alice ha perso NAVALE02 (18 siluri, ne rimangono 0)
  db.run(`INSERT OR IGNORE INTO games(user_id, tournament_id, torpedoes_remaining, status)
          SELECT u.id, t.id, 0, 'perso'
          FROM users u, tournaments t
          WHERE u.username='alice' AND t.code='NAVALE02'`);

  // bob ha perso NAVALE01
  db.run(`INSERT OR IGNORE INTO games(user_id, tournament_id, torpedoes_remaining, status)
          SELECT u.id, t.id, 0, 'perso'
          FROM users u, tournaments t
          WHERE u.username='bob' AND t.code='NAVALE01'`);

  // bob ha vinto NAVALE02
  db.run(`INSERT OR IGNORE INTO games(user_id, tournament_id, torpedoes_remaining, status)
          SELECT u.id, t.id, 10, 'vinto'
          FROM users u, tournaments t
          WHERE u.username='bob' AND t.code='NAVALE02'`);

  // NAVALE03 - Intermedio
  // alice ha vinto NAVALE03 (28 siluri, ne rimangono 9)
  db.run(`INSERT OR IGNORE INTO games(user_id, tournament_id, torpedoes_remaining, status)
          SELECT u.id, t.id, 9, 'vinto'
          FROM users u, tournaments t
          WHERE u.username='alice' AND t.code='NAVALE03'`);

  // bob ha perso NAVALE03
  db.run(`INSERT OR IGNORE INTO games(user_id, tournament_id, torpedoes_remaining, status)
          SELECT u.id, t.id, 0, 'perso'
          FROM users u, tournaments t
          WHERE u.username='bob' AND t.code='NAVALE03'`);

  // NAVALE04 - Difficile
  // alice ha perso NAVALE04
  db.run(`INSERT OR IGNORE INTO games(user_id, tournament_id, torpedoes_remaining, status)
          SELECT u.id, t.id, 0, 'perso'
          FROM users u, tournaments t
          WHERE u.username='alice' AND t.code='NAVALE04'`);

  // bob ha vinto NAVALE04 (45 siluri, ne rimangono 14)
  db.run(`INSERT OR IGNORE INTO games(user_id, tournament_id, torpedoes_remaining, status)
          SELECT u.id, t.id, 14, 'vinto'
          FROM users u, tournaments t
          WHERE u.username='bob' AND t.code='NAVALE04'`);
});


// chiude la connessione al termine e segnala eventuali errori
db.close((err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Database created and seeded: battaglia_navale.db');
});