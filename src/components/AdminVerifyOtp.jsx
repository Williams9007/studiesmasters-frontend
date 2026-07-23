// src/components/AdminVerifyOtp.jsx
import { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./admin-auth.css";

export default function AdminVerifyOtp() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isTokenValid = (token) => {
    if (!token) return false;
    try {
      const decoded = jwtDecode(token);
      const expiresAt = decoded.exp ? decoded.exp * 1000 : 0;
      return decoded.role && ["MAIN_ADMIN", "MINOR_ADMIN"].includes(decoded.role) && expiresAt > Date.now();
    } catch (err) {
      return false;
    }
  };

  // ✅ Auto-redirect only if admin token is valid
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    if (isTokenValid(token)) {
      navigate("/admin/dashboard", { replace: true });
    } else {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminRole");
      localStorage.removeItem("adminId");
    }
  }, [navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const adminId = localStorage.getItem("adminId");
    if (!adminId) {
      setError("Session expired. Please login again.");
      setLoading(false);
      return;
    }

    try {
      console.log("📤 Sending OTP verification request...");
      const res = await apiClient.post("/admin/verify-otp", {
        adminId,
        otp,
      });

      console.log("✅ OTP verification response:", res.data);

      // ✅ Store token securely
      const token = res.data.token;
      if (!token) {
        console.error("❌ No token in response:", res.data);
        setError("No token received from server. Response: " + JSON.stringify(res.data));
        setLoading(false);
        return;
      }

      console.log("💾 Storing token in localStorage...");
      localStorage.setItem("adminToken", token);
      localStorage.setItem("adminRole", res.data.role || "admin");
      localStorage.removeItem("adminId");
      
      console.log("✅ Token and role stored");
      console.log("📍 adminToken exists:", !!localStorage.getItem("adminToken"));
      console.log("📍 adminRole exists:", !!localStorage.getItem("adminRole"));

      console.log("🔄 Navigating to dashboard...");
      
      // ✅ Redirect to dashboard
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      console.error("❌ OTP verification failed");
      console.error("Error response:", err.response?.data);
      console.error("Full error:", err);
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <form className="auth-card" onSubmit={handleVerify}>
        <h2>OTP Verification</h2>
        <p className="auth-subtitle">
          Enter the 6-digit code sent to your email
        </p>

        {error && <div className="auth-error">{error}</div>}

        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          maxLength={6}
          required
        />

        <button disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>
    </div>
  );
}
