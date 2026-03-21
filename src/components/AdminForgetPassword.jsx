import { useState } from "react";
import api from "../config/axios";
import { API_URL } from "../config/api";

export default function AdminForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.post(`${API_URL}/api/admin/forgot-password`, { email });
    setMessage(res.data.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-xl w-80 space-y-4"
      >
        <h2 className="text-xl text-white font-bold">Reset Password</h2>

        <input
          type="email"
          placeholder="Admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white"
          required
        />

        <button className="w-full bg-green-600 p-2 rounded text-white">
          Send Reset Link
        </button>

        {message && <p className="text-sm text-green-400">{message}</p>}
      </form>
    </div>
  );
}
