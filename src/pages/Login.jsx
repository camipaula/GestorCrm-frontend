import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error en login");

      //Guardamos en localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("rol", data.rol);

      //Redirigir según el rol
      setTimeout(() => {
        if (data.rol === "admin") {
          navigate("/admin");
        } else if (data.rol === "vendedora") {
          navigate("/vendedora");
        } else if (data.rol === "lectura") {
          navigate("/admin"); //  esta nueva vista la creas abajo
        } else {
          navigate("/");
        }
        window.location.reload();
      }, 100);


    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Iniciar Sesión</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="login-button" type="submit">Iniciar sesión</button>

        </form>
      </div>
    </div>
  );
};

export default Login;
