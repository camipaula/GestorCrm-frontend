import { useState, useEffect, useRef } from "react";
import debounce from "lodash.debounce";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import "../styles/seguimientosAdmin.css";
import React from "react";
import { getRol } from "../utils/auth";

const SeguimientosAdmin = () => {
  const navigate = useNavigate();
  const [vendedoras, setVendedoras] = useState([]);
  const [vendedoraSeleccionada, setVendedoraSeleccionada] = useState(null);
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
  const [limitePorPagina] = useState(10); // puedes cambiar el valor
  const [modalReabrir, setModalReabrir] = useState(false);
  const [notaReapertura, setNotaReapertura] = useState("");
  const [fechaReapertura, setFechaReapertura] = useState("");


  const rol = getRol();
  const esSoloLectura = rol === "lectura";


  useEffect(() => {
    const filtrosGuardados = localStorage.getItem("filtros_seguimientos_admin");
    let filtros = { filtroEstado: "todas", vendedoraSeleccionada: null };

    if (filtrosGuardados) {
      try {
        filtros = JSON.parse(filtrosGuardados);
        setFiltroEstado(filtros.filtroEstado || "todas");
        if (filtros.busquedaNombre) setBusquedaNombre(filtros.busquedaNombre);
        setFiltrosInicializados(true);


      } catch (e) {
        console.error("Error al leer filtros guardados", e);
      }
    }
    obtenerVendedoras().then((opciones) => {
      setVendedoras(opciones);
      if (filtros.vendedoraSeleccionada) {
        const seleccion = opciones.find(
          (v) => v.value === filtros.vendedoraSeleccionada.value
        );
        if (seleccion) {
          setVendedoraSeleccionada(seleccion);
          buscarSeguimientos(seleccion.value, filtros.filtroEstado || "todas", 1, filtros.filtroSeguimiento || "todos");
          return;
        }
      }
      buscarSeguimientos("", filtros.filtroEstado || "todas", 1, filtros.filtroSeguimiento || "todos");
    });
    if (filtros.filtroSeguimiento) setFiltroSeguimiento(filtros.filtroSeguimiento);
  }, []);

  useEffect(() => {
    if (!filtrosInicializados) return;

    const filtrosActualizados = {
      vendedoraSeleccionada,
      filtroEstado,
      busquedaNombre,
      filtroSeguimiento,
    };
    localStorage.setItem("filtros_seguimientos_admin", JSON.stringify(filtrosActualizados));
  }, [vendedoraSeleccionada, filtroEstado, busquedaNombre, filtrosInicializados]);

  const abrirModalReabrir = (id_venta) => {
    setIdVentaSeleccionada(id_venta);
    setNotaReapertura("");
    // Establecer fecha actual a las 08:00 AM en formato 'yyyy-MM-ddTHH:mm'
    const ahora = new Date();
    ahora.setHours(8, 0, 0, 0); // 08:00 AM
    const isoFecha = ahora.toISOString().slice(0, 16); // formato compatible con <input type="datetime-local">
    setFechaReapertura(isoFecha);
    setModalReabrir(true);
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
      buscarSeguimientos(vendedoraSeleccionada?.value || "");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };


  const capitalizar = (texto) => {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  };


  const obtenerVendedoras = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error obteniendo vendedoras");
      const data = await res.json();
      const opciones = [
        { value: "", label: "Todas las vendedoras" },
        ...data.map(v => ({ value: v.cedula_ruc, label: v.nombre }))
      ];
      setVendedoras(opciones);
      return opciones; // AQUÍ DEVUELVES LAS OPCIONES
    } catch (err) {
      setError(err.message);
      return []; // importante retornar algo aunque haya error
    }
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

  const buscarSeguimientos = async (
    cedula_ruc = "",
    estado = filtroEstado,
    pagina = 1,
    seguimientoFiltro = filtroSeguimiento,
    nombre = busquedaNombre
  ) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");

      let url = `${import.meta.env.VITE_API_URL}/api/ventas/prospecciones?page=${pagina}&limit=${limitePorPagina}`;
      if (cedula_ruc) url += `&cedula_vendedora=${cedula_ruc}`;
      if (estado !== "todas") url += `&estado_prospeccion=${estado}`;
      if (seguimientoFiltro && seguimientoFiltro !== "todos") url += `&seguimiento=${seguimientoFiltro}`;
      if (nombre.trim()) url += `&nombre=${encodeURIComponent(nombre.trim())}`; // SOLO ESTA

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

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



  const handleVendedoraChange = (selectedOption) => {
    setVendedoraSeleccionada(selectedOption);
    const filtrosActualizados = {
      vendedoraSeleccionada: selectedOption,
      filtroEstado,
    };
    localStorage.setItem("filtros_seguimientos_admin", JSON.stringify(filtrosActualizados));
    buscarSeguimientos(selectedOption?.value || "", filtroEstado, 1, filtroSeguimiento);
  };


  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      let url = `${import.meta.env.VITE_API_URL}/api/seguimientos/exportar?`;

      if (vendedoraSeleccionada && vendedoraSeleccionada.value) url += `cedula_vendedora=${vendedoraSeleccionada.value}&`;
      if (filtroEstado !== "todas") url += `estado_prospeccion=${filtroEstado}&`;

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
      buscarSeguimientos(vendedoraSeleccionada?.value || "");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };


  const clasificarSeguimiento = (venta) => {
    const seguimientos = venta.seguimientos || [];
    if (seguimientos.length === 0) return "sin_seguimiento";

    //  Buscar el siguiente seguimiento pendiente más próximo
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

      if (diffDias < 0) return "vencido"; // vencido
      if (diffDias === 0) return "hoy";   // hoy
      if (diffDias <= 7) return "proximo"; // próximos 7 días
      return "futuro"; // más adelante
    }

    //  Si no hay pendientes, buscar el último realizado
    const realizados = seguimientos
      .filter(s => s.estado === "realizado")
      .sort((a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada));

    if (realizados.length > 0) {
      return "realizado"; // fue realizado
    }

    // Si no hay nada, es sin seguimiento
    return "sin_seguimiento";
  };

  const etiquetaSeguimiento = (venta) => {
    const clasificacion = clasificarSeguimiento(venta);

    switch (clasificacion) {
      case "vencido":
        return "🔴 Vencido";
      case "hoy":
        return "🟠 Hoy";
      case "proximo":
        return "🟡 Próximo";
      case "futuro":
        return "🟢 Futuro";
      case "realizado":
        return "✅ Realizado";
      case "sin_seguimiento":
      default:
        return "⚪ Sin seguimiento";
    }
  };



  const debouncedBuscar = useRef(
    debounce((nuevoNombre, filtrosActuales) => {
      setPaginaActual(1);
      buscarSeguimientos(
        filtrosActuales.vendedora,
        filtrosActuales.estado,
        1,
        filtrosActuales.seguimiento,
        nuevoNombre
      );
    }, 500)
  ).current;


  useEffect(() => {
    return () => {
      debouncedBuscar.cancel();
    };
  }, []);



  const limpiarFiltros = () => {
    setVendedoraSeleccionada(null);
    setFiltroEstado("todas");
    setFiltroSeguimiento("todos");
    setBusquedaNombre("");
    localStorage.removeItem("filtros_seguimientos_admin");
    buscarSeguimientos("", "todas");
  };

  return (
    <div className="seguimientos-container">
      <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

      <h1 className="title">SEGUIMIENTOS DE PROSPECCIONES</h1>

      <button className="exportar-btn" onClick={exportarExcel}>
        📥 Exportar a Excel
      </button>

      <div className="filtros-container">


        <Select
          options={vendedoras}
          placeholder="Seleccionar Vendedora"
          onChange={handleVendedoraChange}
          isClearable
          value={vendedoraSeleccionada}
        />
        <input
          type="text"
          placeholder="Buscar por nombre de prospecto..."
          value={busquedaNombre}
          onChange={(e) => {
            const nuevoValor = e.target.value;
            setBusquedaNombre(nuevoValor);

            const filtrosActuales = {
              vendedora: vendedoraSeleccionada?.value || "",
              estado: filtroEstado,
              seguimiento: filtroSeguimiento,
            };

            debouncedBuscar(nuevoValor, filtrosActuales);
          }}


          className="input-busqueda-nombre"
        />



        <label>Filtrar por estado de prospección:</label>
        <select
          value={filtroEstado}
          onChange={(e) => {
            const nuevoEstado = e.target.value;
            setFiltroEstado(nuevoEstado);
            const filtrosActualizados = {
              vendedoraSeleccionada,
              filtroEstado: nuevoEstado,
            };
            localStorage.setItem("filtros_seguimientos_admin", JSON.stringify(filtrosActualizados));
            buscarSeguimientos(vendedoraSeleccionada?.value || "", nuevoEstado);
          }}

        >
          <option value="todas">Todas</option>
          <option value="abiertas">Abiertas</option>
          <option value="cerradas">Cerradas</option>
        </select>

        <label>Filtrar por seguimiento:</label>
        <select
          value={filtroSeguimiento}
          onChange={(e) => {
            const nuevoSeguimiento = e.target.value;
            setFiltroSeguimiento(nuevoSeguimiento);

            const filtrosActualizados = {
              vendedoraSeleccionada,
              filtroEstado,
              busquedaNombre,
              filtroSeguimiento: nuevoSeguimiento,
            };
            localStorage.setItem("filtros_seguimientos_admin", JSON.stringify(filtrosActualizados));

            buscarSeguimientos(vendedoraSeleccionada?.value || "", filtroEstado, 1, nuevoSeguimiento);
          }}
        >

          <option value="todos">Todos</option>
          <option value="sin_seguimiento">Sin seguimiento</option>
          <option value="hoy">Hoy</option>
          <option value="vencido">Vencidos</option>
          <option value="proximo">Próximos</option>
          <option value="futuro">Futuros</option>
          <option value="realizado">Realizados</option>
        </select>



        <button className="btn-limpiar-filtros" onClick={limpiarFiltros}>
          Limpiar Filtros
        </button>


      </div>

      {loading && <p>Cargando...</p>}
      {error && <p className="error">{error}</p>}


      <div className="tabla-scroll-wrapper">
        <div className="paginador-lindo">
          <div className="paginador-contenido">
            {paginaActual > 1 && (
              <button
                className="btn-paginador"
                onClick={() =>
                  buscarSeguimientos(vendedoraSeleccionada?.value || "", filtroEstado, paginaActual - 1, filtroSeguimiento)
                }
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
                onClick={() =>
                  buscarSeguimientos(vendedoraSeleccionada?.value || "", filtroEstado, paginaActual + 1, filtroSeguimiento)
                }
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
              <th>Vendedora</th>

              <th>Objetivo</th>
              <th>Estado del Prospecto</th>
              <th>Última Fecha</th>
              <th>Último Tipo</th>
              <th>Último Resultado</th>
              <th>Última Nota</th>
              <th>Acción</th>
              <th>Estado Último Seguimiento</th>

            </tr>
          </thead>
          <tbody>
            {!loading && prospecciones.length === 0 && (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: "20px", fontWeight: "bold" }}>
                  No hay seguimientos para mostrar.
                </td>
              </tr>
            )}

            {prospecciones.map((p) => {

              const tieneSeguimientos = p.seguimientos && p.seguimientos.length > 0;
              const ultimoSeguimiento = tieneSeguimientos ? p.seguimientos[0] : null;
              const siguienteSeguimiento = p.seguimientos
                ?.filter((s) => s.estado === "pendiente")
                .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];

              return (
                <React.Fragment key={p.id_venta}>

                  <tr key={p.id_venta}>
                    <td>{p.prospecto?.nombre ? p.prospecto.nombre.toUpperCase() : "SIN PROSPECTO"}</td>
                    <td>
                      {p.prospecto?.vendedora_prospecto
                        ? `${p.prospecto?.vendedora_prospecto?.nombre
                          ? p.prospecto.vendedora_prospecto.nombre.toUpperCase()
                          : "Sin asignar"
                        }${p.prospecto.vendedora_prospecto.estado === 0 ? " (INACTIVA)" : ""}`
                        : "Sin asignar"}
                    </td>

                    <td>{p.objetivo ? capitalizar(p.objetivo.toUpperCase()) : "SIN OBJETIVO"}</td>
                    <td>
                      {p.estado_venta?.nombre === "Cierre"
                        ? `Cierre ($${p.monto_cierre?.toFixed(2) || "0.00"})`
                        : capitalizar(p.estado_venta?.nombre) || "No definido"}
                    </td>

                    <td>{ultimoSeguimiento?.fecha_programada ? new Date(ultimoSeguimiento.fecha_programada).toLocaleDateString() : "No hay"}</td>
                    <td>{ultimoSeguimiento?.tipo_seguimiento?.descripcion
                      ? ultimoSeguimiento.tipo_seguimiento.descripcion.toUpperCase()
                      : "NO REGISTRADO"}</td>
                    <td>{ultimoSeguimiento?.resultado || "PENDIENTE"}</td>
                    <td>{ultimoSeguimiento?.nota || "SIN NOTA"}</td>
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
                          📜 VER SEGUIMIENTOS
                        </button>
                      )}

                      {/* Botón pequeño Editar */}
                      {!esSoloLectura && (
                        <button className="btn-mini" onClick={() => abrirModalEditar(p.id_venta, p.objetivo)}>✏️</button>)}
                      {!esSoloLectura && !p.abierta && p.estado_venta?.nombre === "Competencia" && (
                        <button className="btn-mini red" onClick={() => abrirModalReabrir(p.id_venta)}>REABRIR</button>
                      )}


                    </td>
                    <td>{etiquetaSeguimiento(p)}</td>

                  </tr>
                  {/* 🔽 Nueva fila con la siguiente fecha y motivo */}
                  <tr className="fila-info-extra">
                    <td colSpan="9" style={{ fontStyle: "italic", color: "#555", backgroundColor: "#c9edec" }}>
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


      {/* Vista en móviles - tarjetas compactas */}
      <div className="seguimientos-cards">
        {prospecciones.map((p) => {

          const tieneSeguimientos = p.seguimientos && p.seguimientos.length > 0;
          const ultimo = tieneSeguimientos ? p.seguimientos[0] : null;
          const siguienteSeguimiento = p.seguimientos
            ?.filter((s) => s.estado === "pendiente")
            .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];

          return (
            <div className="seguimiento-card" key={p.id_venta}>
              <h3>{p.prospecto?.nombre || "Sin Prospecto"}</h3>
              <p><strong>Vendedora:</strong>{" "}
                {p.prospecto?.vendedora_prospecto
                  ? `${p.prospecto.vendedora_prospecto.nombre}${p.prospecto.vendedora_prospecto.estado === 0 ? " (INACTIVA)" : ""}`
                  : "Sin asignar"}
              </p>

              <p><strong>Objetivo:</strong> {p.objetivo || "No definido"}</p>
              <p><strong>Estado del Prospecto:</strong> {capitalizar(p.estado_venta?.nombre) || "No definido"}</p>

              <p><strong>Última Fecha:</strong> {ultimo?.fecha_programada ? new Date(ultimo.fecha_programada).toLocaleDateString() : "No hay"}</p>
              <p><strong>Tipo:</strong> {ultimo?.tipo_seguimiento?.descripcion || "No registrado"}</p>
              <p><strong>Resultado:</strong> {ultimo?.resultado || "Pendiente"}</p>
              <p><strong>Nota:</strong> {ultimo?.nota || "Sin nota"}</p>
              <p><strong>Estado Último Seguimiento:</strong> {etiquetaSeguimiento(p)}</p>

              <div className="acciones">
                {!tieneSeguimientos ? (
                  <button className="btn-agendar" onClick={() => navigate(`/agendar-seguimiento/${p.id_venta}`)}>
                    📅 Agendar
                  </button>
                ) : (
                  <button className="btn-ver-seguimientos" onClick={() => navigate(`/seguimientos-prospeccion/${p.id_venta}`)}>
                    📜 Ver
                  </button>
                )}
                {/* 👉 Botón pequeño para editar */}
                <button
                  className="btn-mini"
                  onClick={() => abrirModalEditar(p.id_venta, p.objetivo)}
                >
                  ✏️
                </button>


                {!esSoloLectura && !p.abierta && p.estado_venta?.nombre === "Competencia" && (
                  <button className="btn-mini red" onClick={() => abrirModalReabrir(p.id_venta)}>Reabrir</button>
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
        {!loading && prospecciones.length === 0 && (
          <p style={{ textAlign: "center", fontWeight: "bold" }}>
            No hay seguimientos para mostrar.
          </p>
        )}

      </div>
      {/* 🟩 Modal para editar objetivo */}
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

      {/* 🟥 Modal para confirmar eliminación */}

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

    </div>
  );

};

export default SeguimientosAdmin;
