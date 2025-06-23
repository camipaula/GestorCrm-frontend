import { useEffect } from "react";
import { isAuthenticated, logout } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import "../styles/homeVendedora.css"; 

const HomeVendedora = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/"); // Si no está autenticado, redirigir al login
    }
  }, []);

  return (
    <div className="vendedora-home-container">
      <div className="vendedora-box">
        <h2>Bienvenida, Vendedora</h2>

        <div className="vendedora-menu">
          <button className="btn-prospectos" onClick={() => navigate("/prospectos-vendedora")}>
            Prospectos
          </button>
          <button className="btn-seguimientos" onClick={() => navigate("/seguimientos-vendedora")}>
            Seguimientos de Prospectos
          </button>
          <button className="btn-pedidos" onClick={() => navigate("/pedidos")}>
            Pedidos
          </button>
          <button className="btn-clientes" onClick={() => navigate("/clientes")}>
            Clientes
          </button>
          <button className="btn-calendario" onClick={() => navigate("/calendario-vendedora")}>
            📅 Mi Calendario
          </button>

          <button className="btn-cerrar" onClick={() => {
            logout();
            navigate("/");
          }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeVendedora;
