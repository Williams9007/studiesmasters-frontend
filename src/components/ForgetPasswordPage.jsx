import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import apiClient from "../utils/apiClient";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export default function ForgetPasswordPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!email) {
        alert("Please enter your email address");
        setLoading(false);
        return;
      }

      const endpoint = role === "teacher" ? "/teachers/forget-password" : "/students/forget-password";
      const response = await apiClient.post(endpoint, { email });

      if (response.status === 200) {
        alert(response.data.message || "✅ Password reset link sent! Check your email.");
        setTimeout(() => navigate("/login"), 1200);
      } else {
        alert(response.data.message || "❌ Failed to send reset link. Try again.");
      }
    } catch (err) {
      console.error("Forget password error:", err);
      alert("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-800 px-4 py-12">
      <motion.div
        className="absolute left-[-80px] top-20 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-64px] top-48 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl"
        animate={{ x: [0, 25, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-10 mx-auto h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative mx-auto w-full max-w-xl overflow-hidden rounded-[32px] border border-white/10 bg-white/95 shadow-2xl backdrop-blur-xl"
      >
        <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 px-8 py-7 text-white">
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/15 text-3xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              🔐
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-semibold text-white">Forgot Password</CardTitle>
              <p className="mt-1 text-sm text-slate-100">Choose your role and enter your email to receive a reset link.</p>
            </div>
          </div>
        </div>

        <CardContent className="px-8 py-8">
          <form onSubmit={handleForgetPassword} className="space-y-6">
            <motion.div
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <label className="block text-sm font-semibold text-slate-700 mb-3">Reset password as</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="border-slate-300 bg-white text-slate-900 shadow-sm">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="border border-slate-200 bg-white shadow-lg">
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            <motion.div
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              <label className="block text-sm font-semibold text-slate-700 mb-3">Email address</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-slate-300 bg-white text-slate-900 shadow-sm"
              />
            </motion.div>

            <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
              <Button
                type="submit"
                className="w-full rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-700 to-sky-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-slate-600/20 transition duration-200 hover:brightness-110"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </motion.div>

            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Remembered your password?</span>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="font-semibold text-slate-900 hover:text-indigo-700"
              >
                Sign in
              </button>
            </div>
          </form>
        </CardContent>
      </motion.div>
    </div>
  );
}

