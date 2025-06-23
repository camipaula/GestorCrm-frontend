import PropTypes from "prop-types";
import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated, getRol } from "../utils/auth";

const ProtectedRoute = ({ allowedRoles }) => {
  const auth = isAuthenticated();
  const userRole = getRol();

  if (!auth) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

//Validamos correctamente las props
ProtectedRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default ProtectedRoute;
