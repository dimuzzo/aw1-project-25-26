import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router';
import { Table, Alert, Row, Col } from 'react-bootstrap';
import API from '../API.js';
import { Game } from '../models/Game.js';
import ShipList from './ShipList.jsx';

// componente della griglia di gioco, associato alla route /game/:id (vale sia per casual sia per torneo)
function GameBoard(props) {
    const { id } = useParams(); // legge i parametri dinamici dell'URL, estraendo :id dalla route /game/:id ('casual' o numerico)
    const [game, setGame] = useState({}); // il modello Game (oggetto vuoto finché non è caricato dal server)
    const [ships, setShips] = useState([]); // posizioni delle navi (array vuoto finché non rivelate a fine partita)
    const [error, setError] = useState(''); // errore locale alla pagina di gioco

    // carica lo stato della partita al primo caricamento della pagina e se cambia l'id nell'url
    useEffect(() => {
        API.getGame(id)
            .then(g => setGame(g))
            .catch(e => setError(e));
    }, [id]);

    // a partita finita recupera le posizioni delle navi, una volta sola, per rivelarle sulla griglia
    useEffect(() => {
        if (game.status && game.status !== 'attivo' && ships.length === 0) {
            API.getShips(id)
                .then(s => setShips(s))
                .catch(e => setError(e));
        }
    }, [game, id, ships]);

    // lancia un siluro sulla cella (row, col) e aggiorna lo stato in locale con la risposta del server
    // non serve ricaricare la partita, l'esito lo calcola il server e la risposta contiene già tutto
    const handleShot = async (row, col) => {
        // ignora il click se la partita è finita o se la cella è già stata colpita
        if (game.status !== 'attivo') return;
        if (game.shots.some(s => s.row === row && s.col === col)) return;
        try {
            const res = await API.fireShot(id, row, col); // { result, torpedoesRemaining, status }
            // ricostruisce una nuova istanza Game registrando il tiro appena risolto dal server
            // a react serve un nuovo oggetto per rilevare il cambio di stato
            setGame(new Game(
                game.gameId,
                game.gridSize,
                game.ships,
                res.torpedoesRemaining,
                res.status,
                [...game.shots, { row, col, result: res.result }],
                game.code
            ));
        } catch (e) {
            setError(e);
        }
    };

    // le partite di torneo richiedono l'accesso, dunque senza login (o dopo un logout durante la partita) si torna alla home
    if (id !== 'casual' && !props.loggedIn) return <Navigate replace to="/" />;

    // se il caricamento della partita fallisce, mostra l'errore al posto della griglia
    if (error) return <Alert variant="danger">{error}</Alert>;

    // finché la partita non viene caricata dal server, mostra un messaggio di attesa
    if (!game.gridSize) return <p>Caricamento della partita...</p>;

    // insieme delle celle occupate da una nave (vuoto finché le navi non vengono rivelate a fine partita)
    const shipCells = new Set();
    for (const ship of ships) {
        for (let i = 0; i < ship.size; i++) {
            const r = ship.dir === 'V' ? ship.row + i : ship.row;
            const c = ship.dir === 'V' ? ship.col : ship.col + i;
            shipCells.add(`${r},${c}`);
        }
    }

    // descrive una cella in base ai tiri e alle navi se sono state rivelate
    const describeCell = (row, col) => {
        const shot = game.shots.find(s => s.row === row && s.col === col);
        if (shot) {
            if (shot.result === 'acqua') return { className: 'cell cell-miss', icon: 'bi-droplet-fill' };
            if (shot.result === 'colpito') return { className: 'cell cell-hit', icon: 'bi-record-circle' };
            return { className: 'cell cell-sunk', icon: 'bi-fire' }; // affondato
        }
        // cella di una nave mai colpita, mostrata solo a partita finita
        if (shipCells.has(`${row},${col}`)) return { className: 'cell cell-ship', icon: 'bi-square-fill' };
        // cella ancora da colpire, nessun tiro e nessuna nave rivelata, resta vuota
        return { className: 'cell cell-water', icon: null };
    };

    // la partita è finita quando lo stato non è più 'attivo', cioè quando è 'vinto' o 'perso'
    const over = game.status !== 'attivo';

    return (
        <>
            {/* messaggio in cima quando la partita è finita (riquadro verde se si vince, rosso se si perde) */}
            {over &&
                <Alert variant={game.status === 'vinto' ? 'success' : 'danger'}>
                    {game.status === 'vinto'
                        ? 'Hai vinto! Sei riuscito ad affondare tutte le navi nemiche.'
                        : 'Hai perso! Sfortunatamente hai esaurito tutti i siluri...'}
                </Alert>
            }
            {/* legenda delle celle */}
            <div className="game-legend mb-2">
                <span className="legend-item"><span className="legend-empty"></span> Da colpire</span>
                <span className="legend-item"><i className="bi bi-droplet-fill legend-water"></i> Acqua</span>
                <span className="legend-item"><i className="bi bi-record-circle legend-hit"></i> Colpito</span>
                <span className="legend-item"><i className="bi bi-fire legend-sunk"></i> Affondato</span>
                <span className="legend-item"><i className="bi bi-square-fill legend-ship"></i> Nave rivelata</span>
            </div>
            {/* siluri rimasti */}
            <p className="lead">
                <i className="bi bi-crosshair me-2"></i>
                Siluri rimasti: <strong>{game.torpedoesRemaining}</strong>
            </p>
            <Row>
                {/* griglia a sinistra */}
                <Col md="auto">
                    <Table bordered className="game-board">
                        <tbody>
                            {/* costruisce la griglia riga per riga: il primo ciclo genera le righe */}
                            {Array.from({ length: game.gridSize }, (_, row) =>
                                <tr key={row}>
                                    {/* per ogni riga il secondo ciclo genera le celle, una per colonna */}
                                    {Array.from({ length: game.gridSize }, (_, col) => {
                                        // per ogni cella decide classe e icona in base ai tiri effettuati
                                        const { className, icon } = describeCell(row, col);
                                        return (
                                            <td key={col} className={className} onClick={() => handleShot(row, col)}>
                                                {icon && <i className={`bi ${icon}`}></i>}
                                            </td>
                                        );
                                    })}
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </Col>
                {/* lista delle navi da affondare a destra, con il pulsante sotto la tabella */}
                <Col md={4}>
                    <ShipList ships={game.ships} shots={game.shots} />
                    {over && <Link className="btn btn-primary mt-3" to="/">Torna alla home</Link>}
                </Col>
            </Row>
        </>
    );
}

export default GameBoard;