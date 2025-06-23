import { useState, useEffect, useRef } from "react";
import debounce from "lodash.debounce";
import { useNavigate } from "react-router-dom";
import { obtenerCedulaDesdeToken } from "../utils/auth";
import "../styles/seguimientosProspecto.css";
import React from "react";

const SeguimientosVendedora = () => {
  const navigate = useNavigate();
  const [prospecciones, setProspecciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");

  const [modalEditar, setModalEditar] = useState(false);
  const [idVentaSeleccionada, setIdVentaSeleccionada] = useState(null);
  const [nuevoObjetivo, setNuevoObjetivo] = useState("");

  const [busquedaNombre, setBusquedaNombre] = useState("");
  const [filtrosInicializados, setFiltrosInicializados] = useState(false);

  const [filtroSeguimiento, setFiltroSeguimiento] = useState("todos");

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [limitePorPagina] = useState(10);
  const [busquedaInput, setBusquedaInput] = useState("");


  useEffect(() => {
    const filtrosGuardados = localStorage.getItem("filtros_seguimientos_vendedora");
    if (filtrosGuardados) {
      try {
        const filtros = JSON.parse(filtrosGuardados);
        if (filtros.filtroEstado) setFiltroEstado(filtros.filtroEstado);
        if (filtros.busquedaNombre) {
          setBusquedaNombre(filtros.busquedaNombre);
          setBusquedaInput(filtros.busquedaNombre); // aquí
        }
        if (filtros.filtroSeguimiento) setFiltroSeguimiento(filtros.filtroSeguimiento);

      } catch (e) {
        console.error("Error al leer filtros guardados:", e);
      }
    }
    setFiltrosInicializados(true);
    buscarSeguimientos();
  }, []);

  useEffect(() => {

    if (!filtrosInicializados) return;

    const filtros = {
      filtroEstado,
      busquedaNombre,
      filtroSeguimiento,
    };

    localStorage.setItem("filtros_seguimientos_vendedora", JSON.stringify(filtros));
    buscarSeguimientos(1, busquedaNombre); // Reinicia página al cambiar filtros


  }, [filtroEstado, busquedaNombre, filtroSeguimiento, filtrosInicializados]);

  const capitalizar = (texto) => {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
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

  const buscarSeguimientos = async (pagina = paginaActual, nombre = busquedaNombre) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const cedulaVendedora = obtenerCedulaDesdeToken();

      let url = `${import.meta.env.VITE_API_URL}/api/ventas/prospecciones?cedula_vendedora=${cedulaVendedora}&page=${pagina}&limit=${limitePorPagina}`;
      if (filtroEstado !== "todas") url += `&estado_prospeccion=${filtroEstado}`;
      if (filtroSeguimiento && filtroSeguimiento !== "todos") url += `&seguimiento=${filtroSeguimiento}`; // 🔥 Agregado 🔥
      if (nombre.trim()) url += `&nombre=${encodeURIComponent(nombre.trim())}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Error obteniendo prospecciones");

      const data = await res.json();
      setProspecciones(data.prospecciones);
      setPaginaActual(data.page);
      setTotalPaginas(data.totalPages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      const cedulaVendedora = obtenerCedulaDesdeToken();
      let url = `${import.meta.env.VITE_API_URL}/api/seguimientos/exportar?cedula_vendedora=${cedulaVendedora}`;

      if (filtroEstado !== "todas") url += `&estado_prospeccion=${filtroEstado}`;

      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const contentType = res.headers.get("content-type");

      if (contentType.includes("application/json")) {
        const data = await res.json();
        alert(data.message);
        return;
      }

      if (!res.ok) throw new Error("Error al exportar seguimientos");

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "seguimientos.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al exportar:", error);
    }
  };

  const abrirModalEditar = (id_venta, objetivoActual) => {
    setIdVentaSeleccionada(id_venta);
    setNuevoObjetivo(objetivoActual);
    setModalEditar(true);
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
        body: JSON.stringify({ objetivo: nuevoObjetivo }),
      });

      if (!res.ok) throw new Error("Error actualizando objetivo");
      alert("Objetivo actualizado correctamente");
      setModalEditar(false);
      buscarSeguimientos(); // Recargar
    } catch (err) {
      alert("Error: " + err.message);
    }
  };
  const clasificarSeguimiento = (venta) => {
    const seguimientos = venta.seguimientos || [];
    if (seguimientos.length === 0) return "sin_seguimiento";

    // Buscar primero el pendiente más próximo
    const pendientes = seguimientos
      .filter(s => s.estado === "pendiente")
      .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada));

    if (pendientes.length > 0) {
      const siguientePendiente = pendientes[0];
      const fechaProgramada = new Date(siguientePendiente.fecha_programada);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      fechaProgramada.setHours(0, 0, 0, 0);

      const diffDias = (fechaProgramada - hoy) / (1000 * 60 * 60 * 24);

      if (diffDias < 0) return "vencido";
      if (diffDias === 0) return "hoy";
      if (diffDias <= 7) return "proximo";
      return "futuro";
    }

    // Si no hay pendientes, buscar el último realizado
    const realizados = seguimientos
      .filter(s => s.estado === "realizado")
      .sort((a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada));

    if (realizados.length > 0) {
      return "realizado";
    }

    // Si no hay nada
    return "sin_seguimiento";
  };


  const etiquetaSeguimiento = (venta) => {
    const estado = clasificarSeguimiento(venta);
    const clases = `estado-tag ${estado}`;

    if (estado === "vencido") return <span className={clases}>🔴 Vencido</span>;
    if (estado === "hoy") return <span className={clases}>🟠 Hoy</span>; // 👈 agregado
    if (estado === "proximo") return <span className={clases}>🟡 Próximo</span>;
    if (estado === "futuro") return <span className={clases}>🔵 Futuro</span>;
    if (estado === "realizado") return <span className={clases}>✅ Realizado</span>;
    return <span className={clases}>⚪ Sin seguimiento</span>;
  };

  const prospeccionesFiltradas = prospecciones.filter((p) =>
    p.prospecto?.nombre?.toLowerCase().includes(busquedaNombre.toLowerCase())
  );

  const debouncedBuscar = useRef(
    debounce((valor) => {
      setPaginaActual(1);
      setBusquedaNombre(valor); // esto activa el useEffect y hace fetch
    }, 500)
  ).current;


  useEffect(() => {
    return () => {
      debouncedBuscar.cancel();
    };
  }, []);


  return (
    <div className="seguimientos-container">

      <h1 className="title">SEGUIMIENTO DE PROSPECTOS</h1>
      <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

      <button className="exportar-btn" onClick={exportarExcel}>
        📥 Exportar a Excel
      </button>

      <div className="filtros-container">
        <label>Filtrar nombre de Prospecto:</label>

        <input
          type="text"
          placeholder="Buscar por nombre de prospecto..."
          value={busquedaInput}
          onChange={(e) => {
            const valor = e.target.value;
            setBusquedaInput(valor);           // 🔹 actualiza lo que ves al escribir
            debouncedBuscar(valor);            // 🔸 filtra con retraso
          }}
          className="input-busqueda-nombre"
        />



        <label>Filtrar por estado de prospección:</label>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todas">Todas</option>
          <option value="abiertas">Abiertas</option>
          <option value="cerradas">Cerradas</option>
        </select>
        <label>Filtrar por seguimiento:</label>
        <select
          value={filtroSeguimiento}
          onChange={(e) => setFiltroSeguimiento(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="vencido">Vencidos</option>
          <option value="hoy">Hoy</option>
          <option value="proximo">Próximos</option>
          <option value="futuro">Futuros</option>
          <option value="realizado">Realizados</option>
        </select>



      </div>

      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}
      <div className="seguimientos-table-vendedora-wrapper">
        <div className="paginador-lindo">
          <div className="paginador-contenido">
            {paginaActual > 1 && (
              <button
                className="btn-paginador"
                onClick={() => buscarSeguimientos(paginaActual - 1, busquedaNombre)}
              >
                ⬅ Anterior
              </button>
            )}

            <span className="paginador-info">
              Página {paginaActual} de {totalPaginas}
            </span>

            {paginaActual < totalPaginas && (
              <button
                className="btn-paginador"
                onClick={() => buscarSeguimientos(paginaActual + 1, busquedaNombre)}
              >
                Siguiente ➡
              </button>
            )}
          </div>
        </div>

        <table className="seguimientos-table">
          <thead>
            <tr>
              <th>Prospecto</th>
              <th>Objetivo</th>
              <th>Estado del Prospecto</th>
              <th>Última Fecha</th>
              <th>Último Tipo</th>
              <th>Último Resultado</th>
              <th>Última Nota</th>
              <th>Seguimiento</th>

              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {prospeccionesFiltradas.map((p) => {
              const tieneSeguimientos = p.seguimientos && p.seguimientos.length > 0;
              const ultimoSeguimiento = tieneSeguimientos ? p.seguimientos[0] : null;
              const siguienteSeguimiento = p.seguimientos
                ?.filter((s) => s.estado === "pendiente")
                .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];

              return (
                <React.Fragment key={p.id_venta}>


                  <tr key={p.id_venta}>
                    <td>{p.prospecto?.nombre ? p.prospecto.nombre.toUpperCase() : "SIN PROSPECTO"}</td>
<td>{p.objetivo ? capitalizar(p.objetivo.toUpperCase()) : "SIN OBJETIVO"}</td>
                    <td>
                      {p.estado_venta?.nombre === "Cierre"
                        ? `Cierre ($${p.monto_cierre?.toFixed(2) || "0.00"})`
                        : capitalizar(p.estado_venta?.nombre) || "NO DEFINIDO"}
                    </td>

                    <td>{ultimoSeguimiento?.fecha_programada ? new Date(ultimoSeguimiento.fecha_programada).toLocaleDateString() : "No hay"}</td>
<td>{ultimoSeguimiento?.tipo_seguimiento?.descripcion
  ? ultimoSeguimiento.tipo_seguimiento.descripcion.toUpperCase()
  : "NO REGISTRADO"}</td>
                    <td>{ultimoSeguimiento?.resultado || "PENDIENTE"}</td>
<td>{ultimoSeguimiento?.nota
  ? ultimoSeguimiento.nota.toUpperCase()
  : "SIN NOTA"}</td>                    <td>{etiquetaSeguimiento(p)}</td>

                    <td>
                      {!tieneSeguimientos ? (
                        <button
                          className="btn-agendar"
                          onClick={() => navigate(`/agendar-seguimiento/${p.id_venta}`)}
                        >
                          📅 Agendar Primer Seguimiento
                        </button>
                      ) : (
                        <button
                          className="btn-ver-seguimientos"
                          onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)}
                        >
                          📜 Ver Seguimientos
                        </button>
                      )}

                      <button className="btn-mini" onClick={() => abrirModalEditar(p.id_venta, p.objetivo)}>✏️</button>

                    </td>
                  </tr>

                  {/* Nueva fila con la siguiente fecha y motivo */}
                  <tr className="fila-info-extra">
                    <td colSpan="7" style={{ fontStyle: "italic", color: "#555", backgroundColor: "#c9edec" }}>
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
                    </td>
                  </tr>
                </React.Fragment>

              );
            })}
          </tbody>
        </table>
      </div>
      <div className="tarjetas-seguimientos-vendedora">
        {prospeccionesFiltradas.map((p) => {
          const tieneSeguimientos = p.seguimientos?.length > 0;
          const ultimoSeguimiento = tieneSeguimientos ? p.seguimientos[0] : null;
          const siguienteSeguimiento = p.seguimientos
            ?.filter((s) => s.estado === "pendiente")
            .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];

          return (
            <div key={p.id_venta} className="card-seguimiento">
              <h3>{p.prospecto?.nombre || "Sin Prospecto"}</h3>
              <p><strong>Objetivo:</strong> {p.objetivo || "Sin objetivo"}</p>
              <p><strong>Estado del Prospecto:</strong> {p.estado_venta?.nombre === "Cierre"
                ? `Cierre ($${p.monto_cierre?.toFixed(2) || "0.00"})`
                : capitalizar(p.estado_venta?.nombre) || "No definido"}
              </p>

              <p><strong>Última Fecha:</strong> {ultimoSeguimiento?.fecha_programada ? new Date(ultimoSeguimiento.fecha_programada).toLocaleDateString() : "No hay"}</p>
              <p><strong>Último Tipo:</strong> {ultimoSeguimiento?.tipo_seguimiento?.descripcion || "No registrado"}</p>
              <p><strong>Último Resultado:</strong> {ultimoSeguimiento?.resultado || "Pendiente"}</p>
              <p><strong>Última Nota:</strong> {ultimoSeguimiento?.nota || "Sin nota"}</p>
              <p><strong>Seguimiento:</strong> {etiquetaSeguimiento(p)}</p>

              <div className="acciones">
                {!tieneSeguimientos ? (
                  <button className="btn-agendar" onClick={() => navigate(`/agendar-seguimiento/${p.id_venta}`)}>📅 Agendar Primer Seguimiento</button>
                ) : (
                  <button className="btn-ver-seguimientos" onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)}>📜 Ver Seguimientos</button>
                )}

                <button className="btn-mini" onClick={() => abrirModalEditar(p.id_venta, p.objetivo)}>✏️</button>
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
            <div className="modal-buttons">
              <button onClick={guardarObjetivo}>Guardar</button>
              <button onClick={() => setModalEditar(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SeguimientosVendedora;
