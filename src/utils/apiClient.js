// src/utils/apiClient.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:5000/api", // or your deployed URL
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
