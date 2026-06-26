const SERVER_URL = 'http://localhost:3001/api';


/* API Client - autenticazione */
// Funzione usata per fare il login, riceve le credenziali e ritorna l'utente loggato.
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

// Funzione usata per verificare se l'utente è ancora loggato, ritorna le informazioni dell'utente. 
const getUserInfo = async () => {
    return await fetch(SERVER_URL + '/sessions/current', {
        credentials: 'include'
    }).then(handleInvalidResponse)
        .then(response => response.json());
};

// Funzione usata per distruggere la sessione corrente (eseguendo il log-out).
const logOut = async () => {
    return await fetch(SERVER_URL + '/sessions/current', {
        method: 'DELETE',
        credentials: 'include'
    }).then(handleInvalidResponse);
}


/* Helper function - gestione risposta */
// Funzione usata per gestire la risposta del server, lancia un errore se la risposta non e' valida.
function handleInvalidResponse(response) {
    if (!response.ok) { throw Error(response.statusText) }
    let type = response.headers.get('Content-Type');
    if (type !== null && type.indexOf('application/json') === -1) {
        throw new TypeError(`Expected JSON, got ${type}`)
    }
    return response;
}

const API = { logIn, getUserInfo, logOut };
export default API;