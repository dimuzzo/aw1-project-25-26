import { ListGroup, ListGroupItem } from 'react-bootstrap';

// misura la dimensione di una nave affondata partendo dalla cella con esito 'affondato':
// si espande nelle quattro direzioni contando le celle contigue già colpite. 
// dato che le navi non sono mai adiacenti, le celle colpite vicine sono tutte della stessa nave
function measureSunkShip(row, col, hitCells) {
    let size = 1; // la cella affondata stessa
    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        let r = row + dr, c = col + dc;
        while (hitCells.has(`${r},${c}`)) {
            size += 1;
            r += dr;
            c += dc;
        }
    }
    return size;
}

// calcola le dimensioni delle navi ancora da affondare:
// parte dalla flotta completa e toglie una nave per ogni affondamento dedotto dai tiri
function remainingSizes(ships, shots) {
    // celle già colpite: servono per misurare le navi affondate
    const hitCells = new Set(
        shots.filter(s => s.result !== 'acqua').map(s => `${s.row},${s.col}`)
    );
    // copia modificabile delle dimensioni di tutte le navi della partita
    const remaining = ships.map(s => s.size);
    // ogni tiro con esito 'affondato' segna una nave affondata, che viene misurata e rimossa dalla lista
    for (const shot of shots) {
        if (shot.result === 'affondato') {
            const size = measureSunkShip(shot.row, shot.col, hitCells);
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
            <h5>Navi da affondare ({remaining.length})</h5>
            <ListGroup variant="flush">
                {remaining.map((size, index) => <ShipInList key={index} size={size} />)}
            </ListGroup>
        </>
    );
}

// una nave, mostrata con la sua dimensione e altrettanti quadratini
function ShipInList(props) {
    return (
        <ListGroupItem>
            Nave da {props.size}{' '}
            {[...Array(props.size)].map((el, index) => <i key={index} className="bi bi-square-fill ship-cell" />)}
        </ListGroupItem>
    );
}

export default ShipList;