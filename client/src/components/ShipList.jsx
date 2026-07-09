import { Table } from 'react-bootstrap';

// misura la dimensione di una nave affondata partendo dalla cella con esito 'affondato':
// si espande nelle quattro direzioni contando le celle contigue già colpite
// dato che le navi non sono mai adiacenti, le celle colpite vicine sono tutte della stessa nave
function measureSunkShip(row, col, hitCells) {
    let size = 1; // la cella affondata stessa
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        let r = row + dr, c = col + dc;
        while (hitCells.has(`${r},${c}`)) { // avanza finché trova celle colpite vicine
            size += 1;
            r += dr;
            c += dc;
        }
    }
    return size;
}

// calcola le dimensioni delle navi ancora da affondare
// parte dalla flotta completa e toglie una nave per ogni affondamento dedotto dai tiri
function remainingSizes(ships, shots) {
    // celle già colpite, servono per misurare le navi affondate
    const hitCells = new Set(
        shots.filter(s => s.result !== 'acqua').map(s => `${s.row},${s.col}`)
    );
    // copia modificabile delle dimensioni di tutte le navi della partita
    const remaining = ships.map(s => s.size);
    // ogni tiro con esito 'affondato' segna una nave affondata, che viene misurata e rimossa dalla lista
    for (const shot of shots) {
        if (shot.result === 'affondato') {
            const size = measureSunkShip(shot.row, shot.col, hitCells);
            // trova una nave di quella dimensione e la toglie dall'elenco
            const index = remaining.indexOf(size);
            if (index !== -1) remaining.splice(index, 1);
        }
    }
    return remaining;
}

// elenco delle navi ancora da affondare nella partita corrente, con la loro dimensione
function ShipList(props) {
    const remaining = remainingSizes(props.ships, props.shots);
    return (
        <>
            <h5>Navi da affondare ({remaining.length}/{props.ships.length})</h5>
            <Table borderless size="sm" className="ships-table">
                <tbody>
                    {remaining.map((size, index) => <ShipInList key={index} size={size} />)}
                </tbody>
            </Table>
        </>
    );
}

// una nave con la sua dimensione (rappresentata da quadratini)
function ShipInList(props) {
    return (
        <tr>
            <td>Nave da {props.size}</td>
            <td>{[...Array(props.size)].map((_, index) => <i key={index} className="bi bi-square-fill ship-cell" />)}</td>
        </tr>
    );
}

export default ShipList;