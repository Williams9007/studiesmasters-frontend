// src/utils/api.js
import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000", // pick from frontend .env
  headers: { "Content-Type": "application/json" },
});

// Automatically attach admin token if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login if token is invalid/expired
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("adminToken");
      window.location.href = "/admin-login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
