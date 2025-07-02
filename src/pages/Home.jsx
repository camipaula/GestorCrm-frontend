import { useState, useEffect } from "react";
import { getRol } from "../utils/auth";
import Layout from "../components/Layout";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,

} from "recharts";
import "../styles/home.css";
import { obtenerCedulaDesdeToken } from "../utils/auth";
import FunnelD3 from "../components/FunnelD3";



const Home = () => {
  const rol = getRol();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [fechaInicioDefecto, setFechaInicioDefecto] = useState("");
  const [fechaFinDefecto, setFechaFinDefecto] = useState("");

  const [cedulaVendedora, setCedulaVendedora] = useState("");
  //const [sector, setSector] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [idCategoria, setIdCategoria] = useState("");

  const [idOrigen, setIdOrigen] = useState("");
  const [vendedoras, setVendedoras] = useState([]);
  //const [sectores, setSectores] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [origenes, setOrigenes] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [paginaCompetencia, setPaginaCompetencia] = useState(1);
  const [paginaAbiertas, setPaginaAbiertas] = useState(1);

  const [filtroEstadoAbiertas, setFiltroEstadoAbiertas] = useState("");
  const ordenEstadosAbiertas = ["Nuevo","En planeación", "Reabierto"];

  const filasPorPagina = 5;
  const filasPorPagina1 = 20;

  const competenciaPaginada = dashboardData?.tablaCompetencia?.slice(
    (paginaCompetencia - 1) * filasPorPagina,
    paginaCompetencia * filasPorPagina
  );
  const abiertasFiltradas = dashboardData?.tablaAbiertas?.filter(f =>
    !filtroEstadoAbiertas || f.estado === filtroEstadoAbiertas
  );

  const abiertasPaginada = abiertasFiltradas?.slice(
    (paginaAbiertas - 1) * filasPorPagina1,
    paginaAbiertas * filasPorPagina1
  );



  const COLORS = ["#1a73e8", "#34a853", "#fbbc05", "#ea4335", "#ff6d00", "#8e44ad"];

  const fetchCategorias = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setCategorias(data);
    } catch (error) {
      console.error("❌ Error cargando categorías:", error);
    }
  };


  const hayFiltrosActivos = () => {
    return (
      (rol === "admin" && cedulaVendedora) ||
      ciudad ||
      //sector ||
      idCategoria ||
      idOrigen ||
      fechaInicio !== fechaInicioDefecto ||
      fechaFin !== fechaFinDefecto
    );
  };

  const limpiarFiltros = () => {
    const hoy = new Date();
    const haceTresMeses = new Date();
    haceTresMeses.setMonth(hoy.getMonth() - 3);

    // SETEAR fecha fin como mañana
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1); // suma un día

    const inicio = haceTresMeses.toISOString().slice(0, 10);
    const fin = manana.toISOString().slice(0, 10); // ahora incluye todo lo de hoy

    setFechaInicio(inicio);
    setFechaFin(fin);
    setFechaInicioDefecto(inicio);
    setFechaFinDefecto(fin);
    setCedulaVendedora("");
    //setSector("");
    setCiudad("");
    setIdCategoria("");
    setIdOrigen("");
    setPaginaAbiertas(1);
    setPaginaCompetencia(1);

  };




  const fetchVendedoras = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setVendedoras(data);
    } catch (error) {
      console.error("Error al cargar vendedoras", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    const hoy = new Date();
    const haceTresMeses = new Date();
    haceTresMeses.setMonth(hoy.getMonth() - 3);

    const inicio = haceTresMeses.toISOString().slice(0, 10);
    const fin = hoy.toISOString().slice(0, 10);

    setFechaInicio(inicio);
    setFechaFin(fin);
    setFechaInicioDefecto(inicio);
    setFechaFinDefecto(fin);

    if (rol === "admin") fetchVendedoras();

    const fetchData = async () => {
      try {
       const [/*sectoresRes,*/ ciudadesRes, origenesRes] = await Promise.all([
           /*fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/sectores`, {
            headers: { Authorization: `Bearer ${token}` },
          }),*/
          fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/ciudades`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/origenes`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      //  const sectores = await sectoresRes.json();
        const ciudades = await ciudadesRes.json();
        const origenes = await origenesRes.json();

       // setSectores(Array.isArray(sectores) ? sectores : []);
        setCiudades(Array.isArray(ciudades) ? ciudades : []);
        setOrigenes(Array.isArray(origenes) ? origenes : []);
      } catch (error) {
        console.error("❌ Error cargando filtros:", error);
      }
    };

    fetchData();
    fetchCategorias();
    fetchDashboardData();
  }, []);



  useEffect(() => {
    if (fechaInicio && fechaFin) {
      fetchDashboardData();
    }
  }, [fechaInicio, fechaFin]);



  const handleMesChange = (mesSeleccionado) => {
    if (!mesSeleccionado) return;

    const anioActual = new Date().getFullYear();
    const primerDia = new Date(`${anioActual}-${mesSeleccionado}-01`);
    const ultimoDia = new Date(anioActual, parseInt(mesSeleccionado), 0); // el día 0 del siguiente mes es el último día del mes actual

    const inicio = primerDia.toISOString().slice(0, 10);
    const fin = ultimoDia.toISOString().slice(0, 10);

    setFechaInicio(inicio);
    setFechaFin(fin);
  };

  const fetchDashboardData = async () => {
    try {
      let url = new URL(`${import.meta.env.VITE_API_URL}/api/dashboard`);
      let params = {};

      if (fechaInicio && fechaFin) {
        params.fecha_inicio = fechaInicio;
        params.fecha_fin = fechaFin;
      }

      if (rol === "vendedora") {
        params.cedula_vendedora = obtenerCedulaDesdeToken();
      } else if (cedulaVendedora) {
        params.cedula_vendedora = cedulaVendedora;
      }

     // if (sector) params.sector = sector;
      if (ciudad) params.ciudad = ciudad;
      if (idCategoria) params.id_categoria = idCategoria;
      if (idOrigen) params.id_origen = idOrigen;

      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      if (!res.ok) throw new Error("Error al obtener datos del dashboard");

      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMontoChange = (index, nuevoMonto) => {
    const copia = [...dashboardData.tablaCierres];
    copia[index].monto = nuevoMonto;
    setDashboardData(prev => ({ ...prev, tablaCierres: copia }));
  };

  const guardarMontosActualizados = async () => {
    try {
      const token = localStorage.getItem("token");
      for (const fila of dashboardData.tablaCierres) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ventas/actualizar-monto`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            id_venta: fila.id_venta,
            monto: parseFloat(fila.monto)
          })
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Error actualizando monto");
        }
      }

      alert("Montos actualizados correctamente");

      setLoading(true);
      fetchDashboardData();

    } catch (err) {
      alert("❌ " + err.message);
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();

    fetchDashboardData();
  };

  if (loading) return <p>Cargando dashboard...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <Layout extraClass="dashboard-home">
      <div className="home-container">
        <h1>Bienvenida, {rol === "vendedora" ? "Vendedora" : "Administradora"}</h1>
        <button
          type="button"
          className={`btn-toggle-filtros ${hayFiltrosActivos() ? "filtros-activos" : ""}`}
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          style={{ marginBottom: "10px" }}
        >
          {mostrarFiltros ? "🔼 OCULTAR FILTROS" : "🔽 MOSTRAR FILTROS"}
          {hayFiltrosActivos() && <span style={{ marginLeft: "8px", color: "#e74c3c" }}>●</span>}
        </button>

        {mostrarFiltros && (

          <form className="filtros-dashboard" onSubmit={handleSubmit}>
            <select onChange={(e) => handleMesChange(e.target.value)} defaultValue="">
              <option value="">Filtrar por mes...</option>
              <option value="01">Enero</option>
              <option value="02">Febrero</option>
              <option value="03">Marzo</option>
              <option value="04">Abril</option>
              <option value="05">Mayo</option>
              <option value="06">Junio</option>
              <option value="07">Julio</option>
              <option value="08">Agosto</option>
              <option value="09">Septiembre</option>
              <option value="10">Octubre</option>
              <option value="11">Noviembre</option>
              <option value="12">Diciembre</option>
            </select>

            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />

            {rol === "admin" && (
              <select value={cedulaVendedora} onChange={(e) => setCedulaVendedora(e.target.value)}>
                <option value="">Todas las vendedoras</option>
                {vendedoras.map((v) => (
                  <option key={v.cedula_ruc} value={v.cedula_ruc}>{v.nombre}</option>
                ))}
              </select>
            )}

            <select value={ciudad} onChange={(e) => setCiudad(e.target.value)}>
              <option value="">Todas las ciudades</option>
              {ciudades.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>


            {/*<select value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="">Todos los sectores</option>
              {sectores.map((s, i) => (
                <option key={i} value={s}>{s}</option>
              ))}
            </select>*/}


            <select value={idOrigen} onChange={(e) => setIdOrigen(e.target.value)}>
              <option value="">Todos los orígenes</option>
              {origenes.map((o) => (
                <option key={o.id_origen} value={o.id_origen}>{o.descripcion}</option>
              ))}
            </select>

            <select value={idCategoria} onChange={(e) => setIdCategoria(e.target.value)}>
              <option value="">Todas las categorías</option>
              {categorias.map((c) => (
                <option key={c.id_categoria} value={c.id_categoria}>
                  {c.nombre}
                </option>
              ))}
            </select>


            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button type="submit">Filtrar</button>
              <button type="button" onClick={limpiarFiltros} className="btn-limpiar">
                Limpiar filtros
              </button>
            </div>

          </form>
        )}

        <hr style={{ margin: "20px 0" }} />  {/* 👈 separador visual */}

        <div className="dashboard-grid">

          <div className="dashboard-card-c">

            <h3>🥧 PROSPECCIONES ABIERTAS, CERRADAS Y NO INTERESADOS</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dashboardData.graficoVentas}
                  dataKey="cantidad"
                  nameKey="estado"
                  outerRadius={80}
                  labelLine={false}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, index }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    //const total = dashboardData.graficoVentas.reduce((sum, d) => sum + d.cantidad, 0);
                    const value = dashboardData.graficoVentas[index].cantidad;
                    //const porcentaje = ((value / total) * 100).toFixed(1);

                    return (
                      <text x={x} y={y} fill="#333" textAnchor="middle" dominantBaseline="central" fontSize={12}>
                        {`${value}`}
                      </text>
                    );
                  }}

                >
                  {dashboardData.graficoVentas.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} ventas`, name]}
                />
                <Legend
                  formatter={(value) => {
                    const item = dashboardData.graficoVentas.find((d) => d.estado === value);
                    const total = dashboardData.graficoVentas.reduce((sum, d) => sum + d.cantidad, 0);
                    const porcentaje = item ? ((item.cantidad / total) * 100).toFixed(1) : 0;
                    return `${value}: ${item?.cantidad || 0} (${porcentaje}%)`;
                  }}
                />

              </PieChart>
            </ResponsiveContainer>

          </div>
          <div className="dashboard-resumen-container">
            <div className="dashboard-card resumen">
              <h3>📊 RESUMEN DE PROSPECCIONES</h3>
              <p>📂 TOTALES: <strong>{dashboardData.totalVentas}</strong></p>
              <p>🔓 ABIERTAS: <strong>{dashboardData.totalVentasAbiertas}</strong></p>
              <p>✅ CERRADAS: <strong>{dashboardData.totalVentasGanadas} ({(dashboardData.porcentajeGanadas ?? 0).toFixed(1)}%)</strong></p>
              <p>❌ NO INTERESADOS: <strong>{dashboardData.totalVentasPerdidas} ({(dashboardData.porcentajePerdidas ?? 0).toFixed(1)}%)</strong></p>
            </div>

            <div className="dashboard-card resumen-secundario">
              <h4>✅ PORCENTAJE DE PROSPECCINES CERRADAS</h4>
              <strong>{(dashboardData.porcentajeGanadas ?? 0).toFixed(1)}%</strong>

              <h4>📅 PROMEDIO DE DÍAS HASTA EL CIERRE</h4>
              <p>{dashboardData.promedioDiasCierre} días</p>

              <h4>💵 PROMEDIO DEL MONTO DE CIERRE</h4>
              <p>${dashboardData.promedioMontoCierre}</p>
            </div>
          </div>

          {/* Fases de Prospección */}
          <div className="dashboard-card1">
            {dashboardData?.graficoEstadosProspecto?.length > 0 && (
              <FunnelD3 data={dashboardData.graficoEstadosProspecto} />
            )}
          </div>


          {/*<div className="dashboard-card">
            <h3>🏷️ PROSPECTOS POR CATEGORÍA</h3>
            <ResponsiveContainer width="100%" height={300}>
              <FunnelChart>
                <Tooltip formatter={(value) => [`${value} prospectos`]} />
                <Funnel
                  dataKey="cantidad"
                  nameKey="categoria"
                  data={[...dashboardData.graficoCategorias].sort((a, b) => b.cantidad - a.cantidad)}
                  isAnimationActive
                >
                  {dashboardData.graficoCategorias.map((_, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                  <LabelList
                    dataKey="cantidad"
                    position="inside"
                    style={{ fill: "#fff", fontSize: 12, fontWeight: "bold" }}
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>

            {/* Leyenda manual 
            <div style={{ marginTop: "10px" }}>
              {[...dashboardData.graficoCategorias]
                .sort((a, b) => b.cantidad - a.cantidad)
                .map((cat, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "4px",
                    }}
                  >
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        backgroundColor: COLORS[idx % COLORS.length],
                        marginRight: "8px",
                        borderRadius: "2px",
                      }}
                    ></div>
                    <span style={{ fontSize: "13px", color: "#333" }}>
                      {cat.categoria.toUpperCase()}: {cat.cantidad}
                    </span>
                  </div>
                ))}
            </div>
          </div> */}

          <div className="dashboard-card">
            <h3>🏷️ PROSPECTOS POR CATEGORÍA</h3>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData.graficoCategorias}
                    dataKey="cantidad"
                    nameKey="categoria"
                    outerRadius={90}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, index }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      const value = dashboardData.graficoCategorias[index].cantidad;

                      return (
                        <text x={x} y={y} fill="#333" textAnchor="middle" dominantBaseline="central" fontSize={12}>
                          {`${value}`}
                        </text>
                      );
                    }}
                  >
                    {dashboardData.graficoCategorias.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} prospectos`, name]} />
                </PieChart>
              </ResponsiveContainer>

              {/* 💡 Leyenda personalizada separada abajo */}
              <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
                {dashboardData.graficoCategorias.map((cat, idx) => {
                  const total = dashboardData.graficoCategorias.reduce((sum, d) => sum + d.cantidad, 0);
                  const porcentaje = ((cat.cantidad / total) * 100).toFixed(1);
                  return (
                    <div key={idx} style={{ display: "flex", alignItems: "center", fontSize: "13px" }}>
                      <div
                        style={{
                          width: "12px",
                          height: "12px",
                          backgroundColor: COLORS[idx % COLORS.length],
                          marginRight: "6px",
                          borderRadius: "2px"
                        }}
                      />
                      <span>{cat.categoria}: {cat.cantidad} ({porcentaje}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>





          <div className="dashboard-card tabla-cierres">
            <h3>📋 DETALLE DE PROSPECCIONES GANADAS</h3>
            <div className="tabla-detalle-cierres">

              <table>
                <thead>
                  <tr>
                    <th>Prospecto</th>
                    <th>Empleados</th>
                    <th>Apertura</th>
                    <th>Cierre</th>
                    <th>Días</th>
                    <th>Monto Proyectado</th>
                    <th>Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.tablaCierres.map((fila, i) => (
                    <tr key={i}>
                      <td>{fila.prospecto}</td>
                      <td>{fila.numero_empleados}</td>
                      <td>{new Date(fila.fecha_apertura).toLocaleDateString()}</td>
                      <td>{new Date(fila.fecha_cierre).toLocaleDateString()}</td>
                      <td>{fila.dias}</td>
                      <td>{fila.monto_proyectado != null ? `$${parseFloat(fila.monto_proyectado).toFixed(2)}` : "No definido"}</td>

                      <td>
                        {rol === "admin" ? (
                          <input
                            type="number"
                            min="0"
                            value={fila.monto}
                            onChange={(e) => handleMontoChange(i, e.target.value)}
                            className="sin-spinners"

                            style={{ width: "80px" }}
                            onWheel={(e) => e.target.blur()} // ❌ Previene scroll accidental

                          />
                        ) : (
                          `$${fila.monto}`
                        )}
                      </td>



                    </tr>
                  ))}
                </tbody>
              </table>
              {rol === "admin" && (
                <button onClick={guardarMontosActualizados}>
                  💾 Guardar montos editados
                </button>
              )}
            </div>
          </div>

          <div className="dashboard-card tabla-cierres">
            <h3>❌ PROSPECCIONES NO INTERESADOS</h3>
            <div className="tabla-detalle-cierres">

              <table>
                <thead>
                  <tr>
                    <th>Prospecto</th>
                    <th>Empleados</th>
                    <th>Apertura</th>
                    <th>Estado</th>
                    <th>Último Resultado</th>

                  </tr>
                </thead>
                <tbody>
                  {competenciaPaginada.map((fila, i) => (
                    <tr key={i}>
                      <td>{fila.prospecto}</td>
                      <td>{fila.numero_empleados}</td>
                      <td>{new Date(fila.fecha_apertura).toLocaleDateString()}</td>
                      <td>{fila.estado}</td>
                      <td>{fila.ultimo_resultado}</td>

                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="paginador-competencia">
                {paginaCompetencia > 1 && (
                  <button onClick={() => setPaginaCompetencia(paginaCompetencia - 1)}>Anterior</button>
                )}
                <span>Página {paginaCompetencia}</span>
                {paginaCompetencia * filasPorPagina < dashboardData.tablaCompetencia.length && (
                  <button onClick={() => setPaginaCompetencia(paginaCompetencia + 1)}>Siguiente</button>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-card tabla-cierres">
            <div style={{ marginBottom: "10px" }}>
              <label style={{ marginRight: "10px" }}>Filtrar por estado:</label>
              <select
                value={filtroEstadoAbiertas}
                onChange={(e) => {
                  setFiltroEstadoAbiertas(e.target.value);
                  setPaginaAbiertas(1); // Reinicia paginación al cambiar filtro
                }}
              >
                <option value="">Todos</option>
                {ordenEstadosAbiertas.map((estado, i) => (
                  <option key={i} value={estado}>{estado}</option>
                ))}
              </select>
            </div>

            <h3>🔓 PROSPECCIONES ABIERTAS</h3>
            <div className="tabla-detalle-cierres">

              <table>
                <thead>
                  <tr>
                    <th>Prospecto</th>
                    <th>Objetivo</th>
                    <th>Empleados</th>
                    <th>Apertura</th>
                    <th>Estado</th>
                    <th>Motivo</th>
                    <th>Nota</th>

                    <th>Próximo Paso</th>
                    <th>Vendedora</th>
                  </tr>
                </thead>
                <tbody>
                  {abiertasPaginada.map((fila, i) => (
                    <tr key={i}>
                      <td>{fila.prospecto}</td>
                      <td>{fila.objetivo}</td>

                      <td>{fila.numero_empleados}</td>
                      <td>{new Date(fila.fecha_apertura).toLocaleDateString()}</td>
                      <td>{fila.estado}</td>
                      <td>{fila.motivo}</td>
                      <td>{fila.nota}</td>
                      <td>{fila.proximo_paso}</td>
                      <td>{fila.vendedora}</td>
                    </tr>
                  ))}
                </tbody>

              </table>
              <div className="paginador-abiertas">
                {paginaAbiertas > 1 && (
                  <button onClick={() => setPaginaAbiertas(paginaAbiertas - 1)}>Anterior</button>
                )}
                <span>Página {paginaAbiertas}</span>
                {paginaAbiertas * filasPorPagina1 < dashboardData.tablaAbiertas.length && (
                  <button onClick={() => setPaginaAbiertas(paginaAbiertas + 1)}>Siguiente</button>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Home;