import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRol } from "../utils/auth"; 
import "../styles/editarVendedora.css";

const EditarVendedora = () => {
  const { cedula_ruc } = useParams();
  const navigate = useNavigate();
    const rol = getRol(); // OBTENER ROL
  const esSoloLectura = rol === "lectura"; // MARCAR SI ES SOLO LECTURA


  const [vendedora, setVendedora] = useState(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // Para cambiar la contraseña
  const [estado, setEstado] = useState(1); // Para inactivar/activar
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerVendedora();
  }, []);

  const obtenerVendedora = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras/${cedula_ruc}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error al obtener vendedora");

      const data = await res.json();
      setVendedora(data);
      setNombre(data.nombre);
      setEmail(data.email);
      setEstado(data.estado); // Guardar estado actual (activa/inactiva)
    } catch (err) {
      setError(err.message);
    }
  };

  const guardarCambios = async () => {
    try {
      const token = localStorage.getItem("token");
      const bodyData = { nombre, email, estado };

      if (password.trim()) {
        bodyData.password = password; // Solo se envía si el usuario cambia la contraseña
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras/${cedula_ruc}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) throw new Error("Error al guardar cambios");

      alert("Cambios guardados correctamente");
      navigate(-1);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleEstado = async () => {
    try {
      const nuevoEstado = estado === 1 ? 0 : 1;
      const token = localStorage.getItem("token");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras/${cedula_ruc}/inactivar`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ estado: nuevoEstado }), 
        }
      );
  
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al cambiar el estado");
      }
  
      setEstado(nuevoEstado);
      alert(`Vendedora ${nuevoEstado === 1 ? "Activada" : "Inactivada"} correctamente`);
    } catch (err) {
      console.error("Error al cambiar el estado:", err);
      setError(err.message);
    }
  };
  
  

  if (!vendedora) return <p>Cargando vendedora...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="editar-vendedora-container">
      <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

      <h1>EDITAR VENDEDOR/A</h1>

      <div className="form-group">
        <label>Nombre:</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={esSoloLectura}
        />
      </div>

      <div className="form-group">
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={esSoloLectura}
        />
      </div>

      <div className="form-group">
        <label>Nueva Contraseña (Opcional):</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Ingrese una nueva contraseña"
          disabled={esSoloLectura}
        />
      </div>
 {!esSoloLectura && (
        <>
      <button onClick={guardarCambios} className="btn-guardar">
        GUARDAR CAMBIOS
      </button>

      <button onClick={toggleEstado} className={`btn-estado ${estado === 1 ? "inactiva" : "activa"}`}>
        {estado === 1 ? "MARCAR COMO INACTIVO" : "ACTIVAR VENDEDOR/A"}
      </button>
       </>
       )}
    </div>
  );
};

export default EditarVendedora;
