/* Modulo per la gestione della logica di gioco (posizionamento navi) */
export default function placeShipsOnGrid(gridSize, shipSizes) {
    // prova fino a 1000 volte a piazzare tutte le navi
    for (let i = 0; i < 1000; i++) {
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
// la nave deve restare dentro la griglia (può toccare i bordi) e non sovrapporsi alle navi (1) né alle celle adiacenti ad esse (2)
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

// piazza la nave, segna le celle della nave come 1 e le celle adiacenti libere come 2 (buffer)
function doPlaceShip(grid, row, col, size, dir, gridSize) {
    for (let i = 0; i < size; i++) {
        if (dir === 'V') {
            grid[row + i][col] = 1;
        }
        else {
            grid[row][col + i] = 1;
        }
    }

    // segna le celle adiacenti come 2 (buffer)
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