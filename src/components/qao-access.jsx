"use client";

import { useState } from "react";
import apiClient from "../utils/apiClient";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function TutorManagerAccess() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("⚠️ Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.post("/qao/access", {
        email: email.trim(),
        password: password.trim(),
      });

      if (res.data.success) {
        localStorage.setItem("qaoToken", res.data.token);
        localStorage.setItem("qaoUser", JSON.stringify(res.data.user));
        navigate("/qao/dashboard");
      } else {
        setError(res.data.message || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Tutor Manager login error:", err);

      if (err.response) {
        setError(err.response.data.message || "Server error. Please try again.");
      } else if (err.request) {
        setError("Network error. Please check your internet connection.");
      } else {
        setError("Unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-slate-50 to-violet-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-10 top-24 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />
      <motion.div
        className="relative mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-6"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-violet-700">Tutor Manager Access</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Secure dashboard login</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Sign in to manage teachers, approve learning content, and stay on top of daily operations.</p>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="relative w-full rounded-[2rem] border border-white/80 bg-white/95 p-8 shadow-2xl shadow-slate-200/50 backdrop-blur-xl sm:p-10"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <div className="absolute left-4 top-4 h-20 w-20 rounded-full bg-violet-100/80 blur-2xl" />
          <div className="absolute right-6 bottom-6 h-16 w-16 rounded-full bg-sky-100/80 blur-2xl" />

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">Welcome back</h2>
              <p className="mt-2 text-sm text-slate-600">Enter your credentials to continue to the Tutor Manager workspace.</p>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-3xl border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-3xl border-slate-200 bg-white px-4 py-3 text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-3xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm text-red-700">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-white shadow-lg shadow-violet-300/30 transition hover:brightness-110"
            >
              {loading ? "Signing in..." : "Login to Dashboard"}
            </Button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}

export default TutorManagerAccess;
