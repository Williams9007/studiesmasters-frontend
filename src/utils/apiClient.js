// src/utils/apiClient.js
import axios from "axios";

<<<<<<< HEAD
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

=======
const BASE_URL = "https://studiesmasters-backend.onrender.com/api";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Attach token automatically
apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("qaoToken") ||
      localStorage.getItem("token");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      const path = window.location.pathname.includes("/admin")
        ? "/admin-login"
        : "/login";
      window.location.href = path;
    }
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
    return Promise.reject(error);
  }
);

export default apiClient;
