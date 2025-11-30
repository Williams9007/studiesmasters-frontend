"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const BASE_URL = "https://studiesmasters-backend.onrender.com";

export default function LoginPage() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

const handleLogin = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const endpoint =
      role === "teacher"
        ? `${BASE_URL}/api/teachers/login`
        : `${BASE_URL}/api/students/login`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Login failed.");
      setLoading(false);
      return;
    }

    // Save common info
    localStorage.setItem("token", data.token || "");
    localStorage.setItem("role", role);

    // Handle teacher login
    if (role === "teacher") {
      const teacher = data.user || data.data;
      if (!teacher?._id) {
        alert("Teacher data missing from server response.");
        setLoading(false);
        return;
      }
      localStorage.setItem("userId", teacher._id);
      navigate(`/teacher/dashboard/${teacher._id}`);
      return;
    }

    // Handle student login
    const student = data.user || data.data;
    if (!student?._id) {
      alert("Student data missing from server response.");
      setLoading(false);
      return;
    }

    localStorage.setItem("userId", student._id);
    
    // ✅ Navigate to dashboard WITHOUT ID
    navigate(`/student/dashboard`);
  } catch (err) {
    console.error("Login error:", err);
    alert("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
};


  const handleForgotPassword = () => {
    navigate("/forget-password");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/90 backdrop-blur-md rounded-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            EduConnect Login
          </CardTitle>
          <p className="text-sm text-gray-500 mt-1">Welcome back! Please log in</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Role Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Login as
              </label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus:ring-2 focus:ring-blue-500"
                required
              />
              <p
                className="text-sm text-blue-600 mt-1 cursor-pointer hover:underline"
                onClick={handleForgotPassword}
              >
                Forget Password?
              </p>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2 rounded-lg shadow-md hover:opacity-90 transition"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
