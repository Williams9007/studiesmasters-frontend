// frontend/config/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://studiesmasters-backend.onrender.com/api/admin",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
