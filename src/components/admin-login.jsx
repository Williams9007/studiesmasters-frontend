import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "", adminCode: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Submit login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { email, password } = formData; // ignore adminCode for now
      const res = await axios.post("https://studiesmasters-backend.onrender.com", { email, password });

      const { token, admin } = res.data;

      localStorage.setItem("adminToken", token);
      localStorage.setItem("role", "admin"); // fixed role
      localStorage.setItem("userId", admin.id);

      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-700 p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Card className="w-[380px] bg-white/10 backdrop-blur-md text-blue shadow-2xl border border-gray-600">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <ShieldCheck className="w-12 h-12 text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <p className="text-gray-300 text-sm mt-1">Enter your credentials to access the dashboard</p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Email</label>
                <Input
                  type="email"
                  name="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gray-800 text-black border-gray-700"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Password</label>
                <Input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-gray-800 text-black border-gray-700"
                  required
                />
              </div>

              {/* Optional: adminCode */}
              <div>
                <label className="block text-sm mb-1">Admin Code</label>
                <Input
                  type="text"
                  name="adminCode"
                  placeholder="EDU-ADMIN-001"
                  value={formData.adminCode}
                  onChange={handleChange}
                  className="bg-gray-800 text-black border-gray-700"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 text-white mt-3"
              >
                {loading ? "Logging in..." : "Login as Admin"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
