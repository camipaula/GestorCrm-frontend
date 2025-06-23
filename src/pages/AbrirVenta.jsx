import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/abrirVenta.css";

const AbrirVenta = () => {
  const { id_prospecto } = useParams();
  const navigate = useNavigate();
  const [objetivo, setObjetivo] = useState("");
  const [tipoServicio, setTipoServicio] = useState("");
  const [tiposServicio, setTiposServicio] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarTiposServicio = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tipos-servicio`);
        const data = await res.json();
        setTiposServicio(data);
      } catch (err) {
        console.error("Error cargando tipos de servicio:", err);
      }
    };

    cargarTiposServicio();
  }, []);

  const crearVenta = async () => {
    if (!objetivo.trim()) {
      setError("Por favor ingresa un objetivo para la prospección.");
      return;
    }

    if (!tipoServicio) {
      setError("Por favor selecciona un tipo de servicio.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_prospecto,
          objetivo,
          id_tipo_servicio: parseInt(tipoServicio), 
        }),
      });

      if (!res.ok) throw new Error("Error creando la prospección");

      const data = await res.json();
      navigate(`/seguimientos-prospeccion/${data.id_venta}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="abrir-venta-container">
      <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

      <h1>Abrir Nueva Prospección</h1>

      <textarea
        placeholder="Objetivo de la prospección"
        value={objetivo}
        onChange={(e) => {
          setObjetivo(e.target.value);
          setError("");
        }}
      />

      <select
        value={tipoServicio}
        onChange={(e) => {
          setTipoServicio(e.target.value);
          setError("");
        }}
        className="select-servicio"
      >
        <option value="">Selecciona tipo de servicio</option>
        {tiposServicio.map((tipo) => (
          <option key={tipo.id_tipo_servicio} value={tipo.id_tipo_servicio}>
            {tipo.nombre}
          </option>
        ))}
      </select>

      <button onClick={crearVenta}>Abrir Prospección</button>

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default AbrirVenta;
