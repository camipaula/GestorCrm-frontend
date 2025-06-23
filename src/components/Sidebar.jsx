import { NavLink } from "react-router-dom";
import PropTypes from "prop-types";
import { logout } from "../utils/auth";
import "../styles/sidebar.css";

const Sidebar = ({ isOpen, toggleSidebar, rol }) => {
  
  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      {/* ☰ Solo visible en escritorio */}
      <button className="toggle-btn desktop-only" onClick={toggleSidebar}>
        ☰
      </button>

      <ul className="sidebar-menu">
        {rol === "vendedora" ? (
          <>
            <li><NavLink to="/vendedora" className="nav-link" onClick={ toggleSidebar }
            >👩 <span className={isOpen ? "show" : "hide"}>HOME</span></NavLink></li>




            <li><NavLink to="/prospectos-vendedora" className="nav-link" onClick={() => {
              if (window.innerWidth <= 768) toggleSidebar(); // solo en móviles
            }}>📋 <span className={isOpen ? "show" : "hide"}>PROSPECTOS</span></NavLink></li>

            <li><NavLink to="/seguimientos-vendedora" className="nav-link" onClick={() => {
              if (window.innerWidth <= 768) toggleSidebar(); // solo en móviles
            }}
            >🛠 <span className={isOpen ? "show" : "hide"}>SEGUIMIENTOS</span></NavLink></li>
            {/* <li><NavLink to="/vendedora" className="nav-link">📦 <span className={isOpen ? "show" : "hide"}>Pedidos</span></NavLink></li>
            <li><NavLink to="/vendedora" className="nav-link">👥 <span className={isOpen ? "show" : "hide"}>Clientes</span></NavLink></li>*/}
            <li><NavLink to="/calendario-vendedora" className="nav-link" onClick={() => {
              if (window.innerWidth <= 768) toggleSidebar(); // solo en móviles
            }}
            >📅 <span className={isOpen ? "show" : "hide"}>CALENDARIO</span></NavLink></li>
          </>
          //Para venedora 
        ) : rol === "admin"  || rol === "lectura" ? (
          <>
            <li>
              <NavLink to="/admin" className="nav-link"
                onClick={toggleSidebar}
              >👩 <span className={isOpen ? "show" : "hide"}> HOME</span></NavLink>
            </li>

            <li>
              <NavLink to="/vendedoras-admin" className="nav-link"
                onClick={() => {
                  if (window.innerWidth <= 768) toggleSidebar(); // solo en móviles
                }}
              >👩‍💼 <span className={isOpen ? "show" : "hide"}> VENDEDORAS</span></NavLink>
            </li>

            <li>
              <NavLink to="/prospectos-admin" className="nav-link" 
              onClick={() => {
                if (window.innerWidth <= 768) toggleSidebar(); // solo en móviles
              }}
              >📋 <span className={isOpen ? "show" : "hide"}>PROSPECTOS</span></NavLink>
            </li>

            <li>
              <NavLink to="/seguimientos-admin" className="nav-link"
                onClick={() => {
                  if (window.innerWidth <= 768) toggleSidebar(); // solo en móviles
                }}
              > 🛠 <span className={isOpen ? "show" : "hide"} >SEGUIMIENTOS</span></NavLink>
            </li>
            <li>
              <NavLink to="/calendario-admin" className="nav-link" 
              onClick={() => {

                if (window.innerWidth <= 768) toggleSidebar(); // solo en móviles
              }}
              >📅 <span className={isOpen ? "show" : "hide"}>CALENDARIO VENDEDORAS</span></NavLink>
              </li>
            {rol === "admin" && (
  <li>
    <NavLink to="/mi-informacion" className="nav-link"
      onClick={() => {
        if (window.innerWidth <= 768) toggleSidebar(); // solo en móviles
      }}
    >
      🧍 <span className={isOpen ? "show" : "hide"}>MI INFORMACION</span>
    </NavLink>
  </li>
)}


            {/*<li><NavLink to="/admin" className="nav-link">📦 <span className={isOpen ? "show" : "hide"}>Pedidos</span></NavLink></li>
            <li><NavLink to="/admin" className="nav-link">👥 <span className={isOpen ? "show" : "hide"}>Clientes</span></NavLink></li>*/}
          </>
        ) : null}
      </ul>

      <button className="logout-btn" onClick={logout}>
        <span className={isOpen ? "show" : "hide"}>Cerrar Sesión</span>
      </button>
    </div>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
  rol: PropTypes.string.isRequired,
};

export default Sidebar;