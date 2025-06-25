import { useState, useEffect, useRef } from "react";
import Select from "react-select";
import "../styles/prospectosAdmin1.css";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import { getRol } from "../utils/auth";


const ProspectosAdmin = () => {
  const navigate = useNavigate();

  const rol = getRol();
  const esSoloLectura = rol === "lectura";

  const [prospectos, setProspectos] = useState([]);
  const [vendedoras, setVendedoras] = useState([]);
 // const [sectores, setSectores] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [cedulaVendedora, setCedulaVendedora] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [fechaInicioDefecto, setFechaInicioDefecto] = useState("");
  const [fechaFinDefecto, setFechaFinDefecto] = useState("");


  //const [sectorFiltro, setSectorFiltro] = useState(null);
  const [categoriaFiltro, setCategoriaFiltro] = useState(null);
  const [estados, setEstados] = useState([]);
  const [busquedaNombre, setBusquedaNombre] = useState("");
  const [ciudades, setCiudades] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [ciudadFiltro, setCiudadFiltro] = useState("");
  const [provinciaFiltro, setProvinciaFiltro] = useState("");


  const [filtrosInicializados, setFiltrosInicializados] = useState(false);

  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busquedaInput, setBusquedaInput] = useState("");

  const [orden, setOrden] = useState(""); // "" o "proximo_contacto"

  const [mostrarModalAbrirVenta, setMostrarModalAbrirVenta] = useState(false);
  const [prospectoSeleccionado, setProspectoSeleccionado] = useState(null);
  const [nuevoObjetivo, setNuevoObjetivo] = useState("");
  const [nuevoMonto, setNuevoMonto] = useState("");
  const [errorCrearVenta, setErrorCrearVenta] = useState("");

  const [tiposServicio, setTiposServicio] = useState([]);
  const [tipoServicioSeleccionado, setTipoServicioSeleccionado] = useState(null);

  const debouncedBuscar = useRef(
    debounce((valor) => {
      setPaginaActual(1); // primero reinicia la página
      setBusquedaNombre(valor); // luego actualiza la búsqueda
    }, 500)
  ).current;


  const hayFiltrosActivos = () => {
    return (
      cedulaVendedora ||
      estadoFiltro.length > 0 ||
     // sectorFiltro ||
      categoriaFiltro ||
      ciudadFiltro ||
      provinciaFiltro ||
      busquedaNombre.trim() !== "" ||
      orden ||
      fechaInicio !== fechaInicioDefecto ||
      fechaFin !== fechaFinDefecto
    );
  };


  useEffect(() => {
    obtenerVendedoras();
    //obtenerSectores();
    obtenerCategorias();
    obtenerEstados();
    obtenerCiudades();
    obtenerProvincias();
    establecerFechasUltimos3Meses();
  }, []);

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

  useEffect(() => {
    const filtrosGuardados = localStorage.getItem("filtros_prospectos_admin");
    if (filtrosGuardados) {
      try {
        const filtros = JSON.parse(filtrosGuardados);

        if (filtros.cedulaVendedora) setCedulaVendedora(filtros.cedulaVendedora);
        if (filtros.fechaInicio) setFechaInicio(filtros.fechaInicio);
        if (filtros.fechaFin) setFechaFin(filtros.fechaFin);
        if (filtros.orden) setOrden(filtros.orden);

        if (filtros.ciudadFiltro) setCiudadFiltro(filtros.ciudadFiltro);
        if (filtros.provinciaFiltro) setProvinciaFiltro(filtros.provinciaFiltro);
        if (filtros.busquedaNombre) {
          setBusquedaNombre(filtros.busquedaNombre);
          setBusquedaInput(filtros.busquedaNombre);
        }


        setEstadoFiltro(filtros.estadoFiltro || []);
        setCategoriaFiltro(filtros.categoriaFiltro || null);
        //setSectorFiltro(filtros.sectorFiltro || null);
      } catch (e) {
        console.error("Error al parsear filtros guardados:", e);
      }
    }
    setFiltrosInicializados(true);
  }, []);

  const obtenerCiudades = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/ciudades`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCiudades(data.map((c) => ({ value: c, label: c })));
    } catch (err) {
      console.error("Error al cargar ciudades:", err);
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
      console.error("Error al cargar provincias:", err);
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


  // Establece automáticamente las fechas del mes actual
  const establecerFechasUltimos3Meses = () => {
    const fechaActual = new Date();
    const fechaFin = fechaActual.toISOString().split("T")[0];

    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - 3);
    const fechaInicioFormateada = fechaInicio.toISOString().split("T")[0];

    setFechaInicio(fechaInicioFormateada);
    setFechaFin(fechaFin);

    setFechaInicioDefecto(fechaInicioFormateada);
    setFechaFinDefecto(fechaFin);
  };



  useEffect(() => {
    if (filtrosInicializados && fechaInicio && fechaFin) {
      buscarProspectos();
    }
  }, [
    cedulaVendedora,
    estadoFiltro,
    fechaInicio,
    fechaFin,
    //sectorFiltro,
    categoriaFiltro,
    ciudadFiltro,
    provinciaFiltro,
    filtrosInicializados,
    paginaActual,
    busquedaNombre,

  ]);


  const obtenerVendedoras = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`);
      if (!res.ok) throw new Error("Error cargando vendedoras");
      const data = await res.json();
      setVendedoras(data);
    } catch (err) {
      setError(err.message);
    }
  };

  /*const obtenerSectores = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/sectores`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(" ");
      const data = await res.json();
      setSectores(data.map((s) => ({ value: s, label: s })));
    } catch (error) {
      //console.error(":", error);
      setError(error.message);
    }
  };*/

  const obtenerCategorias = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias`);
      if (!res.ok) throw new Error("Error cargando categorías");
      setCategorias((await res.json()).map((c) => ({ value: c.id_categoria, label: c.nombre })));
    } catch (err) {
      setError(err.message);
    }
  };

  const buscarProspectos = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      let params = new URLSearchParams();
      params.append("page", paginaActual);
      params.append("limit", 10);

      if (cedulaVendedora) params.append("cedula_vendedora", cedulaVendedora);
      if (estadoFiltro.length > 0) {
        estadoFiltro.forEach((estado) => params.append("estado", estado.value));
      }
      if (fechaInicio) params.append("fechaInicio", fechaInicio);
      if (fechaFin) params.append("fechaFin", fechaFin);
      //if (sectorFiltro) params.append("sector", sectorFiltro.value);
      if (categoriaFiltro) params.append("id_categoria", categoriaFiltro.value);
      if (ciudadFiltro) params.append("ciudad", ciudadFiltro);
      if (provinciaFiltro) params.append("provincia", provinciaFiltro);
      if (busquedaNombre.trim() !== "") params.append("nombre", busquedaNombre);
      if (orden) params.append("orden", orden);

      const url = `${import.meta.env.VITE_API_URL}/api/prospectos?${params.toString()}`;


      const res = await fetch(url, {
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


  const eliminarProspecto = async (id) => {
    try {
      const razon = prompt("¿Por qué deseas eliminar este prospecto? (Ej: duplicado, error de tipeo, etc.)");
      if (!razon || razon.trim().length < 3) {
        alert("Debes ingresar una razón válida.");
        return;
      }

      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/${id}/eliminar`, {
        method: "PUT", // usamos PUT porque es una eliminación lógica con update
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ razon }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Error eliminando prospecto");
        return;
      }


      setProspectos((prev) => prev.filter((p) => p.id_prospecto !== id));
    } catch (error) {
      setError(error.message);
    }
  };

  const exportarExcel = async () => {
    try {
      const token = localStorage.getItem("token");

      let url = `${import.meta.env.VITE_API_URL}/api/prospectos/exportar?`;

      if (cedulaVendedora) url += `cedula_vendedora=${cedulaVendedora}&`;
      if (estadoFiltro.length > 0) {
        estadoFiltro.forEach((estado) => {
          url += `estado=${estado.value}&`;
        });
      }
      if (categoriaFiltro) url += `id_categoria=${categoriaFiltro.value}&`;
      if (fechaInicio) url += `fechaInicio=${fechaInicio}&`;
      if (fechaFin) url += `fechaFin=${fechaFin}&`;
      //if (sectorFiltro) url += `sector=${sectorFiltro.value}&`;
      if (ciudadFiltro) url += `ciudad=${encodeURIComponent(ciudadFiltro)}&`;
      if (provinciaFiltro) url += `provincia=${encodeURIComponent(provinciaFiltro)}&`;


      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const contentType = res.headers.get("content-type");

      // Si la respuesta es JSON en lugar de un archivo, significa que no hay prospectos
      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        alert(data.message);
        return;
      }

      if (!res.ok) throw new Error("Error al exportar prospectos");

      // Convertir la respuesta en un blob y descargar el archivo
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "prospectos.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al exportar:", error);
    }
  };

  const handleCrearVenta = async () => {
    if (!nuevoObjetivo.trim() || isNaN(nuevoMonto) || Number(nuevoMonto) <= 0) {
      setErrorCrearVenta("Completa todos los campos con valores válidos.");
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
          monto_proyectado: nuevoMonto,
          id_tipo_servicio: tipoServicioSeleccionado?.value || null

        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setMostrarModalAbrirVenta(false);
      setNuevoObjetivo("");
      setNuevoMonto("");
      setTipoServicioSeleccionado(null);

      // Redirige a seguimientos del prospecto
      navigate(`/seguimientos-prospecto/${prospectoSeleccionado.id_prospecto}`);
    } catch (err) {
      setErrorCrearVenta(err.message || "Error al crear prospección");
    }
  };


  useEffect(() => {
    if (!filtrosInicializados) return;

    const filtros = {
      cedulaVendedora,
      estadoFiltro,
      fechaInicio,
      fechaFin,
     // sectorFiltro,
      categoriaFiltro,
      ciudadFiltro,
      provinciaFiltro,
      busquedaNombre,
      orden
    };
    localStorage.setItem("filtros_prospectos_admin", JSON.stringify(filtros));
  }, [
    cedulaVendedora,
    estadoFiltro,
    fechaInicio,
    fechaFin,
   // sectorFiltro,
    categoriaFiltro,
    ciudadFiltro,
    provinciaFiltro,
    busquedaNombre,
    orden,
    filtrosInicializados,
  ]);

  const prospectosFiltrados = prospectos.filter((p) =>
    p.nombre.toLowerCase().includes(busquedaNombre.toLowerCase())
  );


  const limpiarFiltros = () => {
    setCedulaVendedora("");
    setEstadoFiltro([]);
    setCategoriaFiltro(null);
    setCiudadFiltro("");
    setProvinciaFiltro("");
    setBusquedaNombre("");
    setBusquedaInput("");
    establecerFechasUltimos3Meses(); 
    setPaginaActual(1);
    localStorage.removeItem("filtros_prospectos_admin");
  };


  useEffect(() => {
    return () => {
      debouncedBuscar.cancel();
    };
  }, []);


  return (
    <div className="admin-prospectos-page">
      <h1 className="admin-prospectos-title">GESTIÓN DE PROSPECTOS</h1>
      <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>

      {error && <p className="error">{error}</p>}
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
            <label>Vendedora</label>
            <select
              name="cedula_vendedora"
              onChange={(e) => setCedulaVendedora(e.target.value)}
              value={cedulaVendedora}
            >
              <option value="">Todas</option>
              {vendedoras.map((v) => (
                <option key={v.cedula_ruc} value={v.cedula_ruc}>
                  {v.nombre}
                </option>
              ))}
            </select>
          </div>


          <div className="filtro-grupo">
            <label>Categoría</label>
            <Select
              options={categorias}
              placeholder="Seleccionar Categoría"
              className="select-categoria"
              value={categoriaFiltro}
              onChange={setCategoriaFiltro}
              isClearable
            />
          </div>
          <div className="filtro-grupo">
            <label>Ciudad</label>
            <Select
              options={ciudades}
              placeholder="Seleccionar Ciudad"
              className="select-ciudad"
              value={ciudades.find(c => c.value === ciudadFiltro)}
              onChange={(op) => setCiudadFiltro(op ? op.value : "")}
              isClearable
            />
          </div>

          <div className="filtro-grupo">
            <label>Provincia</label>
            <Select
              options={provincias}
              placeholder="Seleccionar Provincia"
              className="select-provincia"
              value={provincias.find(p => p.value === provinciaFiltro)}
              onChange={(op) => setProvinciaFiltro(op ? op.value : "")}
              isClearable
            />
          </div>
          <div className="filtro-grupo">

            <label>Estado(s)</label>
            <Select
              options={estados}
              isMulti
              placeholder="Seleccionar Estado(s)"
              className="select-estado"
              classNamePrefix="select"
              value={estadoFiltro}
              onChange={setEstadoFiltro}
            />
          </div>


          <div className="filtro-grupo">
            <label>Fecha Inicio</label>
            <input
              type="date"
              name="fechaInicio"
              onChange={(e) => setFechaInicio(e.target.value)}
              value={fechaInicio}
            />
          </div>
          <div className="filtro-grupo">
            <label>Fecha Fin</label>
            <input
              type="date"
              name="fechaFin"
              onChange={(e) => setFechaFin(e.target.value)}
              value={fechaFin}
            />
          </div>


          <button onClick={limpiarFiltros} disabled={loading}>
            🧹 Limpiar Filtros
          </button>





        </div>
      )}




      <button className="exportar-btn" onClick={exportarExcel}>
        📥 EXPORTAR EXCEL
      </button>
      {!esSoloLectura && (
        <button className="admin-btn-nuevo-prospecto" onClick={() => navigate("/crear-prospecto")}>
          ➕ CREAR PROSPECTO
        </button>
      )}


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

        <div className="paginador-lindo">
          <button onClick={buscarProspectos} disabled={loading}>
            {loading ? "Cargando..." : "BUSCAR"}
          </button>
        </div>

      </div>
      {loading && <p>Cargando prospectos...</p>}


      <div className="admin-prospectos-table-wrapper">

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



        <table className="admin-prospectos-table">
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
              <th>Responsable</th>
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
                        <td>{venta.estado_venta?.nombre || "Sin estado"}</td>
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
                        <td>{p.vendedora_prospecto?.nombre || "SIN ASIGNAR"}</td>
                        <td>{ultimoSeguimiento?.nota || "-"}</td>
                        <td>
                          <div className="admin-botones-acciones">
                            <button
                              className="admin-btn-seguimientos"
                              onClick={() => navigate(`/seguimientos-prospecto/${p.id_prospecto}`)}
                            >
                              🔍 VER SEGUIMIENTOS
                            </button>
                            <button
                              className="admin-btn-editar"
                              onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)}
                            >
                              INFORMACIÓN DEL PROSPECTO
                            </button>

                            {!esSoloLectura && (

                              <button
                                className="admin-btn-eliminar"
                                onClick={() => eliminarProspecto(p.id_prospecto)}
                              >
                                Eliminar
                              </button>
                            )}

                          </div>

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
                      <td>{p.vendedora_prospecto?.nombre || "SIN ASIGNAR"}</td>
                      <td>Sin nota</td>
                      <td>
                        <div className="admin-botones-acciones">
                          <button
                            className="admin-btn-abrir-prospeccion"
                            onClick={() => {
                              setProspectoSeleccionado(p);
                              setMostrarModalAbrirVenta(true);
                            }}
                          >
                            ➕ Abrir Prospección
                          </button>

                          <button
                            className="admin-btn-editar"
                            onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)}
                          >
                            Información del Prospecto
                          </button>
                          <button
                            className="admin-btn-eliminar"
                            onClick={() => eliminarProspecto(p.id_prospecto)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>,
                  ]
              )
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "20px", fontWeight: "bold" }}>
                  No hay prospectos disponibles
                </td>
              </tr>
            )}
          </tbody>




        </table>



      </div>

      {/* Tarjetas para móvil */}
      <div className="admin-prospectos-cards-mobile">
        {prospectosFiltrados.length > 0 ? (
          prospectosFiltrados.flatMap((p) =>
            p.ventas.length > 0
              ? p.ventas.map((venta) => {
                const ultimaNota = venta.seguimientos
                  ?.sort((a, b) => new Date(b.fecha_programada) - new Date(a.fecha_programada))[0]?.nota ?? "-";

                const proximoContacto = venta.seguimientos
                  ?.filter((s) => s.estado === "pendiente")
                  .sort((a, b) => new Date(a.fecha_programada) - new Date(b.fecha_programada))[0]?.fecha_programada;

                const proximoContactoFormateado = proximoContacto
                  ? new Date(proximoContacto).toLocaleDateString("es-EC")
                  : "SIN PROGRAMAR";

                return (
                  <div className="admin-prospecto-card" key={`venta-${p.id_prospecto}-${venta.id_venta}`}>
                    <h3>{p.nombre}</h3>
                    <p><strong>Vendedora:</strong> {p.vendedora_prospecto?.nombre || "SIN ASIGNAR"}</p>
                    <p><strong>Objetivo:</strong> {venta.objetivo || "SIN OBJETIVO"}</p>
                    <p><strong>Empleados:</strong> {p.empleados ?? "NO REGISTRADO"}</p>

                    <p><strong>Estado:</strong>
                      {venta.estado_venta?.nombre?.toLowerCase() === "cierre" && venta.monto_cierre
                        ? `Ganado ($${parseFloat(venta.monto_cierre).toFixed(2)})`
                        : venta.estado_venta?.nombre || "Sin estado"}
                    </p>
                    <p><strong>Próximo contacto:</strong> {proximoContactoFormateado}</p>
                    <p><strong>Última nota:</strong> {ultimaNota}</p>
                    <div className="acciones">
                      <button className="btn-seguimientos" onClick={() => navigate(`/seguimientos-prospecto/${p.id_prospecto}`)}>
                        🔍 Ver Seguimientos
                      </button>
                      <button className="btn-editar" onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)}>
                        Editar
                      </button>
                      <button className="btn-eliminar" onClick={() => eliminarProspecto(p.id_prospecto)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })
              : [
                <div className="admin-prospecto-card" key={`solo-${p.id_prospecto}`}>
                  <h3>{p.nombre}</h3>
                  <p><strong>Vendedora:</strong> {p.vendedora_prospecto?.nombre || "SIN ASIGNAR"}</p>
                  <p><strong>Objetivo:</strong> SIN OBJETIVO</p>
                  <p><strong>Estado:</strong> SIN ESTADO</p>
                  <p><strong>Próximo contacto:</strong> SIN PROGRAMAR</p>
                  <p><strong>Última nota:</strong> SIN NOTA</p>
                  <div className="acciones">
                    <button
                      className="btn-abrir-prospeccion"
                      onClick={() => {
                        setProspectoSeleccionado(p);
                        setMostrarModalAbrirVenta(true);
                      }}
                    >
                      ➕ Abrir Prospección
                    </button>

                    <button className="btn-editar" onClick={() => navigate(`/editar-prospecto/${p.id_prospecto}`)}>
                      Editar
                    </button>
                    <button className="btn-eliminar" onClick={() => eliminarProspecto(p.id_prospecto)}>
                      Eliminar
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

export default ProspectosAdmin;
