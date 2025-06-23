import { useNavigate, useLocation } from "react-router-dom";
import { logout, getNombreUsuario } from "../utils/auth";
import PropTypes from "prop-types";
import "../styles/navbar.css";

const Navbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const rutasSinFlecha = ["/admin", "/vendedora"];
  const mostrarFlecha = !rutasSinFlecha.includes(location.pathname);
  const nombreUsuario = getNombreUsuario();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {/* ☰ Solo en móviles */}
        <button className="mobile-menu-btn" onClick={toggleSidebar}>
          ☰
        </button>

        {mostrarFlecha && (
          <button className="back-btn" onClick={() => navigate(-1)}>
            ⬅
          </button>
        )}
      </div>

      <h2 className="navbar-title">GESTOR TAX</h2>

      <div className="navbar-right">
      <span className="nombre-usuario">👤Bienvenida, {nombreUsuario}</span>
        <button className="logout-btn" onClick={logout}>
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
};

Navbar.propTypes = {
  toggleSidebar: PropTypes.func.isRequired,
};

export default Navbar;
