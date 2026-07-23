// src/utils/apiClient.js
import axios from "axios";

const apiClient = axios.create({
  // Keep every authenticated request on the same backend used for login.
  baseURL: `${(import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "")}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem("adminToken");
  const qaoToken = localStorage.getItem("qaoToken");
  const userToken = localStorage.getItem("token");

  const url = config.url?.toLowerCase() || "";
  let token = userToken;

  if (url.startsWith("/admin") || url.includes("/admin/")) {
    token = adminToken || qaoToken || userToken;
  } else if (url.startsWith("/qao") || url.includes("/qao/")) {
    token = qaoToken || adminToken || userToken;
  } else {
    token = userToken || qaoToken || adminToken;
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data?.error;
    const hadQaoToken = Boolean(localStorage.getItem("qaoToken"));
    const hadAdminToken = Boolean(localStorage.getItem("adminToken"));

    if (status === 401 || message === "Invalid token" || message === "Token expired") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminRole");
      localStorage.removeItem("adminId");
      localStorage.removeItem("qaoToken");
      localStorage.removeItem("qaoUser");

      if (hadQaoToken) {
        window.location.href = "/qao/access";
      } else if (hadAdminToken) {
        window.location.href = "/admin-login";
      } else {
        window.location.href = "/";
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
