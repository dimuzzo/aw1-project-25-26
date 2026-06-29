/* modulo DAO (Data Access Object) per l'accesso ai dati degli utenti */
import db from "./db.js";
import crypto from "crypto";

// tutte le funzioni restituiscono messaggi di errore come oggetto json { error: <string> }
export default function UserDao() {
    // recupera un utente tramite id
    this.getUserById = (id) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE id=?';
            db.get(query, [id], (err, row) => {
                if (err) {
                    reject(err);
                }
                if (row === undefined) {
                    resolve({ error: 'Utente non trovato.' });
                } else {
                    resolve(row);
                }
            });
        });
    };

    this.getUserByCredentials = (username, password) => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE username=?';
            db.get(sql, [username], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row === undefined) {
                    resolve(false);
                }
                else {
                    const user = { id: row.id, username: row.username };

                    // controlla gli hash in modo asincrono, in modo tale da non bloccare il server
                    crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) {
                        if (err) reject(err);
                        if (!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashedPassword))
                            resolve(false);
                        else
                            resolve(user);
                    });
                }
            });
        });
    }
}