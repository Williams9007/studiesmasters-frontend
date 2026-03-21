// src/utils/api.js
import axios from "axios";

// ✅ Render backend URL
const BASE_URL = "https://studiesmasters-backend.onrender.com/api";

// Create Axios instance
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // Set to true if your backend uses cookies
});

// Automatically attach token from localStorage
api.interceptors.request.use(
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

// Global response interceptor for 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("⚠️ Unauthorized: clearing tokens...");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("qaoToken");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");

      // Redirect user to login based on path
      const path = window.location.pathname.includes("/admin") ? "/admin-login" : "/login";
      window.location.href = path;
    }
    return Promise.reject(error);
  }
);

// ✅ Helper functions
export const getJson = async (path) => (await api.get(path)).data;
export const postJson = async (path, payload) => (await api.post(path, payload)).data;

export default api;
