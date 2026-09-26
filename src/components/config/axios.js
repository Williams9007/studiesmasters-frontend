// frontend/config/axios.js
import axios from "axios";
import { API_BASE_URL } from "../../utils/backendUrl.js";

const api = axios.create({
  // Was hardcoded to "http://localhost:5000/api/admin", so this instance always
  // pointed at the developer's machine in production. Derived now, with the
  // /api/admin suffix preserved.
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
