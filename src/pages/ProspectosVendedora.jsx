import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { obtenerCedulaDesdeToken } from "../utils/auth";
import { debounce } from "lodash";

import "../styles/prospectosVendedora3.css";

const ProspectosVendedora = () => {
  const navigate = useNavigate();
  const [cedulaVendedora, setCedulaVendedora] = useState(null);
  const [prospectos, setProspectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtros y búsqueda
  const [busquedaNombre, setBusquedaNombre] = useState("");
  const [busquedaInput, setBusquedaInput] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [fechaInicioDefecto, setFechaInicioDefecto] = useState("");
  const [fechaFinDefecto, setFechaFinDefecto] = useState("");

  const [estados, setEstados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  const [ciudadFiltro, setCiudadFiltro] = useState(null);
  const [provinciaFiltro, setProvinciaFiltro] = useState(null);

  const [filtrosInicializados, setFiltrosInicializados] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  const [orden, setOrden] = useState("");

  //modal venta
  const [mostrarModalAbrirVenta, setMostrarModalAbrirVenta] = useState(false);
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState(null);
  const [nuevoObjetivo, setNuevoObjetivo] = useState("");
  const [nuevoMonto, setNuevoMonto] = useState("");
  const [tiposServicio, setTiposServicio] = useState([]);
  const [tipoServicioSeleccionado, setTipoServicioSeleccionado] = useState(null);
  const [errorCrearVenta, setErrorCrearVenta] = useState("");



  const debouncedBuscar = useRef(
    debounce((valor) => {
      setPaginaActual(1); // siempre resetear a página 1 cuando busque
      setBusquedaNombre(valor);
    }, 500)
  ).current;




  useEffect(() => {
    const cedula = obtenerCedulaDesdeToken();
    setCedulaVendedora(cedula);
    establecerFechasUltimos3Meses();

    const filtrosGuardados = localStorage.getItem("filtros_prospectos_vendedora");
    const filtrosParsed = filtrosGuardados ? JSON.parse(filtrosGuardados) : null;

    // Cargar opciones (ciudades, provincias, etc.)
    const cargarFiltros = async () => {
      await Promise.all([
        obtenerEstados(),
        obtenerCategorias(),
        obtenerCiudades(),
        obtenerProvincias()
      ]);

      // Solo después de que se cargan las opciones
      if (filtrosParsed) {
        if (filtrosParsed.estadoFiltro) setEstadoFiltro(filtrosParsed.estadoFiltro);
        if (filtrosParsed.fechaInicio) setFechaInicio(filtrosParsed.fechaInicio);
        if (filtrosParsed.fechaFin) setFechaFin(filtrosParsed.fechaFin);
        if (filtrosParsed.busquedaNombre) setBusquedaNombre(filtrosParsed.busquedaNombre);
        if (filtrosParsed.ciudadFiltro) setCiudadFiltro(filtrosParsed.ciudadFiltro);
        if (filtrosParsed.provinciaFiltro) setProvinciaFiltro(filtrosParsed.provinciaFiltro);
        if (filtrosParsed.categoriaFiltro) setCategoriaFiltro(filtrosParsed.categoriaFiltro);
        if (filtrosParsed.orden) setOrden(filtrosParsed.orden);

      }

      setFiltrosInicializados(true);
    };

    cargarFiltros();
  }, []);


  useEffect(() => {
    if (!filtrosInicializados) return;

    const filtros = {
      estadoFiltro,
      fechaInicio,
      fechaFin,
      busquedaNombre,
      ciudadFiltro,
      provinciaFiltro,
      categoriaFiltro,
      orden
    };

    localStorage.setItem("filtros_prospectos_vendedora", JSON.stringify(filtros));
  }, [
    estadoFiltro,
    fechaInicio,
    fechaFin,
    busquedaNombre,
    ciudadFiltro,
    provinciaFiltro,
    categoriaFiltro,
    orden,
    filtrosInicializados
  ]);

  useEffect(() => {
    const obtenerTiposServicio = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tipos-servicio`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setTiposServicio(data.map((t) => ({ value: t.id_tipo_servicio, label: t.nombre })));
      } catch (err) {
        console.error("Error al cargar tipos de servicio:", err);
      }
    };

    obtenerTiposServicio();
  }, []);


  const obtenerCategorias = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias`);
      if (!res.ok) throw new Error("Error cargando categorías");
      const data = await res.json();
      setCategorias(data.map((c) => ({ value: c.id_categoria, label: c.nombre })));
    } catch (err) {
      console.error(err);
    }
  };

  const obtenerCiudades = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/ciudades`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCiudades(data.map((c) => ({ value: c, label: c })));
    } catch (err) {
      console.error(err);
    }
  };

  const obtenerProvincias = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/provincias`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProvincias(data.map((p) => ({ value: p, label: p })));
    } catch (err) {
      console.error(err);
    }
  };


  const obtenerEstados = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/estados`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("La respuesta no es una lista de estados");
      }

      const opciones = data.map((e) => ({
        value: e.id_estado,
        label: e.nombre.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      }));
      setEstados(opciones);
    } catch (err) {
      console.error("Error cargando estados:", err);
      setError("No se pudieron cargar los estados");
    }
  };


  const establecerFechasUltimos3Meses = () => {
    const hoy = new Date();
    const fin = hoy.toISOString().split("T")[0];

    const inicio = new Date();
    inicio.setMonth(inicio.getMonth() - 3);
    const inicioFormateado = inicio.toISOString().split("T")[0];

    setFechaInicio(inicioFormateado);
    setFechaFin(fin);

    setFechaInicioDefecto(inicioFormateado);
    setFechaFinDefecto(fin);
  };

  const handleCrearVenta = async () => {
    if (!nuevoObjetivo.trim()) {
      setErrorCrearVenta("El objetivo es obligatorio.");
      return;
    }

    const montoValido = nuevoMonto === "" ? null : Number(nuevoMonto);
    if (montoValido !== null && (isNaN(montoValido) || montoValido < 0)) {
      setErrorCrearVenta("El monto proyectado debe ser un número válido o dejarlo vacío.");
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
          id_prospecto: prospectoSeleccionado.id_prospecto,
          objetivo: nuevoObjetivo,
          monto_proyectado: nuevoMonto === "" ? null : Number(nuevoMonto),
          id_tipo_servicio: tipoServicioSeleccionado?.value || null
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMostrarModalAbrirVenta(false);
      setNuevoObjetivo("");
      setNuevoMonto("");
      setTipoServicioSeleccionado(null);
      buscarProspectos(); // recarga lista

      navigate(`/seguimientos-prospecto/${prospectoSeleccionado.id_prospecto}`);
    } catch (err) {
      setErrorCrearVenta(err.message || "Error al crear prospección");
    }
  };


  useEffect(() => {
    if (
      !filtrosInicializados ||
      !cedulaVendedora ||
      !fechaInicio ||
      !fechaFin
    ) return;

    buscarProspectos();
  }, [
    filtrosInicializados,
    cedulaVendedora,
    estadoFiltro,
    fechaInicio,
    fechaFin,
    categoriaFiltro,
    ciudadFiltro,
    provinciaFiltro,
    busquedaNombre,
    paginaActual,
    orden
  ]);



  const buscarProspectos = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", paginaActual);
      params.append("limit", 10);
      params.append("cedula_vendedora", cedulaVendedora);

      if (estadoFiltro.length > 0) {
        estadoFiltro.forEach((estado) => params.append("estado", estado.value));
      }
      if (fechaInicio) params.append("fechaInicio", fechaInicio);
      if (fechaFin) params.append("fechaFin", fechaFin);
      if (categoriaFiltro) params.append("id_categoria", categoriaFiltro.value);
      if (ciudadFiltro) params.append("ciudad", ciudadFiltro);
      if (provinciaFiltro) params.append("provincia", provinciaFiltro);
      if (orden) params.append("orden", orden);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Error obteniendo prospectos");
      const data = await res.json();

      setProspectos(data.prospectos || []);
      setTotalPaginas(data.totalPages || 1);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const hayFiltrosActivos = () => {
    return (
      estadoFiltro.length > 0 ||
      categoriaFiltro ||
      ciudadFiltro ||
      provinciaFiltro ||
      busquedaNombre.trim() !== "" ||
      orden ||
      fechaInicio !== fechaInicioDefecto ||
      fechaFin !== fechaFinDefecto
    );
  };


  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem("token");

      let url = `${import.meta.env.VITE_API_URL}/api/prospectos/exportar?cedula_vendedora=${cedulaVendedora}`;

      if (estadoFiltro.length > 0) {
        estadoFiltro.forEach((estado) => {
          url += `&estado=${estado.value}`;
        });
      }
      if (categoriaFiltro) url += `&id_categoria=${categoriaFiltro.value}`;
      if (fechaInicio) url += `&fechaInicio=${fechaInicio}`;
      if (fechaFin) url += `&fechaFin=${fechaFin}`;
      if (ciudadFiltro) url += `&ciudad=${encodeURIComponent(ciudadFiltro)}`;
      if (provinciaFiltro) url += `&provincia=${encodeURIComponent(provinciaFiltro)}`;
      if (orden) url += `&orden=${orden}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const contentType = res.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        alert(data.message);
        return;
      }

      if (!res.ok) throw new Error("Error al exportar prospectos");

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "mis_prospectos.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al exportar:", error);
    }
  };

  const prospectosFiltrados = prospectos; // usa el array directo



  const limpiarFiltros = () => {
    setEstadoFiltro([]);
    setCategoriaFiltro(null);
    setCiudadFiltro(null);
    setProvinciaFiltro(null);
    establecerFechasUltimos3Meses();
    setPaginaActual(1);
    setBusquedaNombre("");
    setBusquedaInput("");
    localStorage.removeItem("filtros_prospectos_vendedora");

  };

  useEffect(() => {
    return () => {
      debouncedBuscar.cancel();
    };
  }, []);

  const estadoCierre = estados.find(e => e.label.toLowerCase() === "cierre");

  const mostrarEstado = (venta) => {
    if (!venta) return "Sin estado";
    if (venta.id_estado === estadoCierre?.value && venta.monto_cierre) {
      return `Ganado ($${parseFloat(venta.monto_cierre).toFixed(2)})`;
    }
    return estados.find(e => e.value === venta.id_estado)?.label || "Sin estado";
  };


  return (
    <div className="vendedora-prospectos-page">
      <h1 className="vendedora-prospectos-title">PROSPECTOS</h1>
      <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

      <button
        className={`btn-toggle-filtros ${hayFiltrosActivos() ? "filtros-activos" : ""}`}
        onClick={() => setMostrarFiltros((prev) => !prev)}
      >
        {mostrarFiltros ? "🔼 OCULTAR FILTROS" : "🔽 MOSTRAR FILTROS"}
        {hayFiltrosActivos() && <span style={{ marginLeft: "8px", color: "#e74c3c" }}>●</span>}
      </button>





      {mostrarFiltros && (

        <div className="admin-prospectos-filtros">
          <div className="filtro-grupo">
            <label>Estado(s)</label>
            <Select
              options={estados}
              isMulti
              placeholder="Seleccionar Estado(s)"
              className="select-estado"
              value={estadoFiltro}
              onChange={(ops) => {
                setEstadoFiltro(ops);
                setPaginaActual(1);
                buscarProspectos();
              }}
            />

          </div>

          <div className="filtro-grupo">
            <label>Categoría</label>
            <Select
              options={categorias}
              placeholder="Seleccionar Categoría"
              className="select-categoria"
              value={categoriaFiltro}
              onChange={(op) => {
                setCategoriaFiltro(op);
                setPaginaActual(1);
                buscarProspectos();
              }}
              isClearable
            />

          </div>


          <div className="filtro-grupo">
            <label>Ciudad</label>
            <Select
              options={ciudades}
              placeholder="Seleccionar Ciudad"
              className="select-ciudad"
              value={ciudades.find((c) => c.value === ciudadFiltro) || null}
              onChange={(op) => {
                setCiudadFiltro(op ? op.value : null);
                setPaginaActual(1);
                buscarProspectos();
              }}
              isClearable
            />

          </div>


          <div className="filtro-grupo">
            <label>Provincia</label>
            <Select
              options={provincias}
              placeholder="Seleccionar Provincia"
              className="select-provincia"
              value={provincias.find((p) => p.value === provinciaFiltro)}
              onChange={(op) => {
                setProvinciaFiltro(op ? op.value : null);
                setPaginaActual(1);
                buscarProspectos();
              }}
              isClearable
            />

          </div>



          <div className="filtro-grupo">
            <label>Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>

          <div className="filtro-grupo">
            <label>Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>

          <button onClick={limpiarFiltros} disabled={loading}>
            🧹 Limpiar Filtros
          </button>


        </div>
      )}

      <div className="botones-acciones">

        <button className="vendedora-btn-nuevo-prospecto" onClick={() => navigate("/crear-prospecto")}>
          ➕ CREAR PROSPECTO
        </button>


        <button onClick={exportarExcel} className="vendedora-btn-exportar">
          📥 Exportar Excel
        </button>

      </div>

      <div className="filtro-grupo-nombre">
        <label>Nombre del Prospecto</label>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={busquedaInput}
          onChange={(e) => {
            setBusquedaInput(e.target.value);
            debouncedBuscar(e.target.value);
          }}
          className="input-busqueda-nombre"
        />

        <div className="filtro-grupo">
          <label>Ordenar por:</label>
          <select value={orden} onChange={(e) => setOrden(e.target.value)}>
            <option value="">Fecha de creación</option>
            <option value="proximo_contacto">Próximo contacto</option>
          </select>
        </div>
      </div>


      <button onClick={buscarProspectos} disabled={loading}>
        {loading ? "Cargando..." : "Buscar"}
      </button>


      {loading && <p>Cargando prospectos...</p>}
      {error && <p className="error">{error}</p>}

      <div className="paginador-lindo">
        <div className="paginador-contenido">
          {paginaActual > 1 && (
            <button className="btn-paginador" onClick={() => setPaginaActual((p) => p - 1)}>
              ⬅ Anterior
            </button>
          )}
          <span className="paginador-info">
            Página {paginaActual} de {totalPaginas}
          </span>
          {paginaActual < totalPaginas && (
            <button className="btn-paginador" onClick={() => setPaginaActual((p) => p + 1)}>
              Siguiente ➡
            </button>
          )}
        </div>
      </div>


      <div className="vendedora-prospectos-table-wrapper">

        <table className="vendedora-prospectos-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre del Cliente</th>
              <th>Empresa</th>
              <th>Correo Electrónico</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Fecha de Primer Contacto</th>
              <th>Último Seguimiento</th>
              <th>Motivo Próxima Acción</th>
              <th>Fecha Próxima Acción</th>
              <th>Última Nota</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {prospectosFiltrados.length > 0 ? (
              prospectosFiltrados.flatMap((p, index) =>
                p.ventas.length > 0
                  ? p.ventas.map((venta) => {
                    const seguimientosOrdenados = [...(venta.seguimientos || [])].sort(
                      (a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada)
                    );

                    const seguimientoPendiente = venta.seguimientos
                      ?.filter((s) => s.estado === "pendiente")
                      ?.sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0];

                    const ultimoSeguimiento = seguimientosOrdenados[0];

                    return (
                      <tr key={`${p.id_prospecto}-${venta.id_venta}`}>
                        <td>{index + 1}</td>
                        <td>{p.nombre_contacto || "No registrado"}</td>
                        <td>{p.nombre}</td>
                        <td>{p.correo || "No registrado"}</td>
                        <td>{p.telefono || "No registrado"}</td>
                        <td>{mostrarEstado(venta)}</td>
                        <td>{new Date(p.created_at).toLocaleDateString("es-EC")}</td>
                        <td>
                          {ultimoSeguimiento?.fecha_programada
                            ? new Date(ultimoSeguimiento.fecha_programada).toLocaleDateString("es-EC")
                            : "-"}
                        </td>
                        <td>{seguimientoPendiente?.motivo || "-"}</td>
                        <td>
                          {seguimientoPendiente?.fecha_programada
                            ? new Date(seguimientoPendiente.fecha_programada).toLocaleDateString("es-EC")
                            : "-"}
                        </td>
                        <td>{ultimoSeguimiento?.nota || "-"}</td>
                        <td>
                          <button className="vendedora-btn-seguimientos" onClick={() => navigate(`/seguimientos-prospecto/${p.id_prospecto}`)}>
                            🔍 Ver Seguimientos
                          </button>
                          <button className="vendedora-btn-editar" onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)}>
                            Ver Información
                          </button>
                        </td>
                      </tr>
                    );
                  })
                  : [
                    <tr key={`solo-${p.id_prospecto}`}>
                      <td>{index + 1}</td>
                      <td>{p.nombre_contacto || "No registrado"}</td>
                      <td>{p.nombre}</td>
                      <td>{p.correo || "No registrado"}</td>
                      <td>{p.telefono || "No registrado"}</td>
                      <td>Sin estado</td>
                      <td>{new Date(p.created_at).toLocaleDateString("es-EC")}</td>
                      <td>Sin seguimiento</td>
                      <td>Sin motivo</td>
                      <td>Sin programación</td>
                      <td>Sin nota</td>
                      <td>
                        <button
                          className="vendedora-btn-abrir-prospeccion"
                          onClick={() => {
                            setProspectoSeleccionado(p);
                            setMostrarModalAbrirVenta(true);
                          }}
                        >
                          ➕ Abrir Prospección
                        </button>
                        <button className="vendedora-btn-editar" onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)}>
                          Ver Información
                        </button>

                      </td>
                    </tr>,

                  ]
              )
            ) : (
              <tr>
                <td colSpan="13" style={{ textAlign: "center", padding: "20px", fontWeight: "bold" }}>
                  No hay prospectos disponibles
                </td>
              </tr>
            )}
          </tbody>


        </table>
      </div>
      <div className="vendedora-cards-mobile">
        {prospectosFiltrados.length > 0 ? (
          prospectosFiltrados.flatMap((p) =>
            p.ventas.length > 0
              ? p.ventas.map((venta) => {
                const ultimaNota = venta.seguimientos
                  ?.sort((a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada))[0]?.nota ?? "Sin nota";

                const proximoContacto = venta.seguimientos
                  ?.filter((s) => s.estado === "pendiente")
                  .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0]?.fecha_programada;

                const proximoContactoFormateado = proximoContacto
                  ? new Date(proximoContacto).toLocaleDateString("es-EC")
                  : "Sin programar";

                return (
                  <div className="vendedora-prospecto-card" key={`venta-${p.id_prospecto}-${venta.id_venta}`}>
                    <h3>{p.nombre}</h3>
                    <p><strong>Objetivo:</strong> {venta.objetivo || "Sin objetivo"}</p>
                    <p><strong>Empleados:</strong> {p.empleados ?? "No registrado"}</p>

                    <p><strong>Estado:</strong> {mostrarEstado(venta)}</p>

                    <p><strong>Próximo Contacto:</strong> {proximoContactoFormateado}</p>
                    <p><strong>Última Nota:</strong> {ultimaNota}</p>
                    <div className="acciones">
                      <button className="vendedora-btn-seguimientos" onClick={() => navigate(`/seguimientos-prospecto/${p.id_prospecto}`)}>
                        Ver Seguimientos
                      </button>
                      <button className="vendedora-btn-editar" onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)}>
                        Ver Información
                      </button>
                    </div>
                  </div>
                );
              })
              : [
                <div className="vendedora-prospecto-card" key={`solo-${p.id_prospecto}`}>
                  <h3>{p.nombre}</h3>
                  <p><strong>Empleados:</strong> {p.empleados ?? "No registrado"}</p>
                  <p><strong>Estado:</strong> Sin estado</p>
                  <p><strong>Próximo Contacto:</strong> Sin programar</p>
                  <p><strong>Última Nota:</strong> Sin nota</p>
                  <div className="acciones">
                    <button
                      className="vendedora-btn-abrir-prospeccion"
                      onClick={() => {
                        setProspectoSeleccionado(p);
                        setMostrarModalAbrirVenta(true);
                      }}
                    >
                      ➕ Abrir Prospección
                    </button>

                    <button className="vendedora-btn-editar" onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)}>
                      Ver Información
                    </button>
                  </div>
                </div>,
              ]
          )
        ) : (
          <p style={{ textAlign: "center", fontWeight: "bold" }}>No hay prospectos disponibles</p>
        )}
      </div>
      {mostrarModalAbrirVenta && (
        <div className="modal">
          <div className="modal-contenido">
            <h3>Crear Prospección para {prospectoSeleccionado?.nombre}</h3>

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
              placeholder="Selecciona el tipo de servicio"
              value={tipoServicioSeleccionado}
              onChange={setTipoServicioSeleccionado}
              isClearable
            />

            {errorCrearVenta && <p className="error">{errorCrearVenta}</p>}

            <div className="modal-acciones">
              <button className="btn-confirmar" onClick={handleCrearVenta}>
                Crear
              </button>
              <button className="btn-cancelar" onClick={() => setMostrarModalAbrirVenta(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProspectosVendedora;
