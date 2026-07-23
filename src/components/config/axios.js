// frontend/config/axios.js
import axios from "axios";

const api = axios.create({
<<<<<<< HEAD
  baseURL: "http://localhost:5000/api/admin", // ✅ base points to /api/admin
=======
  baseURL: "https://studiesmasters-backend.onrender.com/api/admin",
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
