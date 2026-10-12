// src/utils/apiClient.js
import axios from "axios";
import { API_BASE_URL } from "./backendUrl.js";

const apiClient = axios.create({
  // Keep every authenticated request on the same backend used for login.
  baseURL: API_BASE_URL,
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

  // Admin surfaces must ALWAYS prefer the admin token. /google/oauth/* and
  // /meet/admin/* are adminAuth-guarded (MAIN_ADMIN/MINOR_ADMIN); the previous
  // catch-all branch sent userToken (a student/teacher token from a prior login
  // on the same origin) first, so "Reconnect Google" 403'd even with a valid
  // admin session.
  if (
    url.startsWith("/admin") || url.includes("/admin/") ||
    url.startsWith("/google/oauth") || url.includes("/meet/admin")
  ) {
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
