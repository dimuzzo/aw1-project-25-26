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
                if (err) reject(err);
                if (row === undefined) resolve({ error: 'Utente non trovato.' });
                else resolve(row);
            });
        });
    };

    // verifica username e password: ritorna { id, username } se combaciano, false altrimenti
    this.getUserByCredentials = (username, password) => {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM users WHERE username=?';
            db.get(query, [username], (err, row) => {
                if (err) reject(err);
                else if (row === undefined) resolve(false);
                else {
                    // solo id e username, password e salt restano sul server
                    const user = { id: row.id, username: row.username };

                    // ricalcola l'hash della password inserita usando il salt dell'utente e lo confronta con quello salvato
                    // la versione asincrona di scrypt non blocca il server durante il calcolo e timingSafeEqual
                    // confronta i due hash in tempo costante, in modo che la durata della risposta non dia indizi ad un attaccante
                    crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) {
                        if (err) reject(err);
                        if (!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashedPassword))
                            resolve(false);
                        else resolve(user);
                    });
                }
            });
        });
    }
}