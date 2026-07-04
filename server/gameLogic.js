/* modulo con logica di gioco: posizionamento navi, esito siluro, aggiornamento siluri e stato partita */
export default function placeShipsOnGrid(gridSize, shipSizes) {
    // prova fino a 1000 volte a piazzare tutte le navi
    for (let i = 0; i < 1000; i++) {
        // griglia: 0 = cella libera, 1 = nave, 2 = margine tra navi
        const grid = new Array(gridSize).fill(0).map(() => new Array(gridSize).fill(0));
        const ships = [];
        let success = true;

        for (const size of shipSizes) {
            let placed = false;
            for (let j = 0; j < 100; j++) {
                const dir = Math.random() < 0.5 ? 'V' : 'H';
                const row = Math.floor(Math.random() * gridSize);
                const col = Math.floor(Math.random() * gridSize);
                if (canPlaceShip(grid, row, col, size, dir, gridSize)) {
                    doPlaceShip(grid, row, col, size, dir, gridSize);
                    ships.push({ row, col, size, dir });
                    placed = true;
                    break; // una volta piazzata una nave si passa alla successiva
                }
            }
            if (!placed) {
                success = false;
                break; // se non si riesce a piazzare una nave si ricomincia da capo
            }
        }
        if (success) return { grid, ships };
    }
    throw new Error('Impossibile piazzare le navi');
}

// verifica se è possibile piazzare una nave
// la nave deve restare dentro la griglia e non sovrapporsi alle navi (1) né alle celle adiacenti ad esse (2)
function canPlaceShip(grid, row, col, size, dir, gridSize) {
    for (let i = 0; i < size; i++) {
        if (dir === 'V') {
            if (row + i >= gridSize || grid[row + i][col] !== 0) return false;
        }
        else {
            if (col + i >= gridSize || grid[row][col + i] !== 0) return false;
        }
    }
    return true;
}

// piazza la nave, segna le celle della nave come 1 e le celle adiacenti libere come 2
function doPlaceShip(grid, row, col, size, dir, gridSize) {
    for (let i = 0; i < size; i++) {
        if (dir === 'V') {
            grid[row + i][col] = 1;
        }
        else {
            grid[row][col + i] = 1;
        }
    }

    // segna le celle adiacenti come 2 (margine tra navi)
    for (let i = 0; i < size; i++) {
        const cellRow = dir === 'V' ? row + i : row;
        const cellCol = dir === 'V' ? col : col + i;
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = cellRow + dr, nc = cellCol + dc;
                if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize && grid[nr][nc] === 0) {
                    grid[nr][nc] = 2;
                }
            }
        }
    }
}

// espande una nave nell'elenco delle celle che occupa
export function getShipCells(ship) {
    const cells = [];
    for (let i = 0; i < ship.size; i++) {
        if (ship.dir === 'V') cells.push({ row: ship.row + i, col: ship.col });
        else cells.push({ row: ship.row, col: ship.col + i });
    }
    return cells;
}

// calcola l'esito di un siluro su (row, col)
// ships: navi della partita
// shots: tiri precedenti
// restituisce { result: 'acqua' || 'colpito' || 'affondato', won: boolean }
export function computeShotResult(ships, shots, row, col) {
    // trova la nave che occupa la cella colpita, se esiste
    const hitShip = ships.find(ship =>
        getShipCells(ship).some(c => c.row === row && c.col === col)
    );

    // nessuna nave: è acqua e un tiro a vuoto non può far vincere
    if (!hitShip) {
        return { result: 'acqua', won: false };
    }

    // insieme delle celle già colpite, più quella attuale
    const hit = new Set(
        shots.filter(s => s.result !== 'acqua').map(s => `${s.row},${s.col}`)
    );
    hit.add(`${row},${col}`);

    // nave affondata se tutte le sue celle sono state colpite
    const sunk = getShipCells(hitShip).every(c => hit.has(`${c.row},${c.col}`));

    // partita vinta se tutte le celle di tutte le navi sono state colpite
    const won = ships.every(ship =>
        getShipCells(ship).every(c => hit.has(`${c.row},${c.col}`))
    );

    return { result: sunk ? 'affondato' : 'colpito', won };
}

// dato l'esito di un tiro, calcola i siluri rimasti e lo stato della partita
export function applyShot(result, won, torpedoes) {
    const torpedoesRemaining = result === 'acqua' ? torpedoes - 1 : torpedoes;
    let status = 'attivo';
    if (won) status = 'vinto';
    else if (torpedoesRemaining === 0) status = 'perso';
    return { torpedoesRemaining, status };
}