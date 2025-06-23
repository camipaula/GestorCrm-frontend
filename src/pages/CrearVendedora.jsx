import { useState } from "react";
import "../styles/crearVendedora.css";
import {useNavigate } from "react-router-dom";

const CrearVendedora = () => {
  const navigate = useNavigate();
  const [cedula_ruc, setCedulaRuc] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const crearVendedora = async () => {
    try {
      setError("");
      setMensaje("");
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cedula_ruc,
          nombre,
          email,
          password,
          rol: "vendedora", 
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Error creando vendedora");
      }

      setMensaje("Vendedora creada exitosamente");
      navigate(-1)
      setCedulaRuc("");
      setNombre("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="crear-vendedora-container">
            <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

      <h1>Crear Nueva Vendedora</h1>

      <input
        type="text"
        placeholder="Cédula/RUC"
        value={cedula_ruc}
        onChange={(e) => setCedulaRuc(e.target.value)}
      />
      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
      />
      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={crearVendedora}>Crear Vendedora</button>

      {mensaje && <p className="mensaje">{mensaje}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default CrearVendedora;
