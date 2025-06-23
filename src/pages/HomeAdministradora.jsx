import { useEffect } from "react";
import { isAuthenticated, logout } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import "../styles/homeAdministradora.css"; 

const HomeAdministradora = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/"); // Si no está autenticado, redirigir al login
    }
  }, []);

  return (
    <div className="admin-home-container">
      <div className="admin-box">
        <h2>Bienvenida, Administradora</h2>

        <div className="admin-menu">
          <button className="btn-prospectos" onClick={() => navigate("/prospectos-admin")}>
            Prospectos
          </button>
          <button className="btn-pedidos" onClick={() => navigate("/pedidos")}>
            Pedidos
          </button>
          <button className="btn-clientes" onClick={() => navigate("/clientes")}>
            Clientes
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

export default HomeAdministradora;
