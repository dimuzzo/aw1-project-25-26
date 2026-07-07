import { Game } from './models/Game.js';

const SERVER_URL = 'http://localhost:3001/api';


/* API client - autenticazione */

// funzione per fare il login, riceve le credenziali e ritorna l'utente loggato
const logIn = async (credentials) => {
    return await fetch(SERVER_URL + '/sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        // specifica che il cookie di autenticazione (sessione) deve essere inoltrato 
        // e incluso a tutte le API autenticate
        credentials: 'include',
        body: JSON.stringify(credentials)
    }).then(handleInvalidResponse)
        .then(response => response.json());
};

// funzione per verificare se l'utente è ancora loggato, ritorna le informazioni dell'utente
const getUserInfo = async () => {
    return await fetch(SERVER_URL + '/sessions/current', {
        credentials: 'include'
    }).then(handleInvalidResponse)
        .then(response => response.json());
};

// funzione per distruggere la sessione corrente (eseguendo il log-out)
const logOut = async () => {
    return await fetch(SERVER_URL + '/sessions/current', {
        method: 'DELETE',
        credentials: 'include'
    }).then(handleInvalidResponse);
};


/* API client - partite */

// funzione per creare una partita casual, riceve la difficoltà scelta
const createGame = async (difficulty) => {
    const response = await fetch(SERVER_URL + '/games', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ difficulty })
    });
    if (response.ok) return mapApiGameToGame(await response.json());
    else await throwApiError(response);
};

// funzione per creare un torneo, riceve la difficoltà scelta e restituisce il codice del torneo
const createTournament = async (difficulty) => {
    const response = await fetch(SERVER_URL + '/tournaments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ difficulty })
    });
    if (response.ok) return mapApiGameToGame(await response.json());
    else await throwApiError(response);
};

// funzione per partecipare a un torneo esistente, riceve il codice e crea la partita del giocatore
const joinTournament = async (code) => {
    const response = await fetch(SERVER_URL + `/tournaments/${code}/join`, {
        method: 'POST',
        credentials: 'include'
    });
    if (response.ok) return mapApiGameToGame(await response.json());
    else await throwApiError(response);
};

// funzione per ottenere lo stato di una partita (senza le posizioni delle navi), riceve l'id della partita
const getGame = async (id) => {
    const response = await fetch(SERVER_URL + `/games/${id}`, {
        credentials: 'include'
    });
    // la risposta di questa route non include l'id della partita, quindi lo si aggiunge prendendolo dall'argomento
    if (response.ok) return mapApiGameToGame({ ...await response.json(), gameId: id });
    else await throwApiError(response);
};

// funzione per lanciare un siluro, riceve l'id della partita e le coordinate della cella, restituisce l'esito
const fireShot = async (id, row, col) => {
    const response = await fetch(SERVER_URL + `/games/${id}/shots`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ row, col })
    });
    if (response.ok) return await response.json();
    else await throwApiError(response);
};

// funzione per ottenere le posizioni delle navi (solo a partita finita), riceve l'id della partita
const getShips = async (id) => {
    const response = await fetch(SERVER_URL + `/games/${id}/ships`, {
        credentials: 'include'
    });
    if (response.ok) return await response.json();
    else await throwApiError(response);
};

// funzione per ottenere le statistiche pubbliche di tutti i giocatori, divise per difficoltà
// unica funzione senza credentials: 'include', la route è pubblica e il cookie di sessione non serve
const getStats = async () => {
    const response = await fetch(SERVER_URL + '/stats');
    if (response.ok) return await response.json();
    else await throwApiError(response);
};


/* helpers */
// funzione per gestire la risposta del server, lancia un errore se la risposta non è valida
function handleInvalidResponse(response) {
    if (!response.ok) { throw Error(response.statusText) }
    let type = response.headers.get('Content-Type');
    if (type !== null && type.indexOf('application/json') === -1) {
        throw new TypeError(`Expected JSON, got ${type}`)
    }
    return response;
};

// funzione per estrarre il messaggio d'errore dal corpo della risposta e lanciarlo come stringa
// il server manda due forme di errore: quelli di validazione come { validationErrors: { campo: messaggio } },
// tutti gli altri come { error: 'messaggio' }
async function throwApiError(response) {
    let errMessage;
    try {
        const body = await response.json();
        // se ci sono errori di validazione prende il primo messaggio,
        // altrimenti usa il messaggio contenuto in error
        errMessage = body.validationErrors ? Object.values(body.validationErrors)[0] : body.error;
    } catch {
        // corpo non in formato json o vuoto, ripiega sul testo di stato http
        errMessage = response.statusText;
    }
    throw errMessage;
};

// funzione per mappare i dati di una partita ricevuti dal server nel modello Game
function mapApiGameToGame(game) {
    return new Game(game.gameId, game.gridSize, game.ships, game.torpedoesRemaining, game.status, game.shots, game.code);
}


const API = { logIn, getUserInfo, logOut, createGame, createTournament, joinTournament, getGame, fireShot, getShips, getStats };
export default API;