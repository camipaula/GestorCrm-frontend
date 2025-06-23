import { jwtDecode } from "jwt-decode";

// Verifica si el usuario está autenticado
export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000; // tiempo actual en segundos

    if (decoded.exp < now) {
      alert("Tu sesión ha expirado. Por favor inicia sesión de nuevo.");
      logout();
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error al verificar token:", error);
    logout();
    return false;
  }
};


// Obtiene el rol del usuario desde el token JWT
export const getRol = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token);
    return decoded.rol; // Aseguramos que siempre tomamos el rol correcto del token
  } catch (error) {
    console.error("Error al decodificar el token:", error);
    return null;
  }
};

// Extrae la cédula desde el token JWT
export const obtenerCedulaDesdeToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded.cedula_ruc; // Devuelve la cédula del usuario
  } catch (error) {
    console.error("Error al decodificar el token:", error);
    return null;
  }
};

export const getNombreUsuario = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded.nombre;
  } catch (error) {
    console.error("Error al decodificar token:", error);
    return null;
  }
};

// Cierra sesión elimiAnando los datos del usuario y redirigiendo al login
export const logout = () => {
  localStorage.removeItem("token");

  // 🧹 Limpiar todos los filtros que empiecen con "filtros_"
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("filtros_")) {
      localStorage.removeItem(key);
    }
  });


  window.location.href = "/"; // Redirigir al login
};


