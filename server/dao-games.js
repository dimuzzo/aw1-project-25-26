/* Modulo DAO (Data Access Object) per l'accesso alle partite */

import db from "./db.js";

export default function GameDao() {
    // crea un torneo
    this.createTournament = (difficulty, gridSize, shipsJson, code) => {
        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO tournaments (difficulty, grid_size, ships, code) VALUES(?, ?, ?, ?)';
            db.run(query, [difficulty, gridSize, shipsJson, code], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // crea una partita (partecipazione a un torneo)
    this.createGame = (userId, tournamentId, torpedoesRemaining) => {
        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO games (user_id, tournament_id, torpedoes_remaining, status) VALUES(?, ?, ?, ?)';
            db.run(query, [userId, tournamentId, torpedoesRemaining, 'attivo'], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // ottieni una partita
    this.getGameById = (gameId, userId) => {
        return new Promise((resolve, reject) => {
            const query = `SELECT g.*, t.grid_size, t.ships, t.difficulty
                           FROM games g JOIN tournaments t ON g.tournament_id = t.id
                           WHERE g.id=? AND g.user_id=?`;
            db.get(query, [gameId, userId], function (err, row) {
                if (err) reject(err);
                if (row === undefined) {
                    resolve({ error: 'Partita non trovata o non accessibile.' });
                }
                else resolve(row);
            });
        });
    }

    // cerca la partita di un utente in un dato torneo
    this.getGameByTournament = (userId, tournamentId) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM games WHERE user_id=? AND tournament_id=?';
            db.get(query, [userId, tournamentId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    // ottieni i colpi di una partita
    this.getShotsByGame = (gameId) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT row, col, result FROM shots WHERE game_id=? ORDER BY id';
            db.all(query, [gameId], function (err, rows) {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // ottieni un torneo tramite codice
    this.getTournamentByCode = (code) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM tournaments WHERE code=?';
            db.get(query, [code], function (err, row) {
                if (err) reject(err);
                if (row === undefined) {
                    resolve({ error: 'Codice non valido.' });
                }
                else resolve(row);
            });
        });
    }

    // aggiunge un colpo alla partita
    this.addShot = (gameId, row, col, result) => {
        return new Promise((resolve, reject) => {
            const query = 'INSERT INTO shots (game_id, row, col, result) VALUES(?, ?, ?, ?)';
            db.run(query, [gameId, row, col, result], function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    // aggiorna una partita
    this.updateGame = (gameId, torpedoesRemaining, status) => {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE games SET torpedoes_remaining=?, status=? WHERE id=?';
            db.run(query, [torpedoesRemaining, status, gameId], function (err) {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    // ottieni le statistiche di un utente
    this.getStats = (userId) => {
        return new Promise((resolve, reject) => {
            const query = `SELECT t.difficulty, COUNT(*) as played, SUM(g.status='vinto') as won,
                            SUM(g.status='perso') as lost
                            FROM games g JOIN tournaments t ON g.tournament_id = t.id
                            WHERE g.user_id=? AND g.status != 'attivo' GROUP BY t.difficulty`;
            db.all(query, [userId], function (err, rows) {
                if (err) reject(err);
                else resolve(rows.map(r => ({
                    difficulty: r.difficulty,
                    played: r.played,
                    won: r.won,
                    lost: r.lost,
                    winPct: r.played > 0 ? Math.round((r.won / r.played) * 1000) / 10 : 0
                })));
            })
        })
    }
} 