import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerCedulaDesdeToken, getRol } from "../utils/auth";
import "../styles/crearProspecto.css";

const CrearProspecto = () => {
  const navigate = useNavigate();
  const [vendedoras, setVendedoras] = useState([]);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [esAdmin, setEsAdmin] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [origenes, setOrigenes] = useState([]);

  
  const [formData, setFormData] = useState({
    nombre: "",
    nombre_contacto: "",
    descripcion: "",
    id_categoria: null,
    id_origen: null,
    nota: "",
    correo: "",
    telefono: "",
    direccion: "",
    provincia: "",
    ciudad: "",
    sector: "",
    cedula_ruc: "",
    cedula_vendedora: "",
   // objetivo: "",
    created_at: new Date().toISOString().split("T")[0],
    empleados: "",
   // monto_proyectado: "",
  });

  useEffect(() => {

    obtenerCategorias();
    cargarOrigenes();
    const rol = getRol();
    const cedula = obtenerCedulaDesdeToken();

    setEsAdmin(rol === "admin");

    if (rol === "vendedora") {
      setFormData((prev) => ({ ...prev, cedula_vendedora: cedula }));
    } else {
      cargarVendedoras();
    }
  }, []);

  const cargarOrigenes = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos/origenes`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error("Error al cargar orígenes");
      const data = await res.json();
      setOrigenes(data);
    } catch (err) {
      console.error("Error al cargar orígenes:", err);
      setError("No se pudieron cargar los orígenes.");
    }
  };




  const cargarVendedoras = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/vendedoras`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setVendedoras(data);
    } catch (err) {
      setError("Error al cargar vendedoras");
      console.error("Error al cargar vendedoras:", err);

    }
  };
  const obtenerCategorias = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/categorias`);
      const data = await res.json();
      setCategorias(data);
    } catch (err) {
      console.error("Error al cargar categorías:", err);
      setError("No se pudieron cargar las categorías.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "id_categoria" ? (value ? Number(value) : null) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setEnviando(true);

    const camposObligatorios = [
      { campo: formData.nombre, mensaje: "El nombre es obligatorio." },
      { campo: formData.id_origen, mensaje: "Debe seleccionar un origen." },
      { campo: formData.id_categoria, mensaje: "Debe seleccionar una categoría." },
     // { campo: formData.objetivo, mensaje: "Debe ingresar el objetivo de la prospección." },
      { campo: formData.empleados, mensaje: "Debe ingresar el número de empleados." },
      //{ campo: formData.monto_proyectado, mensaje: "Debe ingresar el monto proyectado de la venta." },
      { campo: formData.cedula_vendedora, mensaje: "Debe asignar una vendedora." }
    ];

    for (const item of camposObligatorios) {
      if (!item.campo || item.campo === "") {
        setEnviando(false);
        return setError(item.mensaje);
      }
    }

    if (isNaN(formData.empleados) || Number(formData.empleados) < 0) {
      setEnviando(false);
      return setError("El número de empleados debe ser un número válido y no negativo.");
    }

   /* if (isNaN(formData.monto_proyectado) || Number(formData.monto_proyectado) < 0) {
      setEnviando(false);
      return setError("El monto proyectado debe ser un número válido y no negativo.");
    }*/

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/prospectos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error al crear prospecto");

      window.alert("✅ Prospecto creado exitosamente.");
      navigate(esAdmin ? "/prospectos-admin" : "/prospectos-vendedora");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };


  return (
    <div className="crear-prospecto-container">
      <button className="btn-volver" onClick={() => navigate(-1)}>⬅️ Volver</button>
      <h1>Crear Prospecto</h1>

      {mensaje && <p className="success">{mensaje}</p>}
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>Nombre Empresa <span className="required">*</span>:</label>
        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />


        <label>Categoría <span className="required">*</span>:</label>
        <select
          name="id_categoria"
          value={formData.id_categoria || ""}
          onChange={handleChange}
          required
        >
          <option value="">Seleccione una categoría...</option>
          {categorias.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>
              {c.nombre}
            </option>
          ))}
        </select>

        <label>Origen <span className="required">*</span>:</label>
        <select name="id_origen" value={formData.id_origen || ""} onChange={handleChange} required>
          <option value="">Seleccione...</option>
          {origenes.map((o) => (
            <option key={o.id_origen} value={o.id_origen}>{o.descripcion}</option>
          ))}
        </select>
        <label>Número de Empleados <span className="required">*</span>:</label>
        <input
          type="number"
          name="empleados"
          value={formData.empleados}
          onWheel={(e) => e.target.blur()}

          onChange={handleChange}
          required
        />
        <label>Nombre del Contacto:</label>
        <input type="text" name="nombre_contacto" value={formData.nombre_contacto} onChange={handleChange} />

        <label>Correo: </label>
        <input type="email" name="correo" value={formData.correo} onChange={handleChange} />

        <label>Teléfono: </label>
        <input
          type="number"
          name="telefono"
          value={formData.telefono}
          onChange={handleChange}
          onWheel={(e) => e.target.blur()}

        />
        <label>Dirección:</label>
        <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} />

        <label>Provincia:</label>
        <input type="text" name="provincia" value={formData.provincia} onChange={handleChange} />

        <label>Ciudad:</label>
        <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} />

        <label>Sector:</label>
        <input type="text" name="sector" value={formData.sector} onChange={handleChange} />

        <label>Cédula/RUC:</label>
        <input type="text" name="cedula_ruc" value={formData.cedula_ruc} onChange={handleChange} />





        <label>Descripción:</label>
        <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} />

        <label>Nota:</label>
        <textarea name="nota" value={formData.nota} onChange={handleChange} />




        <label>Fecha de Creación:</label>
        <input type="date" name="created_at" value={formData.created_at} onChange={handleChange} />

        {/* Solo si es admin, muestra selector de vendedora */}
        {esAdmin && (
          <>
            <label>Asignar Vendedora <span className="required">*</span>:</label>
            <select
              name="cedula_vendedora"
              value={formData.cedula_vendedora}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione una vendedora...</option>
              {vendedoras.map((v) => (
                <option key={v.cedula_ruc} value={v.cedula_ruc}>{v.nombre}</option>
              ))}
            </select>
          </>
        )}

       {/*<label>Objetivo de la Prospección <span className="required">*</span>:</label>
        <textarea
          name="objetivo"
          value={formData.objetivo || ""}
          onChange={handleChange}
          required
        />
        <label>Monto Proyectado de la Venta <span className="required">*</span>:</label>
        <input
          type="number"
          name="monto_proyectado"
          value={formData.monto_proyectado}
          onChange={handleChange}
          required
          onWheel={(e) => e.target.blur()}

        /> */} 

        <button type="submit" disabled={enviando}>
          {enviando ? "Creando..." : "Crear Prospecto"}
        </button>
        <button type="button" className="btn-cerrar" onClick={() => navigate(-1)}>Cerrar</button>
      </form>
    </div>
  );
};

export default CrearProspecto;
