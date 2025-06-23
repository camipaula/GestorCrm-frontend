import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { getRol } from "../utils/auth";
import "../styles/layout.css";

const Layout = ({ children, extraClass }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userRol = getRol();
    setRol(userRol);

    // Por defecto:
    // - Sidebar abierto en escritorio
    // - Sidebar cerrado en móvil
    const isMobile = window.innerWidth <= 768;
    setIsSidebarOpen(!isMobile);

    setLoading(false);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="layout">
      <Navbar toggleSidebar={toggleSidebar} />

      <Sidebar
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        rol={rol}
      />

<div className={`main-container ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"} ${extraClass || ""}`}>
        <div className="content">{children}</div>
      </div>
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  extraClass: PropTypes.string,
};


export default Layout;
