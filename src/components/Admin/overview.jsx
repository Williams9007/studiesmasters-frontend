// src/components/Admin/Overview.jsx
"use client";

import { useEffect, useState, useRef } from "react";
import apiClient from "../../utils/apiClient";
import StatCard from "./StatCard";
import AlertCard from "./AlertCard";
import NotificationBell from "./NotificationItem";
import BroadcastTab from "./BroadcastTab";
import { io } from "socket.io-client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { FaHistory, FaChartLine, FaUsers } from "react-icons/fa";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function Overview() {
  const [students, setStudents] = useState(0);
  const [teachers, setTeachers] = useState(0);
  const [qaoUsers, setQaoUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [error, setError] = useState("");
  const [broadcastLogs, setBroadcastLogs] = useState([]);
  const socketRef = useRef(null);

  const token = localStorage.getItem("adminToken");

  // Fetch overview data
  const fetchOverview = async () => {
    if (!token) return setError("Admin token not found. Please login.");

    try {
      const studentRes = await apiClient.get("/admin/students");
      setStudents(studentRes.data.totalStudents || 0);

      const teacherRes = await apiClient.get("/admin/teachers");
      setTeachers(teacherRes.data.totalTeachers || 0);

      const qaoRes = await apiClient.get("/admin/qao-users");
      setQaoUsers(qaoRes.data.qaoUsers || []);

      const paymentRes = await apiClient.get("/payments/admin/history");
      setPayments(paymentRes.data.payments || []);
      setTotalPayments(paymentRes.data.totalAmount || 0);
    } catch (err) {
      console.error("Error fetching overview data:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to fetch overview data"
      );
    }
  };

  // Initialize on mount
  useEffect(() => {
    fetchOverview();

    if (!token) return;

    const socket = io(BASE_URL, { auth: { token, role: "admin" } });
    socketRef.current = socket;

    socket.on("connect", () => console.log("Admin socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Admin socket disconnected"));

    // Live broadcast updates
    socket.on("broadcast-sent", (broadcast) => {
      setBroadcastLogs((prev) => [broadcast, ...prev]);
    });

    return () => socket.disconnect();
  }, [token]);

  // Pie chart data
  const userData = [
    { name: "Students", value: students },
    { name: "Teachers", value: teachers },
    { name: "Tutor Managers", value: qaoUsers.length },
  ];
  const PIE_COLORS = ["#3b82f6", "#10b981", "#8b5cf6"];

  // Bar chart data
  const paymentByGrade = payments.reduce((acc, p) => {
    const grade = p.grade || "Unknown";
    if (!acc[grade]) acc[grade] = 0;
    acc[grade] += p.amount;
    return acc;
  }, {});
  const barData = Object.keys(paymentByGrade).map((grade) => ({
    grade,
    amount: paymentByGrade[grade],
  }));
  const BAR_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Platform Overview</h2>
          <p className="text-sm text-slate-500">Real-time metrics, user statistics and financial activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
        </div>
      </div>

      {error && <AlertCard type="error" message={error} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={students} subtext="Active learners enrolled" />
        <StatCard title="Total Teachers" value={teachers} subtext="Verified educators" />
        <StatCard title="Total Tutor Managers" value={qaoUsers.length} subtext="Quality assurance team" />
        <StatCard title="Total Payments (GHS)" value={totalPayments} subtext="Lifetime revenue" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FaUsers />
              </span>
              <h3 className="font-bold text-slate-900 text-base">User Distribution</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">Live stats</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={userData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={4}
              >
                {userData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <FaChartLine />
              </span>
              <h3 className="font-bold text-slate-900 text-base">Payments by Grade</h3>
            </div>
            <span className="text-xs font-semibold text-slate-400">Revenue breakdown</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="grade" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "0.75rem",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                }}
              />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {barData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={BAR_COLORS[index % BAR_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Broadcast Tab section */}
      <div className="mt-8">
        <BroadcastTab />
      </div>

      {/* Live Broadcast Logs */}
      {broadcastLogs.length > 0 && (
        <div className="rounded-2xl border border-slate-200/80 bg-slate-900 text-slate-100 p-6 shadow-md max-h-72 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <FaHistory className="text-blue-400 text-lg" />
            <h3 className="font-bold text-base text-white">Live Broadcast Activity</h3>
          </div>
          <div className="space-y-3">
            {broadcastLogs.map((b, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 transition hover:border-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-blue-300">{b.subject}</span>
                  <small className="text-[11px] text-slate-400">{new Date(b.createdAt).toLocaleString()}</small>
                </div>
                <p className="mt-1 text-sm text-slate-300">{b.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

