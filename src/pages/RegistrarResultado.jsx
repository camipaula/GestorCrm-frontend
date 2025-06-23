import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/registrarResultado.css";

const RegistrarResultado = () => {
  const { id_seguimiento } = useParams();
  const navigate = useNavigate();

  const [seguimiento, setSeguimiento] = useState(null);
  const [resultado, setResultado] = useState("");
  const [nota, setNota] = useState("");
  const [estadoProspecto, setEstadoProspecto] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [estados, setEstados] = useState([]);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [fechaSiguiente, setFechaSiguiente] = useState("");
  const [tipoSiguiente, setTipoSiguiente] = useState(null);
  const [motivoSiguiente, setMotivoSiguiente] = useState("");
  const [notaSiguiente, setNotaSiguiente] = useState("");
  const [tiposSeguimiento, setTiposSeguimiento] = useState([]);

  const [prospecto, setProspecto] = useState({});
  const [formDataExtra, setFormDataExtra] = useState({});
  const [tipoSiguienteTexto, setTipoSiguienteTexto] = useState("");

  useEffect(() => {
    obtenerSeguimiento();
    obtenerTipos();
    obtenerEstados();
  }, []);

  const obtenerEstados = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/estados`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setEstados(data);
    } catch (error) {
      console.error("Error al cargar estados:", error);
    }
  };

  const obtenerSeguimiento = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/${id_seguimiento}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error cargando seguimiento");
      const data = await res.json();
      setSeguimiento(data);
      if (data.venta?.prospecto) {
        setProspecto(data.venta.prospecto);
        setEstadoProspecto(data.venta.estado_venta?.id_estado || "");
      }
      setResultado(data.resultado || "");
      setNota(data.nota || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const obtenerTipos = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/tipos-seguimiento`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTiposSeguimiento(data.map(t => ({ value: t.id_tipo, label: t.descripcion })));
    } catch (e) {
      console.error("Error cargando tipos de seguimiento", e);
    }
  };

  const guardarResultado = async () => {
    const estadoSeleccionado = estados.find(e => e.id_estado == estadoProspecto);
    const nombreEstado = estadoSeleccionado?.nombre;

    if (!nombreEstado) {
      alert("Selecciona un estado válido.");
      return;
    }

    const estadosFinales = ["Cierre", "Competencia"];
    if (!estadosFinales.includes(nombreEstado)) {
      setMostrarModal(true);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      let monto_cierre = null;
      if (nombreEstado === "Cierre") {
        const monto = prompt("Por favor, ingresa el monto de cierre de la venta:");
        const montoNumerico = parseFloat(monto);
        if (!monto || isNaN(montoNumerico) || montoNumerico <= 0) {
          alert("Debes ingresar un monto válido para cerrar la venta.");
          return;
        }
        monto_cierre = montoNumerico;
      }

      const body = {
        resultado,
        nota,
        estado: nombreEstado,
      };

      if (monto_cierre !== null) {
        body.monto_cierre = monto_cierre;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/${id_seguimiento}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error("Error guardando resultado");
      alert("Resultado guardado correctamente");
      navigate(-1);
    } catch (err) {
      setError(err.message);
    }
  };


  const agendarDesdeModal = async () => {

    const fechaSeleccionada = new Date(fechaSiguiente);
    const hoy = new Date();
    const unAnioDespues = new Date();
    unAnioDespues.setFullYear(hoy.getFullYear() + 1);

    if (fechaSeleccionada > unAnioDespues) {
      alert("La fecha programada no puede ser mayor a un año desde hoy.");
      return;
    }


    if (!fechaSiguiente || !tipoSiguiente || !motivoSiguiente.trim()) {
      alert("Por favor, completa todos los campos obligatorios del seguimiento.");
      return;
    }

    if (tipoSiguienteTexto === "email" && !prospecto.correo && !formDataExtra.correo) {
      alert("El prospecto necesita un correo para agendar un Email.");
      return;
    }
    if (["llamada", "whatsapp"].includes(tipoSiguienteTexto) && !prospecto.telefono && !formDataExtra.telefono) {
      alert("El prospecto necesita un teléfono para este tipo de seguimiento.");
      return;
    }
    if (tipoSiguienteTexto === "visita" && !prospecto.direccion && !formDataExtra.direccion) {
      alert("El prospecto necesita una dirección para agendar una visita.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // Validar que la vendedora no esté inactiva
      if (prospecto.vendedora && prospecto.vendedora.estado === 0) {
        alert("Esta vendedora está inactiva. No puedes guardar el seguimiento.");
        return;
      }

      if (Object.keys(formDataExtra).length > 0) {
        const resActualizar = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/${prospecto.id_prospecto}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formDataExtra),
        });
        if (!resActualizar.ok) throw new Error("Error actualizando datos del prospecto");
      }

      // Agendar el nuevo seguimiento primero
      const resSeguimiento = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id_venta: seguimiento.venta.id_venta,
          cedula_vendedora: seguimiento.venta.prospecto.cedula_vendedora,
          fecha_programada: fechaSiguiente,
          id_tipo: tipoSiguiente,
          motivo: motivoSiguiente,
          nota: notaSiguiente,
        }),
      });
      const seguimientoData = await resSeguimiento.json();

      if (!resSeguimiento.ok) {
        throw new Error(seguimientoData.message || "Error agendando siguiente seguimiento");
      }

      // Guardar el resultado del seguimiento actual
      const estadoSeleccionado = estados.find(e => e.id_estado == estadoProspecto);
      const nombreEstado = estadoSeleccionado?.nombre;

      const resResultado = await fetch(`${import.meta.env.VITE_API_URL}/api/seguimientos/${id_seguimiento}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resultado, nota, estado: nombreEstado }),
      });

      if (!resResultado.ok) throw new Error("Error guardando resultado");

      alert(`Resultado guardado y seguimiento agendado correctamente a las ${seguimientoData.hora_formateada}`);
      setMostrarModal(false);
      navigate(-1);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>CARGANDO SEGUIMIENTO...</p>;

  return (
    <div className="resultado-container">
      <h1>{seguimiento.estado === "pendiente" ? "Registrar Resultado" : "Editar Resultado"}</h1>
      <div className="seguimiento-info">
        <p><strong>Prospecto:</strong> {seguimiento.venta.prospecto.nombre.toUpperCase()}</p>
        <p><strong>Objetivo de Venta:</strong> {seguimiento.venta.objetivo.toUpperCase()}</p>
        <p><strong>Tipo de Seguimiento:</strong> {seguimiento.tipo_seguimiento.descripcion.toUpperCase()}</p>
        <p><strong>Fecha Programada:</strong> {new Date(seguimiento.fecha_programada).toLocaleDateString()}</p>
        <p><strong>Estado Actual:</strong> {seguimiento.estado.toUpperCase()}</p>
        <p><strong>Motivo:</strong> {seguimiento.motivo.toUpperCase()}</p>
      </div>

      <textarea
        placeholder="RESULTADO DE LA INTERACCIÓN"
        value={resultado}
        onChange={(e) => setResultado(e.target.value)}
      />

      <textarea
        placeholder="NOTAS ADICIONALES (OPCIONAL)"
        value={nota}
        onChange={(e) => setNota(e.target.value)}
      />

      <label>Estado del Prospecto:</label>
      <select value={estadoProspecto} onChange={(e) => setEstadoProspecto(e.target.value)}>
        <option value="">-- Seleccionar estado --</option>
        {estados
          .filter((estado) => estado.nombre.toLowerCase() !== "reabierto")
          .map((estado) => (
            <option key={estado.id_estado} value={estado.id_estado}>
              {estado.nombre.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
            </option>
          ))}

      </select>

      <button onClick={guardarResultado}>
        {seguimiento.estado === "pendiente" ? "Guardar Resultado" : "Actualizar Resultado"}
      </button>

      <button className="btn-volver" onClick={() => navigate(-1)}>← Volver</button>

      {mostrarModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>AGENDAR SIGUIENTE SEGUIMIENTO</h3>
            {error && (
              <p className="error-modal">{error}</p>
            )}


            <input
              type="datetime-local"
              value={fechaSiguiente}
              onChange={(e) => setFechaSiguiente(e.target.value)}
              required
            />



            <select
              value={tipoSiguiente || ""}
              onChange={(e) => {
                const selectedId = parseInt(e.target.value);
                setTipoSiguiente(selectedId);
                const selectedTipo = tiposSeguimiento.find(t => t.value === selectedId);
                setTipoSiguienteTexto(selectedTipo?.label.toLowerCase());
              }}
              required
            >
              <option value="">-- SELECCIONAR TIPO --</option>
              {tiposSeguimiento.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="MOTIVO"
              value={motivoSiguiente}
              onChange={(e) => setMotivoSiguiente(e.target.value)}
              required
            />
            <textarea
              placeholder="NOTA (opcional)"
              value={notaSiguiente}
              onChange={(e) => setNotaSiguiente(e.target.value)}
            />
            {tipoSiguienteTexto === "email" && !prospecto.correo && (
              <>
                <label>Correo del Prospecto *</label>
                <input
                  type="email"
                  value={formDataExtra.correo || ""}
                  onChange={(e) => setFormDataExtra({ ...formDataExtra, correo: e.target.value })}
                />
              </>
            )}
            {["llamada", "whatsapp"].includes(tipoSiguienteTexto) && !prospecto.telefono && (
              <>
                <label>Teléfono del Prospecto *</label>
                <input
                  type="text"
                  value={formDataExtra.telefono || ""}
                  onChange={(e) => setFormDataExtra({ ...formDataExtra, telefono: e.target.value })}
                />
              </>
            )}
            {tipoSiguienteTexto === "visita" && !prospecto.direccion && (
              <>
                <label>Dirección del Prospecto *</label>
                <input
                  type="text"
                  value={formDataExtra.direccion || ""}
                  onChange={(e) => setFormDataExtra({ ...formDataExtra, direccion: e.target.value })}
                />
              </>
            )}
            <div className="modal-buttons">
              <button className="btn-mini" onClick={agendarDesdeModal}>AGENDAR</button>
              <button
                className="btn-mini red"
                onClick={() => {
                  setMostrarModal(false);
                  setError(""); // limpiar error cuando cierra
                }}
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrarResultado;
