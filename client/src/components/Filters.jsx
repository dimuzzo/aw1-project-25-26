import { ListGroup, NavItem } from "react-bootstrap";
import { NavLink } from "react-router-dom";

// barra di filtri per livello nella pagina delle statistiche
// ogni NavLink naviga ad un URL e si evidenzia tramite isActive in base all'URL corrente
function Filters(props) {
  return (
    <div className="bg-light border rounded p-2">
      <h5 className="mb-2">Filtra per livello</h5>
      <ListGroup as="ul" variant="flush" className="nav nav-pills flex-column gap-2">
        {/* il link "tutti i livelli" ha end, così resta attivo solo su /stats e non, ad esempio, su /stats/Facile */}
        <NavItem>
          <NavLink end className={({ isActive }) => `nav-link ${isActive ? 'active' : 'link-dark'}`} to="/stats">
            Tutti i livelli
          </NavLink>
        </NavItem>
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