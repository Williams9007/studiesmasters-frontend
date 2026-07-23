// src/utils/apiClient.js
import axios from "axios";

// Base URL from environment or fallback to localhost
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

// Create Axios instance
export const apiClient = axios.create({
  baseURL: BASE,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false, // optional
});

// ✅ Automatically attach token from localStorage (adminToken OR qaoToken)
apiClient.interceptors.request.use(
  (config) => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      const qaoToken = localStorage.getItem("qaoToken");
      const token = adminToken || qaoToken; // prioritize adminToken

      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("Could not read token from localStorage:", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Global response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 / unauthorized globally
      if (error.response.status === 401) {
        console.warn(
          "⚠️ Unauthorized: token expired or invalid. Clearing tokens."
        );
        localStorage.removeItem("adminToken");
        localStorage.removeItem("qaoToken");
        localStorage.removeItem("role");
        localStorage.removeItem("userId");
        // Redirect to login page
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

// ✅ Helper for GET requests
export async function getJson(path) {
  const res = await apiClient.get(path);
  return res.data;
}

// ✅ Helper for POST requests (optional)
export async function postJson(path, payload) {
  const res = await apiClient.post(path, payload);
  return res.data;
}

export default apiClient;
