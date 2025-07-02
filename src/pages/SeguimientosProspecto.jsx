import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRol } from "../utils/auth"; // IMPORTANTE

import "../styles/seguimientosVendedora.css";
import React from "react";
import Select from "react-select";

const SeguimientosProspecto = () => {

  const { id_prospecto } = useParams();
  const navigate = useNavigate();
  const [prospecciones, setProspecciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas"); // 🔹 Estado del filtro

  const [modalEditar, setModalEditar] = useState(false);
  const [idVentaSeleccionada, setIdVentaSeleccionada] = useState(null);
  const [nuevoObjetivo, setNuevoObjetivo] = useState("");
  const [nuevoMontoProyectado, setNuevoMontoProyectado] = useState("");
  const [modalReabrir, setModalReabrir] = useState(false);
  const [notaReapertura, setNotaReapertura] = useState("");
  const [fechaReapertura, setFechaReapertura] = useState("");

  //modal nueva prospeccion
  const [mostrarModalAbrirVenta, setMostrarModalAbrirVenta] = useState(false);
  const [nuevoMonto, setNuevoMonto] = useState("");
  const [errorCrearVenta, setErrorCrearVenta] = useState("");
  const [tiposServicio, setTiposServicio] = useState([]);
  const [tipoServicioSeleccionado, setTipoServicioSeleccionado] = useState(null);


  const rol = getRol();
  const esSoloLectura = rol === "lectura";

  useEffect(() => {
    buscarSeguimientos();
  }, [filtroEstado]);

  useEffect(() => {
    const obtenerTiposServicio = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tipos-servicio`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setTiposServicio(data.map(t => ({ value: t.id_tipo_servicio, label: t.nombre })));
      } catch (err) {
        console.error("Error al cargar tipos de servicio:", err);
      }
    };

    obtenerTiposServicio();
  }, []);

  const formatearMonto = (monto) => {
    return monto != null
      ? `$${parseFloat(monto).toLocaleString("es-EC", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
      : "No definido";
  };

  const abrirModalReabrir = (id_venta) => {
    setIdVentaSeleccionada(id_venta);
    setNotaReapertura("");

    // Setear la fecha actual a las 08:00
    const hoy = new Date();
    hoy.setHours(8, 0, 0, 0);
    const isoFecha = hoy.toISOString().slice(0, 16); // formato para datetime-local

    setFechaReapertura(isoFecha);
    setModalReabrir(true);
  };



  const buscarSeguimientos = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      let url = `${import.meta.env.VITE_API_URL}/api/ventas/prospecto/${id_prospecto}`;
      if (filtroEstado !== "todas") url += `?estado_prospeccion=${filtroEstado}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (!res.ok) throw new Error("Error obteniendo seguimientos del prospecto");
      const data = await res.json();

      if (data.length === 0) {
        //Si el prospecto no tiene ventas, redirigir a "AbrirVenta"
        navigate(`/abrir-venta/${id_prospecto}`);
        return;
      }

      setProspecciones(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const abrirModalEditar = (id_venta, objetivoActual, montoProyectadoActual, tipoServicioActual) => {
    setIdVentaSeleccionada(id_venta);
    setNuevoObjetivo(objetivoActual);
    setNuevoMontoProyectado(montoProyectadoActual ?? "");
    setTipoServicioSeleccionado(tipoServicioActual
      ? { value: tipoServicioActual.id_tipo_servicio, label: tipoServicioActual.nombre }
      : null
    );
    setModalEditar(true);
  };

  const formatearFechaVisual = (fechaStr) => {
    const fecha = new Date(fechaStr.replace("Z", ""));
    return fecha.toLocaleString("es-EC", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };
  const guardarObjetivo = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${idVentaSeleccionada}/objetivo`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          objetivo: nuevoObjetivo,
          monto_proyectado: parseFloat(nuevoMontoProyectado),
          id_tipo_servicio: tipoServicioSeleccionado?.value || null
        }),

      });

      if (!res.ok) throw new Error("Error actualizando objetivo y monto");
      alert("Actualización exitosa");
      setModalEditar(false);
      buscarSeguimientos();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const confirmarReapertura = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/${idVentaSeleccionada}/reabrir`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nota: notaReapertura,
          fecha_programada: fechaReapertura,
        }),
      });

      if (!res.ok) throw new Error("No se pudo reabrir la venta");
      alert("Venta reabierta correctamente");
      setModalReabrir(false);
      buscarSeguimientos();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };


  const handleCrearVenta = async () => {
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
          objetivo: nuevoObjetivo,
          monto_proyectado: parseFloat(nuevoMonto),
          id_tipo_servicio: tipoServicioSeleccionado?.value || null

        }),
      });

      if (!res.ok) throw new Error("Error creando nueva prospección");
      alert("Venta creada correctamente");
      setMostrarModalAbrirVenta(false);
      setNuevoObjetivo("");
      setNuevoMonto("");
      setTipoServicioSeleccionado(null);

      buscarSeguimientos();
    } catch (err) {
      setErrorCrearVenta(err.message);
    }
  };

  return (
    <div className="seguimientos-container">

      <h1 className="title">Seguimientos del Prospecto</h1>
      <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>
      {!esSoloLectura && (
        <button className="btn-agregar" onClick={() => setMostrarModalAbrirVenta(true)}>
          ➕ Nueva Prospección
        </button>
      )}

      <div className="filtros-container">
        <label>Filtrar por estado de prospección:</label>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todas">Todas</option>
          <option value="abiertas">Abiertas</option>
          <option value="cerradas">Cerradas</option>
        </select>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}

      <table className="tabla-seguimientos-prospecto">
        <thead>
          <tr>
            <th>Objetivo</th>
            <th>Estado de la Prospección</th>
            <th>Monto Proyectado</th>

            <th>Monto de Cierre</th>
            <th>Última Fecha</th>
            <th>Último Tipo</th>
            <th>Último Resultado</th>
            <th>Última Nota</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {prospecciones.map((p) => {
            const ultimoSeguimiento = p.seguimientos?.[0] || {};
            const siguienteSeguimiento = p.seguimientos
              ?.filter((s) => s.estado === "pendiente")
              .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];

            return (
              <React.Fragment key={p.id_venta}>

                <tr key={p.id_venta}>
                  <td>
                    {p.objetivo?.toUpperCase() || "SIN OBJETIVO"}
                    <br />
                    <small style={{ color: "#555" }}>
                      {p.tipo_servicio?.nombre ? `🛠 ${p.tipo_servicio.nombre}` : "Sin tipo de servicio"}
                    </small>
                  </td>
                  <td>{p.abierta ? "ABIERTA" : "CERRADA"}</td>
                  <td>{formatearMonto(p.monto_proyectado)}</td>


                  <td>
                    {p.abierta
                      ? "—"
                      : typeof p.monto_cierre === "number"
                        ? formatearMonto(p.monto_cierre)
                        : "SIN  MONTO"}
                  </td>

                  <td>{ultimoSeguimiento.fecha_programada ? new Date(ultimoSeguimiento.fecha_programada).toLocaleDateString() : "No hay"}</td>
                  <td>{ultimoSeguimiento.tipo_seguimiento?.descripcion ? ultimoSeguimiento.tipo_seguimiento.descripcion.toUpperCase() : "No registrado"}</td>
                  <td>{ultimoSeguimiento.resultado ? ultimoSeguimiento.resultado.toUpperCase() : "Pendiente"}</td>
                  <td>{ultimoSeguimiento.nota ? ultimoSeguimiento.nota.toUpperCase() : "Sin nota"}</td>
                  <td>
                    <button
                      className="btn-ver-seguimientos"
                      onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)}
                    >
                      📜 Ver Seguimientos
                    </button>
                    {!esSoloLectura && (
                      <button className="btn-mini" onClick={() =>
                        abrirModalEditar(p.id_venta, p.objetivo, p.monto_proyectado, p.tipo_servicio)
                      }>✏️</button>
                    )}
                    {!esSoloLectura && rol === "admin" && !p.abierta && p.estado_venta?.nombre === "No interesado" && (
                      <button className="btn-mini" onClick={() => abrirModalReabrir(p.id_venta)}>REABIR</button>
                    )}

                  </td>
                </tr>

                {/* Nueva fila con la siguiente fecha y motivo */}
                <tr className="fila-info-extra">
                  <td colSpan="9" style={{ fontStyle: "italic", color: "#555", backgroundColor: "#c9edec" }}>
                    <strong>Siguiente fecha programada:</strong>{" "}
                    {siguienteSeguimiento ? (
                      <>
                        {formatearFechaVisual(siguienteSeguimiento.fecha_programada)}
                        {" — "}
                        <strong>Motivo:</strong> {siguienteSeguimiento.motivo || "Sin motivo"}
                      </>
                    ) : (
                      "No se ha agendado un seguimiento."
                    )}
                  </td>
                </tr>

              </React.Fragment>

            );
          })}

        </tbody>
      </table>


      <div className="tarjetas-seguimientos-prospecto">
        {prospecciones.map((p) => {
          const s = p.seguimientos?.[0] || {};
          const siguienteSeguimiento = p.seguimientos
            ?.filter((s) => s.estado === "pendiente")
            .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];

          return (
            <div className="card-seguimiento" key={p.id_venta}>
              <h3>🎯 Objetivo: {p.objetivo || "No definido"}</h3>
              <p>
                <strong>Tipo de Servicio:</strong> {p.tipo_servicio?.nombre || "Sin tipo"}
              </p>
              <p>
                <strong>Monto Proyectado:</strong> {formatearMonto(p.monto_proyectado)}
              </p>


              <p><strong>Estado Prospección:</strong> {p.abierta ? "Abierta" : "Cerrada"}</p>
              {!p.abierta && (
                <p>
                  <strong>Monto Cierre:</strong>{" "}
                  {typeof p.monto_cierre === "number"
                    ? formatearMonto(p.monto_cierre)
                    : "Sin monto"}
                </p>

              )}

              <p><strong>Fecha:</strong> {s.fecha_programada ? new Date(s.fecha_programada).toLocaleDateString() : "Sin fecha"}</p>
              <p><strong>Tipo:</strong> {s.tipo_seguimiento?.descripcion || "No registrado"}</p>
              <p><strong>Resultado:</strong> {s.resultado || "Pendiente"}</p>
              <p><strong>Nota:</strong> {s.nota || "Sin nota"}</p>

              <div className="acciones">
                <button className="btn-ver-seguimientos" onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)}>
                  📜 Ver
                </button>
                {!esSoloLectura && (
                  <button className="btn-mini" onClick={() => abrirModalEditar(p.id_venta, p.objetivo, p.monto_proyectado, p.tipo_servicio)}>✏️</button>
                )}
                {!esSoloLectura && rol === "admin" && !p.abierta && p.estado_venta?.nombre === "No interesado" && (
                  <button className="btn-mini azul" onClick={() => abrirModalReabrir(p.id_venta)}>🔁</button>
                )}


                <p style={{ fontStyle: "italic", marginTop: "10px" }}>
                  <strong>Siguiente fecha programada:</strong>{" "}
                  {siguienteSeguimiento
                    ? formatearFechaVisual(siguienteSeguimiento.fecha_programada)
                    : "No se ha agendado un seguimiento."}
                  {siguienteSeguimiento && (
                    <>
                      {"  —  "}
                      <strong>Motivo:</strong> {siguienteSeguimiento.motivo || "Sin motivo"}
                    </>
                  )}
                </p>

              </div>
            </div>
          );
        })}
      </div>
      {/* 🟩 Modal Editar Objetivo */}
      {modalEditar && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Editar Objetivo</h3>
            <textarea
              value={nuevoObjetivo}
              onChange={(e) => setNuevoObjetivo(e.target.value)}
            />
            <label>Monto Proyectado:</label>
            <input
              type="number"
              value={nuevoMontoProyectado}
              onChange={(e) => setNuevoMontoProyectado(e.target.value)}
              min="0"
              step="0.01"
            />
            <label>Tipo de Servicio</label>
            <Select
              options={tiposServicio}
              value={tipoServicioSeleccionado}
              onChange={setTipoServicioSeleccionado}
              isClearable
              placeholder="Seleccionar tipo"
            />

            <div className="modal-buttons">
              <button onClick={guardarObjetivo}>Guardar</button>
              <button onClick={() => setModalEditar(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}


      {modalReabrir && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Reabrir Venta</h3>
            <label>Fecha del nuevo seguimiento:</label>
            <input
              type="datetime-local"
              value={fechaReapertura}
              onChange={(e) => setFechaReapertura(e.target.value)}
              readOnly
            />
            <label>Nota o motivo:</label>
            <textarea
              value={notaReapertura}
              onChange={(e) => setNotaReapertura(e.target.value)}
            />
            <div className="modal-buttons">
              <button onClick={confirmarReapertura}>Confirmar</button>
              <button onClick={() => setModalReabrir(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {mostrarModalAbrirVenta && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3>Nueva Prospección</h3>
            <label>Objetivo de la Prospección *</label>
            <textarea
              value={nuevoObjetivo}
              onChange={(e) => setNuevoObjetivo(e.target.value)}
              placeholder="Describe el objetivo..."
            />

            <label>Monto Proyectado *</label>
            <input
              type="number"
              value={nuevoMonto}
              onChange={(e) => setNuevoMonto(e.target.value)}
              placeholder="Ej: 5000"
            />

            <label>Tipo de Servicio</label>
            <Select
              options={tiposServicio}
              value={tipoServicioSeleccionado}
              onChange={setTipoServicioSeleccionado}
              isClearable
              placeholder="Seleccionar tipo"
            />


            {errorCrearVenta && <p className="error">{errorCrearVenta}</p>}

            <div className="modal-buttons">
              <button className="btn-confirmar" onClick={handleCrearVenta}>Crear</button>
              <button
                className="btn-cancelar"
                onClick={() => {
                  setMostrarModalAbrirVenta(false);
                  setNuevoObjetivo("");
                  setNuevoMonto("");
                  setTipoServicioSeleccionado(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}



    </div>

  );



};


export default SeguimientosProspecto;
