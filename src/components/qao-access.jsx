"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useNavigate } from "react-router-dom";

const BASE_URL = "https://studiesmasters-backend.onrender.com";

function QaoAccess() {
  const [qaoCode, setQaoCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!qaoCode.trim()) {
      setError("⚠️ Please enter your QAO access code.");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${BASE_URL}/api/qao/access`, { qaoCode });

      if (res.data.success) {
        localStorage.setItem("qaoToken", res.data.token);
        localStorage.setItem("qaoUser", JSON.stringify(res.data.user));
        navigate("/qao/dashboard");
      } else {
        setError(res.data.message || "Access denied. Please check your code.");
      }
    } catch (err) {
      console.error("QAO access error:", err);

      // Handle different error scenarios
      if (err.response) {
        // Server responded with a status outside 2xx
        setError(err.response.data.message || "Server error. Please try again.");
      } else if (err.request) {
        // Request was made but no response
        setError("Network error. Please check your internet connection.");
      } else {
        // Something else went wrong
        setError("Unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 w-full max-w-md p-6 bg-white rounded-lg shadow-md"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
          QAO Dashboard Access
        </h2>

        <div className="flex flex-col space-y-2">
          <Label htmlFor="qaoCode">QAO Access Code</Label>
          <Input
            id="qaoCode"
            type="password"
            placeholder="Enter access code"
            value={qaoCode}
            onChange={(e) => setQaoCode(e.target.value)}
            required
            className="focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2 rounded-lg hover:opacity-90 transition"
        >
          {loading ? "Verifying..." : "Access Dashboard"}
        </Button>
      </form>
    </div>
  );
}

export default QaoAccess;
