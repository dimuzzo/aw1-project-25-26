[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/W4bhbCo5)
# Esame #2: "Battaglia Navale"
## Studente: s361908 DEMO ALESSANDRO

## Route dell'applicazione React

- Route `/`: homepage con due pulsanti, Casual e Torneo. Cliccando Casual (accessibile solo agli utenti non autenticati) compare un selettore di difficoltà. Dopo la scelta viene avviata la partita e il client naviga a `/game/casual`. Cliccando Torneo da non autenticati compare un messaggio che invita a fare il login. Cliccando Torneo da autenticati il client naviga a `/dashboard`. La navbar mostra sempre il pulsante Statistiche (accessibile a tutti) e, in alto a destra, il pulsante Login quando l'utente non è autenticato, sostituito da Logout dopo il login.
- Route `/login`: pagina di login con un form per username e password. Dopo il login riuscito l'utente viene reindirizzato alla homepage.
- Route `/dashboard`: hub dei tornei, accessibile solo agli utenti autenticati. Il giocatore può creare un nuovo torneo scegliendo la difficoltà e ricevendo un codice condivisibile, oppure unirsi a uno esistente inserendo il codice. In entrambi i casi viene poi reindirizzato a `/game/:id`.
- Route `/game/:id`: griglia di gioco, utilizzata sia per le partite Casual (id fisso `"casual"`, stato in sessione) sia per le partite Torneo (id numerico, stato nel DB). Mostra la griglia, i siluri rimanenti, l'elenco delle navi e il risultato di ogni lancio. Le posizioni complete delle navi vengono rivelate solo al termine della partita tramite una chiamata separata a `GET /api/games/:id/ships`.
- Route `/stats`: pagina delle statistiche, pubblica e accessibile a tutti (anche non autenticati) tramite il pulsante Statistiche nella navbar. Mostra, per ogni giocatore e per ogni livello di difficoltà, le partite giocate, vinte e perse e la percentuale di vittorie.
- Route `*`: catch-all, reindirizza a `/`.

## API Server

### Riepilogo

- Login: POST `/api/sessions`
- Ottieni la sessione corrente: GET `/api/sessions/current`
- Logout: DELETE `/api/sessions/current`
- Avvia una partita Casual: POST `/api/games`
- Crea un torneo: POST `/api/tournaments`
- Entra in un torneo: POST `/api/tournaments/:code/join`
- Ottieni lo stato di una partita: GET `/api/games/:id`
- Lancia un siluro: POST `/api/games/:id/shots`
- Ottieni le posizioni delle navi (solo a fine partita): GET `/api/games/:id/ships`
- Ottieni le statistiche dei giocatori (pubblica): GET `/api/stats`

---

### Login

URL: `/api/sessions`

Metodo HTTP: POST

Descrizione: Autentica un utente e crea una nuova sessione.

Body della Request:
```json
{
  "username": "alice",
  "password": "alice123"
}
```

Response: `200 OK` (successo) o `401 Unauthorized` (credenziali errate).

Body della Response:
```json
{
  "id": 1,
  "username": "alice"
}
```

---

### Ottieni la sessione corrente

URL: `/api/sessions/current`

Metodo HTTP: GET

Descrizione: Verifica se l'utente è ancora loggato e restituisce le sue informazioni.

Corpo della Request: Nessuno

Response: `200 OK` (successo) o `401 Unauthorized` (non autenticato).

Body della Response:
```json
{
  "id": 1,
  "username": "alice"
}
```

---

### Logout

URL: `/api/sessions/current`

Metodo HTTP: DELETE

Descrizione: Distrugge la sessione corrente.

Body della Request: Nessuno

Response: `200 OK` (successo).

Body della Response: Nessuno

---

### Avvia una partita Casual

URL: `/api/games`

Metodo HTTP: POST

Descrizione: Avvia una nuova partita Casual per un utente anonimo. Il server genera casualmente le posizioni delle navi e le conserva nella sessione Express. Le posizioni non vengono mai inviate al client. Restituisce l'ID fisso `"casual"` come identificatore di partita. Richiede che l'utente non sia autenticato.

Body della Request:
```json
{
  "difficulty": "Facile"
}
```
`difficulty` deve essere uno tra `"Facile"`, `"Intermedio"` e `"Difficile"`.

Response: `201 Created` (successo), `401 Unauthorized` (utente già autenticato) o `422 Unprocessable Entity` (errore di validazione).

Body della Response:
```json
{
  "gameId": "casual",
  "gridSize": 7,
  "ships": 
  [
    { "size": 2 }, 
    { "size": 2 }, 
    { "size": 3 }, 
    { "size": 3 }
  ],
  "torpedoesRemaining": 18,
  "status": "attivo",
  "shots": []
}
```

---

### Crea un torneo

URL: `/api/tournaments`

Metodo HTTP: POST

Descrizione: Crea un nuovo torneo. Il server genera casualmente le posizioni delle navi, le salva nel DB e restituisce un codice univoco condivisibile. Viene anche creata immediatamente una partita per il creatore. Richiede autenticazione.

Body della Request:
```json
{
  "difficulty": "Intermedio"
}
```
`difficulty` deve essere uno tra `"Facile"`, `"Intermedio"` e `"Difficile"`.

Response: `201 Created` (successo), `401 Unauthorized` (non autenticato) o `422 Unprocessable Entity` (errore di validazione).

Body della Response:
```json
{
  "code": "XKCD42",
  "gameId": 7,
  "gridSize": 10,
  "ships": 
  [
    { "size": 2 }, 
    { "size": 2 }, 
    { "size": 3 }, 
    { "size": 3 }, 
    { "size": 4 }, 
    { "size": 4 }, 
    { "size": 5 }
  ],
  "torpedoesRemaining": 28,
  "status": "attivo",
  "shots": []
}
```

---

### Entra in un torneo

URL: `/api/tournaments/:code/join`

Metodo HTTP: POST

Descrizione: Entra in un torneo esistente tramite il codice nell'URL. Viene creata una nuova partita per l'utente corrente con le stesse posizioni delle navi, la stessa griglia e la stessa difficoltà del creatore. Richiede autenticazione.

Body della Request: Nessuno

Response: `201 Created` (successo), `401 Unauthorized` (non autenticato), `404 Not Found` (codice non esistente) o `409 Conflict` (l'utente ha già una partita in questo torneo).

Body della Response:
```json
{
  "gameId": 8,
  "gridSize": 10,
  "ships": 
  [
    { "size": 2 }, 
    { "size": 2 }, 
    { "size": 3 }, 
    { "size": 3 }, 
    { "size": 4 }, 
    { "size": 4 }, 
    { "size": 5 }
  ],
  "torpedoesRemaining": 28,
  "status": "attivo",
  "shots": []
}
```

---

### Ottieni lo stato di una partita

URL: `/api/games/:id`

Metodo HTTP: GET

Descrizione: Restituisce lo stato attuale di una partita, inclusi tutti i siluri lanciati finora. Per le partite Casual (`id = "casual"`) legge dalla sessione, mentre per le partite Torneo (id numerico) legge dal DB e richiede autenticazione e proprietà della partita. Le posizioni delle navi non vengono mai incluse in questa risposta. Per vedere le posizioni delle navi a fine partita usare `GET /api/games/:id/ships`.

Body della Request: Nessuno

Response: `200 OK` (successo), `401 Unauthorized` (non autenticato, solo Torneo) o `404 Not Found` (partita non trovata o non accessibile).

Body della Response:
```json
{
  "gridSize": 10,
  "ships": 
  [
    { "size": 2 }, 
    { "size": 3 }
  ],
  "torpedoesRemaining": 25,
  "status": "attivo",
  "shots": 
  [
    { 
      "row": 1, 
      "col": 3, 
      "result": "acqua" 
    },
    { 
      "row": 4, 
      "col": 7, 
      "result": "colpito" 
    }
  ]
}
```

---

### Lancia un siluro

URL: `/api/games/:id/shots`

Metodo HTTP: POST

Descrizione: Lancia un siluro su una cella della partita specificata. Per le partite Casual legge e aggiorna lo stato dalla sessione, mentre per le partite Torneo richiede autenticazione e proprietà della partita.

Body della Request:
```json
{
  "row": 3,
  "col": 5
}
```

Response: `200 OK` (successo), `400 Bad Request` (partita non attiva o cella già colpita), `401 Unauthorized` (non autenticato, solo Torneo), `404 Not Found` (partita non trovata o non accessibile) o `422 Unprocessable Entity` (errore di validazione, ad esempio coordinate mancanti o fuori dalla griglia).

Body della Response:
```json
{
  "result": "colpito",
  "torpedoesRemaining": 24,
  "status": "attivo"
}
```

---

### Ottieni le posizioni delle navi

URL: `/api/games/:id/ships`

Metodo HTTP: GET

Descrizione: Restituisce le posizioni complete di tutte le navi. Risponde `400 Bad Request` se la partita è ancora in corso, poiché le posizioni vengono rivelate solo a fine partita. Per le partite Casual legge dalla sessione, mentre per le partite Torneo richiede autenticazione e proprietà della partita.

Body della Request: Nessuno

Response: `200 OK` (successo), `400 Bad Request` (partita ancora in corso), `401 Unauthorized` (non autenticato, solo Torneo) o `404 Not Found` (partita non trovata o non accessibile).

Body della Response:
```json
[
  { 
    "row": 0, 
    "col": 0, 
    "size": 2, 
    "dir": "H" 
  },
  { 
    "row": 3, 
    "col": 2, 
    "size": 3, 
    "dir": "V" 
  }
]
```

---

### Ottieni le statistiche dei giocatori

URL: `/api/stats`

Metodo HTTP: GET

Descrizione: Restituisce le statistiche di tutti i giocatori, suddivise per giocatore e per livello di difficoltà. È una route pubblica, accessibile anche dagli utenti non autenticati.

Body della Request: _Nessuno_

Response: `200 OK` (successo) o `500 Internal Server Error` (errore nel recupero).

Body della Response:
```json
[
  { 
    "username": "alice",
    "difficulty": "Facile", 
    "played": 3, 
    "won": 2, 
    "lost": 1, 
    "winPct": 66.7 
  },
  { 
    "username": "bob",
    "difficulty": "Intermedio", 
    "played": 1, 
    "won": 0, 
    "lost": 1, 
    "winPct": 0.0 
  }
]
```

---

## Tabelle del database

- `users`: contiene i tre utenti pre-registrati. Colonne: id, username, password (hash esadecimale), salt.
- `tournaments`: una riga per ogni torneo creato. Colonne: id, code (univoco), difficulty, grid_size, ships (JSON con le posizioni complete delle navi). Le posizioni sono conservate solo qui e non vengono mai inviate al client durante una partita attiva.
- `games`: una riga per ogni partita Torneo di ogni utente. Colonne: id, user_id, tournament_id, torpedoes_remaining, status (attivo / vinto / perso).
- `shots`: una riga per ogni siluro lanciato in una partita Torneo. Colonne: id, game_id, row, col, result (acqua / colpito / affondato). Usata per ricostruire la griglia e calcolare le statistiche.

### Livelli di difficoltà

| Difficoltà  | Griglia | Navi ( dimensioni e numero)                      | Siluri |
|-------------|---------|----------------------------------------|--------|
| Facile      | 7×7     | [2, 2, 3, 3] - 4 navi                 | 18     |
| Intermedio  | 10×10   | [2, 2, 3, 3, 4, 4, 5] - 7 navi        | 28     |
| Difficile   | 14×14   | [2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5] - 12 navi   | 45     |

## Principali componenti React

- `NavHeader` (in `NavHeader.jsx`): barra di navigazione che mostra il pulsante Login in alto a destra quando l'utente non è autenticato, e i pulsanti Logout e Statistiche quando è autenticato.
- `LoginForm` (in `AuthComponents.jsx`): form di login con validazione client-side.
- `HomePage` (in `HomePage.jsx`): schermata principale con i pulsanti Casual e Torneo. Mostra il selettore di difficoltà quando si clicca Casual. Se non autenticato e si clicca Torneo, mostra un messaggio che invita al login (il login si fa dal pulsante presente nella navbar).
- `Dashboard` (in `Dashboard.jsx`): hub dei tornei per utenti autenticati. Permette di creare un nuovo torneo e ricevere un codice condivisibile, oppure di unirsi a uno esistente inserendo il codice.
- `GameBoard` (in `GameBoard.jsx`): griglia NxN interattiva che mostra le celle acqua, colpito e affondato e gestisce i click per lanciare i siluri.
- `ShipList` (in `ShipList.jsx`): elenco delle navi nella partita corrente con le loro dimensioni e lo stato (affondata o no).
- `StatsTable` (in `StatsTable.jsx`): tabella delle statistiche suddivisa per giocatore e per livello di difficoltà.

## Screenshot

![Screenshot](./img/screenshot.png)

## Credenziali utenti

| Username | Password   |
|----------|------------|
| alice    | alice123   |
| bob      | bob123     |
| charlie  | charlie123 |

alice e bob hanno già giocato delle partite (vinte e perse). charlie non ha ancora giocato.

## Uso di strumenti AI
