// src/utils/apiClient.js
import axios from "axios";

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
    return Promise.reject(error);
  }
);

export default apiClient;
