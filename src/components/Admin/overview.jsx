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
    { name: "QAO Users", value: qaoUsers.length },
  ];
  const PIE_COLORS = ["#8884d8", "#82ca9d", "#ffc658"];

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
  const BAR_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#a569bd"];

  return (
    <div className="overview-container p-4 space-y-6 relative">
      <NotificationBell />

      {error && <AlertCard type="error" message={error} />}

      <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={students} />
        <StatCard title="Total Teachers" value={teachers} />
        <StatCard title="Total QAO Users" value={qaoUsers.length} />
        <StatCard title="Total Payments (GHS)" value={totalPayments} />
      </div>

      {/* Charts */}
      <div className="charts-grid grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="pie-chart bg-black p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2 text-center">User Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {userData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bar-chart bg-black p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2 text-center">Payments by Grade</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="amount">
                {barData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={BAR_COLORS[index % BAR_COLORS.length]}
                    stroke="#000"
                    strokeWidth={0.5}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6">
        <BroadcastTab />
      </div>

      {broadcastLogs.length > 0 && (
        <div className="mt-4 bg-black-100 p-3 rounded shadow max-h-64 overflow-y-auto">
          <h3 className="font-semibold mb-2">Live Broadcast Logs</h3>
          {broadcastLogs.map((b, i) => (
            <div key={i} className="p-2 border-b border-black-300">
              <p><strong>{b.subject}</strong></p>
              <p>{b.message}</p>
              <small className="text-black-500">{new Date(b.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
