import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const isAdminTokenValid = (token) => {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    const expiresAt = decoded.exp ? decoded.exp * 1000 : 0;
    const validRole = decoded.role && ["MAIN_ADMIN", "MINOR_ADMIN"].includes(decoded.role);
    return validRole && expiresAt > Date.now();
  } catch (err) {
    console.warn("Invalid admin token format", err);
    return false;
  }
};

const PrivateAdminRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  const valid = isAdminTokenValid(token);
  console.log("🔐 PrivateAdminRoute check - Token exists:", !!token);
  console.log("🔐 PrivateAdminRoute check - Token valid:", valid);

  if (!valid) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRole");
    localStorage.removeItem("adminId");
    console.log("❌ Invalid or expired admin token, redirecting to login");
    return <Navigate to="/admin-login" replace />;
  }

  console.log("✅ Admin token valid, rendering dashboard");
  return children;
};

export default PrivateAdminRoute;