import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Table, Alert, Button } from 'react-bootstrap';
import API from '../API.js';
import { Game } from '../models/Game.js';

// componente della griglia di gioco, montato sulla route /game/:id (vale sia per casual sia per torneo)
function GameBoard() {
    const { id } = useParams();
    const [game, setGame] = useState(null); // il modello Game caricato dal server
    const [ships, setShips] = useState(null); // posizioni delle navi, recuperate solo a partita finita
    const [error, setError] = useState(''); // errore locale alla pagina di gioco

    // carica lo stato della partita al montaggio e se cambia l'id nell'url
    useEffect(() => {
        API.getGame(id)
            .then(g => setGame(g))
            .catch(e => setError(e));
    }, [id]);

    // a partita finita recupera le posizioni delle navi, una volta sola, per rivelarle sulla griglia
    useEffect(() => {
        if (game && game.status !== 'attivo' && !ships) {
            API.getShips(id)
                .then(s => setShips(s))
                .catch(e => setError(e));
        }
    }, [game, id, ships]);

    // lancia un siluro sulla cella (row, col) e aggiorna lo stato in locale con la risposta del server
    const handleShot = async (row, col) => {
        // ignora il click se la partita è finita o se la cella è già stata colpita
        if (game.status !== 'attivo') return;
        if (game.shots.some(s => s.row === row && s.col === col)) return;
        try {
            const res = await API.fireShot(id, row, col); // { result, torpedoesRemaining, status }
            // ricostruisce una nuova istanza Game registrando il tiro appena risolto dal server
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

    if (error)
        return <Alert variant="danger">{error}</Alert>;
    if (!game)
        return <p>Caricamento della partita...</p>;

    // insieme delle celle occupate da una nave, calcolato solo a partita finita per la rivelazione
    const shipCells = new Set();
    if (ships) {
        for (const ship of ships) {
            for (let i = 0; i < ship.size; i++) {
                const r = ship.dir === 'V' ? ship.row + i : ship.row;
                const c = ship.dir === 'V' ? ship.col : ship.col + i;
                shipCells.add(`${r},${c}`);
            }
        }
    }

    // descrive una cella in base ai tiri e alle navi se sono state rivelate
    const describeCell = (row, col) => {
        const shot = game.shots.find(s => s.row === row && s.col === col);
        if (shot) {
            if (shot.result === 'acqua') return { className: 'cell cell-miss', icon: 'bi-record-circle' };
            if (shot.result === 'colpito') return { className: 'cell cell-hit', icon: 'bi-x-lg' };
            return { className: 'cell cell-sunk', icon: 'bi-fire' }; // affondato
        }
        // cella di una nave mai colpita, mostrata solo a partita finita
        if (shipCells.has(`${row},${col}`)) return { className: 'cell cell-ship', icon: 'bi-square-fill' };
        return { className: 'cell cell-water', icon: null };
    };

    const over = game.status !== 'attivo';

    return (
        <>
            <h2>Battaglia Navale</h2>
            <p>Siluri rimasti: <strong>{game.torpedoesRemaining}</strong></p>
            {over &&
                <Alert variant={game.status === 'vinto' ? 'success' : 'danger'}>
                    {game.status === 'vinto'
                        ? 'Hai vinto! Tutte le navi sono state affondate.'
                        : 'Hai perso! I siluri sono esauriti.'}
                </Alert>
            }
            <Table bordered className="game-board">
                <tbody>
                    {Array.from({ length: game.gridSize }, (_, row) =>
                        <tr key={row}>
                            {Array.from({ length: game.gridSize }, (_, col) => {
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
            {over && <Link to="/"><Button variant="primary">Torna alla home</Button></Link>}
        </>
    );
}

export default GameBoard;