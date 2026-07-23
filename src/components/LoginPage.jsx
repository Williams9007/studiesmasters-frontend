"use client";

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Turnstile } from "@marsidev/react-turnstile";
import {
  FaArrowLeft,
  FaBookOpen,
  FaChalkboardTeacher,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaUserGraduate,
} from "react-icons/fa";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
// Use the existing Turnstile widget key for this app.
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || "0x4AAAAAADzpUF632s1NjI-d";

export default function LoginPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileError, setTurnstileError] = useState("");
  const turnstileRef = useRef(null);

  const resetTurnstile = () => {
    setTurnstileToken("");
    turnstileRef.current?.reset();
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    
    if (!turnstileToken) {
      setTurnstileError("Please complete the CAPTCHA verification.");
      return;
    }

    setLoading(true);
    setTurnstileError("");

    try {
      const endpoint =
        role === "teacher"
          ? `${BASE_URL}/api/teachers/login`
          : `${BASE_URL}/api/students/login`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ loginId, password, cfTurnstileToken: turnstileToken }),
      });
      const data = await response.json();

      if (!response.ok) {
        // If CAPTCHA token is invalid/expired, reset it
        if (data.message?.toLowerCase().includes("captcha") || data.message?.toLowerCase().includes("turnstile")) {
          resetTurnstile();
        }
        alert(data.message || "Login failed.");
        return;
      }

      localStorage.setItem("token", data.token || "");
      localStorage.setItem("role", role);
      const user = data.user || data.data;

      if (!user?._id) {
        alert(`${role === "teacher" ? "Teacher" : "Student"} data is missing from the server response.`);
        return;
      }

      localStorage.setItem("userId", user._id);
      navigate(role === "teacher" ? `/teacher/dashboard/${user._id}` : "/student/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isStudent = role === "student";
  const roleDetails = isStudent
    ? {
        label: "Student learning portal",
        heading: "Welcome back to your learning journey.",
        description: "Sign in to access your classes, assignments, payments, and progress in one place.",
        Icon: FaUserGraduate,
        color: "blue",
        benefits: ["Live classes", "Expert teachers", "Progress tracking"],
      }
    : {
        label: "Teacher teaching portal",
        heading: "Make every lesson count.",
        description: "Sign in to manage your classes, support learners, and keep their progress moving forward.",
        Icon: FaChalkboardTeacher,
        color: "violet",
        benefits: ["Manage classes", "Support students", "Track learning"],
      };
  const RoleIcon = roleDetails.Icon;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-left"
            aria-label="Return to StudiesMasters home page"
          >
            <FaBookOpen className="text-xl text-blue-600 sm:text-2xl" />
            <span>
              <span className="block text-lg font-bold sm:text-xl">StudiesMasters</span>
              <span className="hidden text-xs text-slate-500 sm:block">Learn. Connect. Succeed.</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            <FaArrowLeft aria-hidden="true" />
            <span className="hidden sm:inline">Back to home</span>
            <span className="sm:hidden">Back</span>
          </button>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-2 lg:gap-16 lg:py-16">
        <section className="order-2 overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-14 lg:order-1">
          <div className="relative z-10">
          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${isStudent ? "bg-blue-500/20 text-blue-200" : "bg-violet-500/20 text-violet-200"}`}>
            <RoleIcon aria-hidden="true" />
            {roleDetails.label}
          </span>
          <h1 className="mt-5 max-w-xl text-4xl font-bold leading-tight sm:text-5xl">
            {roleDetails.heading}
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
            {roleDetails.description}
          </p>
          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-3">
            {roleDetails.benefits.map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm">
                {item}
              </div>
            ))}
          </div>
          <div className="relative mt-10 h-28 sm:h-32" aria-hidden="true">
            <div className={`auth-orbit absolute left-4 top-5 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl shadow-xl ${isStudent ? "bg-blue-500" : "bg-violet-500"}`}><RoleIcon /></div>
            <div className="auth-float absolute left-[42%] top-0 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 text-slate-900 shadow-xl"><FaBookOpen /></div>
            <div className={`auth-float-delayed absolute right-4 top-10 flex h-14 w-14 items-center justify-center rounded-2xl text-xl shadow-xl ${isStudent ? "bg-cyan-400 text-cyan-950" : "bg-fuchsia-400 text-fuchsia-950"}`}><FaLock /></div>
            <div className="absolute bottom-3 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          </div>
          </div>
          <div className={`auth-glow auth-glow-one ${isStudent ? "bg-blue-500" : "bg-violet-500"}`} aria-hidden="true" />
          <div className={`auth-glow auth-glow-two ${isStudent ? "bg-cyan-400" : "bg-fuchsia-400"}`} aria-hidden="true" />
        </section>

        <Card className="order-1 w-full border border-slate-200 bg-white shadow-xl lg:order-2">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-7">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg ${isStudent ? "bg-blue-600 shadow-blue-200" : "bg-violet-600 shadow-violet-200"}`}>
                <FaLock aria-hidden="true" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
              <p className="mt-1 text-sm text-slate-500">Choose your portal, then use your registered account details.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <span id="role-label" className="mb-1.5 block text-sm font-semibold text-slate-700">I am signing in as</span>
                <div role="group" aria-labelledby="role-label" className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1.5">
                  <button type="button" onClick={() => setRole("student")} className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-2 text-sm font-bold transition-all duration-300 ${isStudent ? "bg-white text-blue-700 shadow-md" : "text-slate-500 hover:text-slate-800"}`} aria-pressed={isStudent}><FaUserGraduate /> Student</button>
                  <button type="button" onClick={() => setRole("teacher")} className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-2 text-sm font-bold transition-all duration-300 ${!isStudent ? "bg-white text-violet-700 shadow-md" : "text-slate-500 hover:text-slate-800"}`} aria-pressed={!isStudent}><FaChalkboardTeacher /> Teacher</button>
                </div>
              </div>

              <div>
                <label htmlFor="login-id" className="mb-1.5 block text-sm font-semibold text-slate-700">Email address or User ID</label>
                <Input id="login-id" type="text" autoComplete="username" placeholder="you@example.com or SM-ST-..." value={loginId} onChange={(event) => setLoginId(event.target.value)} className="h-11 border-slate-300 focus:ring-blue-600" required />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700">Password</label>
                  <button type="button" onClick={() => navigate("/forget-password")} className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline">Forgot password?</button>
                </div>
                <div className="relative">
                  <Input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 border-slate-300 pr-12 focus:ring-blue-600" required />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                    {showPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {/* Cloudflare Turnstile CAPTCHA */}
              <div className="pt-2">
                <Turnstile
                    ref={turnstileRef}
                    siteKey={TURNSTILE_SITE_KEY}
                    onSuccess={(token) => {
                      setTurnstileToken(token);
                      setTurnstileError("");
                    }}
                    onError={(errorCode) => {
                      setTurnstileToken("");
                      setTurnstileError(
                        errorCode === "110200"
                          ? "CAPTCHA is not authorized for this domain. Please open the app in a browser tab or contact support."
                          : "CAPTCHA verification failed. Please try again."
                      );
                      return true;
                    }}
                    onExpire={() => {
                      setTurnstileToken("");
                      setTurnstileError("CAPTCHA expired. Please verify again.");
                    }}
                    options={{ action: "login", theme: "light", size: "flexible" }}
                  />
                {turnstileError && (
                  <p className="mt-2 text-center text-sm text-red-600" role="alert">
                    {turnstileError}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={loading} className={`h-12 w-full rounded-xl font-semibold text-white ${isStudent ? "bg-blue-600 hover:bg-blue-700" : "bg-violet-600 hover:bg-violet-700"}`}>
                {loading ? "Signing in..." : "Sign in to StudiesMasters"}
              </Button>
            </form>

          </CardContent>
        </Card>
      </main>
    </div>
  );
}
