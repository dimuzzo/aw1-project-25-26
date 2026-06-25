[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/W4bhbCo5)
# Esame #2: "Battaglia Navale"
## Studente: s361908 DEMO ALESSANDRO

## Route dell'applicazione React

- Route `/`: homepage con una schermata "Seleziona la modalità" che mostra sempre due pulsanti, Casual e Torneo. Cliccando Casual senza essere autenticati si avvia il flusso di gioco (selezione difficoltà, poi griglia). Se l'utente è già loggato, compare un messaggio inline che chiede di fare prima il logout. Invece, cliccando Torneo da autenticati si viene portati all'hub dei tornei. Se non si è loggati, compare un messaggio inline che chiede di fare il login, con un pulsante Login sotto. La navbar mostra sempre un pulsante Login in alto a destra quando non si è autenticati, sostituito da un pulsante Logout dopo il login. Il pulsante Statistiche compare in alto a sinistra solo quando si è autenticati.
- Route `/login`: pagina di login con un form per username e password. Dopo il login riuscito l'utente viene reindirizzato alla homepage.
- Route `/casual`: pagina di gioco Casual, accessibile solo agli utenti non autenticati. Il giocatore sceglie il livello di difficoltà e poi viene mostrata la griglia di gioco. Le posizioni delle navi sono conservate server-side nella sessione e vengono rivelate solo al termine della partita.
- Route `/torneo`: hub dei tornei, accessibile solo agli utenti autenticati. Il giocatore può creare un nuovo torneo scegliendo la difficoltà e ricevendo un codice condivisibile, oppure unirsi a uno esistente inserendo il codice di accesso.
- Route `/game/:gameId`: griglia di gioco per una partita Torneo. Mostra la griglia, il numero di siluri rimanenti, le dimensioni delle navi e il risultato di ogni lancio. Le posizioni delle navi vengono rivelate al termine della partita.
- Route `/stats`: pagina delle statistiche, accessibile solo agli utenti autenticati tramite il pulsante Statistiche nella navbar. Mostra partite giocate, vinte e perse, e la percentuale di vittorie per ogni livello di difficoltà.

## API Server

### Riepilogo

- Login: POST `/api/sessions`
- Ottieni la sessione corrente: GET `/api/sessions/current`
- Logout: DELETE `/api/sessions/current`
- Avvia una partita Casual: POST `/api/casual/start`
- Lancia un siluro in una partita Casual: POST `/api/casual/shoot`
- Crea un torneo: POST `/api/tournaments`
- Entra in un torneo: POST `/api/tournaments/join`
- Ottieni lo stato di una partita Torneo: GET `/api/games/:id`
- Lancia un siluro in una partita Torneo: POST `/api/games/:id/shoot`
- Ottieni le statistiche dell'utente: GET `/api/stats`

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

Response: `201 Created` (successo) o `401 Unauthorized` (credenziali errate).

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

Corpo della Request: _Nessuno_

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

Body della Request: _Nessuno_

Response: `200 OK` (successo).

Body della Response: _Nessuno_

---

### Avvia una partita Casual

URL: `/api/casual/start`

Metodo HTTP: POST

Descrizione: Avvia una nuova partita Casual per un utente anonimo. Il server genera casualmente le posizioni delle navi e le conserva nella sessione. Le posizioni non vengono mai inviate al client.

Body della Request:
```json
{
  "difficulty": "Facile"
}
```
`difficulty` deve essere uno tra `"Facile"`, `"Intermedio"` e `"Difficile"`.

Response: `201 Created` (successo) o `422 Unprocessable Entity` (errore di validazione).

Body della Response:
```json
{
  "gridSize": 7,
  "ships": 
  [
    { "size": 2 }, 
    { "size": 2 }, 
    { "size": 3 }, 
    { "size": 3 }
  ],
  "torpedoesRemaining": 18
}
```

---

### Lancia un siluro in una partita Casual

URL: `/api/casual/shoot`

Metodo HTTP: POST

Descrizione: Lancia un siluro su una cella della partita Casual corrente. Il risultato viene calcolato server-side rispetto alle posizioni delle navi conservate nella sessione. Se la partita termina, le posizioni complete delle navi vengono incluse nella risposta.

Body della Request:
```json
{
  "row": 2,
  "col": 4
}
```

Response: `200 OK` (successo), `400 Bad Request` (nessuna partita Casual attiva o cella già colpita) o `422 Unprocessable Entity` (errore di validazione).

Body della Response (partita in corso):
```json
{
  "result": "acqua",
  "torpedoesRemaining": 17,
  "status": "attivo"
}
```

Body della Response (partita terminata):
```json
{
  "result": "affondato",
  "torpedoesRemaining": 12,
  "status": "vinto",
  "fullShips": 
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
}
```

---

### Crea un torneo

URL: `/api/tournaments`

Metodo HTTP: POST

Descrizione: Crea un nuovo torneo. Il server genera casualmente le posizioni delle navi e restituisce un codice univoco condivisibile. Richiede autenticazione.

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
  "torpedoesRemaining": 28
}
```

---

### Entra in un torneo

URL: `/api/tournaments/join`

Metodo HTTP: POST

Descrizione: Entra in un torneo esistente tramite il suo codice. Viene creata una nuova partita per l'utente corrente con le stesse posizioni delle navi, la stessa griglia e la stessa difficoltà del creatore. Richiede autenticazione.

Body della Request:
```json
{
  "code": "XKCD42"
}
```

Response: `201 Created` (successo), `401 Unauthorized` (non autenticato), `404 Not Found` (codice non esistente), `409 Conflict` (l'utente ha già una partita in questo torneo) o `422 Unprocessable Entity` (errore di validazione).

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
  "torpedoesRemaining": 28
}
```

---

### Ottieni lo stato di una partita Torneo

URL: `/api/games/:id`

Metodo HTTP: GET

Descrizione: Restituisce lo stato attuale di una partita Torneo, inclusi tutti i siluri lanciati finora. Se la partita è terminata, vengono incluse anche le posizioni complete delle navi. Richiede autenticazione e proprietà della partita.

Body della Request: _Nessuno_

Response: `200 OK` (successo), `401 Unauthorized` (non autenticato o non proprietario) o `404 Not Found` (partita non trovata).

Body della Response (partita in corso):
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

Body della Response (partita terminata, aggiunge `fullShips`):
```json
{
  "gridSize": 10,
  "ships": 
  [
    { "size": 2 }, 
    { "size": 3 }
  ],
  "torpedoesRemaining": 0,
  "status": "perso",
  "shots": ["..."],
  "fullShips": 
  [
    { 
      "row": 2, 
      "col": 1, 
      "size": 2, 
      "dir": "H" 
    },
    { 
      "row": 5, 
      "col": 6, 
      "size": 3, 
      "dir": "V" 
    }
  ]
}
```

---

### Lancia un siluro in una partita Torneo

URL: `/api/games/:id/shoot`

Metodo HTTP: POST

Descrizione: Lancia un siluro su una cella della partita Torneo specificata. Richiede autenticazione e proprietà della partita.

Body della Request:
```json
{
  "row": 3,
  "col": 5
}
```

Response: `200 OK` (successo), `400 Bad Request` (partita non attiva o cella già colpita), `401 Unauthorized` (non autenticato o non proprietario), `404 Not Found` (partita non trovata) o `422 Unprocessable Entity` (errore di validazione).

Body della Response (partita in corso):
```json
{
  "result": "colpito",
  "torpedoesRemaining": 24,
  "status": "attivo"
}
```

Body della Response (partita terminata, aggiunge `fullShips`):
```json
{
  "result": "affondato",
  "torpedoesRemaining": 10,
  "status": "vinto",
  "fullShips": 
  [
    { 
      "row": 3, 
      "col": 5, 
      "size": 3, 
      "dir": "H" 
    }
  ]
}
```

---

### Ottieni le statistiche dell'utente

URL: `/api/stats`

Metodo HTTP: GET

Descrizione: Restituisce le statistiche dell'utente autenticato, suddivise per livello di difficoltà.

Body della Request: _Nessuno_

Response: `200 OK` (successo) o `401 Unauthorized` (non autenticato).

Body della Response:
```json
[
  { 
    "difficulty": "Facile", 
    "played": 3, 
    "won": 2, 
    "lost": 1, 
    "winPct": 66.7 
  },
  { 
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
- `shots`: una riga per ogni siluro lanciato. Colonne: id, game_id, row, col, result (acqua / colpito / affondato). Usata per ricostruire la griglia e calcolare le statistiche.

### Livelli di difficoltà

| Difficoltà  | Griglia | Navi ( dimensioni e numero)                      | Siluri |
|-------------|---------|----------------------------------------|--------|
| Facile      | 7×7     | [2, 2, 3, 3] - 4 navi                 | 18     |
| Intermedio  | 10×10   | [2, 2, 3, 3, 4, 4, 5] - 7 navi        | 28     |
| Difficile   | 14×14   | [2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5] - 12 navi   | 45     |

## Principali componenti React

- `NavHeader` (in `NavHeader.jsx`): barra di navigazione che mostra un pulsante Login in alto a destra quando l'utente non è autenticato, e un pulsante Logout più un pulsante Statistiche in alto a sinistra quando è autenticato.
- `LoginForm` (in `AuthComponents.jsx`): form di login con validazione client-side.
- `DifficultySelector` (in `DifficultySelector.jsx`): selettore del livello di difficoltà tra Facile, Intermedio e Difficile.
- `GameBoard` (in `GameBoard.jsx`): griglia NxN interattiva che mostra le celle acqua, colpito e affondato e gestisce i click per lanciare i siluri.
- `ShipList` (in `ShipList.jsx`): elenco delle navi nella partita corrente con le loro dimensioni e lo stato (affondata o no).
- `TournamentHub` (in `TournamentHub.jsx`): permette di creare un nuovo torneo e ricevere un codice condivisibile, oppure di unirsi a uno esistente inserendo il codice.
- `StatsTable` (in `StatsTable.jsx`): tabella delle statistiche suddivisa per livello di difficoltà.

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
