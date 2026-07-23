import { Navigate } from "react-router-dom";

export default function ProtectedAdminRoute({ children, allow }) {
  const token = localStorage.getItem("adminToken");
  const role = localStorage.getItem("adminRole");

  if (!token || !role) {
    return <Navigate to="/admin/login" />;
  }

  if (!allow.includes(role)) {
    return <Navigate to="/admin/dashboard" />;
  }

  return children;
}
