import { Game } from './models/Game.js';

const SERVER_URL = 'http://localhost:3001/api';


/* API Client - autenticazione */
// funzione usata per fare il login, riceve le credenziali e ritorna l'utente loggato.
const logIn = async (credentials) => {
    return await fetch(SERVER_URL + '/sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',  // specifica che il cookie di autenticazione viene inoltrato a tutte le API autenticate.
        body: JSON.stringify(credentials),
    }).then(handleInvalidResponse)
        .then(response => response.json());
};

// funzione usata per verificare se l'utente è ancora loggato, ritorna le informazioni dell'utente. 
const getUserInfo = async () => {
    return await fetch(SERVER_URL + '/sessions/current', {
        credentials: 'include'
    }).then(handleInvalidResponse)
        .then(response => response.json());
};

// funzione usata per distruggere la sessione corrente (eseguendo il log-out).
const logOut = async () => {
    return await fetch(SERVER_URL + '/sessions/current', {
        method: 'DELETE',
        credentials: 'include'
    }).then(handleInvalidResponse);
};


/* API Client - partite */
// funzione per creare una partita casual, riceve la difficoltà scelta
const createGame = async (difficulty) => {
    const response = await fetch(SERVER_URL + '/games', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ difficulty }),
    });
    if (response.ok) return mapApiGameToGame(await response.json());
    else await throwApiError(response);
};

// funzione per creare un torneo, riceve la difficoltà scelta e restituisce il codice del torneo
const createTournament = async (difficulty) => {
    const response = await fetch(SERVER_URL + '/tournaments', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ difficulty }),
    });
    if (response.ok) return mapApiGameToGame(await response.json());
    else await throwApiError(response);
};

// funzione per partecipare a un torneo esistente, riceve il codice e crea la partita del giocatore
const joinTournament = async (code) => {
    const response = await fetch(SERVER_URL + `/tournaments/${code}/join`, {
        method: 'POST',
        credentials: 'include',
    });
    if (response.ok) return mapApiGameToGame(await response.json());
    else await throwApiError(response);
};

// funzione per ottenere lo stato di una partita (senza le posizioni delle navi), riceve l'id della partita
const getGame = async (id) => {
    const response = await fetch(SERVER_URL + `/games/${id}`, {
        credentials: 'include',
    });
    // la risposta di questa route non include l'id della partita, quindi viene aggiunto all'argomento
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
        body: JSON.stringify({ row, col }),
    });
    if (response.ok) return await response.json();
    else await throwApiError(response);
};

// funzione per ottenere le posizioni delle navi (solo a partita finita), riceve l'id della partita
const getShips = async (id) => {
    const response = await fetch(SERVER_URL + `/games/${id}/ships`, {
        credentials: 'include',
    });
    if (response.ok) return await response.json();
    else await throwApiError(response);
};

// funzione per ottenere le statistiche pubbliche di tutti i giocatori, divise per difficoltà
const getStats = async () => {
    const response = await fetch(SERVER_URL + '/stats');
    if (response.ok) return await response.json();
    else await throwApiError(response);
};


/* helpers */
// funzione usata per gestire la risposta del server, lancia un errore se la risposta non è valida
function handleInvalidResponse(response) {
    if (!response.ok) { throw Error(response.statusText) }
    let type = response.headers.get('Content-Type');
    if (type !== null && type.indexOf('application/json') === -1) {
        throw new TypeError(`Expected JSON, got ${type}`)
    }
    return response;
};

// funzione usata per estrarre il messaggio d'errore dal corpo della risposta e lanciarlo
async function throwApiError(response) {
    let errMessage;
    try {
        const body = await response.json();
        // su 422 (validazione) il formato è { errors: [...] }, altrimenti { error: '...' }
        errMessage = response.status === 422
            ? `${body.errors[0].msg} for ${body.errors[0].path}.`
            : body.error;
    } catch {
        // corpo non-JSON o vuoto, ripiega sul testo di stato HTTP
        errMessage = response.statusText;
    }
    throw errMessage;
};

// funzione usata per mappare i dati di una partita ricevuti dal server nel modello Game.
function mapApiGameToGame(game) {
    return new Game(game.gameId, game.gridSize, game.ships, game.torpedoesRemaining, game.status, game.shots, game.code);
}


const API = { logIn, getUserInfo, logOut, createGame, createTournament, joinTournament, getGame, fireShot, getShips, getStats };
export default API;