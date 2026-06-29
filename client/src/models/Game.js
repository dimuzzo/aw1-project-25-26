// modello dei dati di una partita lato client
function Game(gameId, gridSize, ships, torpedoesRemaining, status, shots, code) {
    this.gameId = gameId;
    this.gridSize = gridSize;
    this.ships = ships; // solo le dimensioni [{ size }], mai le posizioni durante la partita
    this.torpedoesRemaining = torpedoesRemaining;
    this.status = status; // uno tra 'attivo', 'vinto' e 'perso'
    this.shots = shots; // [{ row, col, result }]
    this.code = code; // valorizzato solo alla creazione di un torneo
}

export { Game };