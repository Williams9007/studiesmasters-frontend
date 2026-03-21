import { useState } from "react";
import api from "./config/api";
import { useNavigate } from "react-router-dom";
import "./admin-auth.css";

export default function AdminVerifyOtp() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const res = await api.post("/admin/verify-otp", {
        adminId,
        otp,
      });

      // ✅ Store token
      localStorage.setItem("adminToken", res.data.token);
      localStorage.removeItem("adminId");

      // ✅ Redirect to dashboard
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
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
