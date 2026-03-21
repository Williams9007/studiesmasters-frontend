// src/utils/api.js
import axios from "axios";

const BASE_URL = "https://studiesmasters-backend.onrender.com/api";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// attach token automatically
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

// handle 401 globally
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("qaoToken");
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      const path = window.location.pathname.includes("/admin") ? "/admin-login" : "/login";
      window.location.href = path;
    }
    return Promise.reject(error);
  }
);

export const getJson = async (path) => (await apiClient.get(path)).data;
export const postJson = async (path, payload) => (await apiClient.post(path, payload)).data;
