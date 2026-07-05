import { ListGroup, NavItem } from "react-bootstrap";
import { NavLink } from "react-router";

// barra dei filtri per livello, mostrata accanto alle statistiche
// ogni voce porta ad un indirizzo diverso e viene evidenziata se selezionata
function Filters(props) {
  return (
    <div className="bg-light border rounded p-2">
      <h5 className="mb-2">Filtra per livello</h5>
      <ListGroup as="ul" variant="flush" className="nav nav-pills flex-column gap-2">
        {/* voce per mostrare tutte le statistiche di tutti i livelli */}
        <NavItem>
          <NavLink end className={({ isActive }) => `nav-link ${isActive ? 'active' : 'link-dark'}`} to="/stats">
            Tutti i livelli
          </NavLink>
        </NavItem>
        {/* voce per ogni livello, ognuna mostra le statistiche di quel livello */}
        {props.levels.map((level) =>
          <NavItem key={level}>
            <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : 'link-dark'}`} to={`/stats/${level}`}>
              Livello {level}
            </NavLink>
          </NavItem>
        )}
      </ListGroup>
    </div>
  );
}

export default Filters;