import sqlite3 from 'sqlite3';
import crypto from 'crypto';

const db = new sqlite3.Database('battaglia_navale.db');

const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 32).toString('hex');
  return { hash, salt };
};

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


  // seed dei tornei (Facile 7x7, navi [2,2,3,3], siluri 18)
  // navi posizionate in modo valido, senza adiacenza (distanza tra due navi >= 2)
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

  db.run(`INSERT OR IGNORE INTO tournaments(code, difficulty, grid_size, ships)
          VALUES(?,?,?,?)`, ['NAVALE01', 'Facile', 7, ships1]);
  db.run(`INSERT OR IGNORE INTO tournaments(code, difficulty, grid_size, ships)
          VALUES(?,?,?,?)`, ['NAVALE02', 'Facile', 7, ships2]);


  // seed delle partite (alice e bob hanno giocato vinte e perse)
  // gli id vengono recuperati tramite subquery, dato che lastID non è disponibile per SELECT

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
});


db.close((err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Database created and seeded: battaglia_navale.db');
});