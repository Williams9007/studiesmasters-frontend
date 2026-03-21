// src/components/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { io } from "socket.io-client";

import Overview from "./Admin/overview";
import BroadcastTab from "./Admin/BroadcastTab";
import Users from "./Admin/Users";
import PaymentsTab from "./Admin/PaymentsTab"; // ✅ NEW

const BASE_URL = "http://localhost:5000";

export default function AdminDashboard({ user = {}, onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [notifications, setNotifications] = useState([]);
  const [recentMessage, setRecentMessage] = useState(null);

  // ================= SOCKET.IO =================
  useEffect(() => {
    if (!user?._id) return;

    const socket = io(BASE_URL, {
      withCredentials: true,
      query: { userId: user._id },
    });

    socket.on("connect", () => {
      console.log("🟢 Admin connected:", socket.id);
    });

    socket.on("message:new", (data) => {
      addNotification(
        `New message from ${data.senderName || "Teacher"}`
      );
    });

    socket.on("broadcast:new", (data) => {
      addNotification(
        `New broadcast: ${data.subject || "General"}`
      );
    });

    // ✅ NEW PAYMENT EVENT
    socket.on("payment:new", (data) => {
      addNotification(
        `New payment submitted by ${data.studentName}`
      );
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
    });

    return () => socket.disconnect();
  }, [user?._id]);

  // ================= NOTIFICATIONS =================
  const addNotification = (message) => {
    const note = {
      id: Date.now(),
      message,
      time: new Date().toLocaleTimeString(),
    };

    setNotifications((prev) => [note, ...prev]);
    setRecentMessage(message);

    setTimeout(() => setRecentMessage(null), 5000);
  };

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    if (onLogout) onLogout();
    window.location.href = "/admin-login";
  };

  // ================= TAB RENDERING =================
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <Overview />;
      case "broadcast":
        return <BroadcastTab />;
      case "users":
        return <Users />;
      case "payments": // ✅ NEW
        return <PaymentsTab />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">

      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="font-bold">
              {user?.name?.charAt(0) || "A"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="flex gap-4 mb-6 border-b border-gray-700 pb-4">
        {["overview", "broadcast", "users", "payments"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded capitalize transition ${
              activeTab === tab
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ================= REAL-TIME BANNER ================= */}
      {recentMessage && (
        <div className="mb-4 w-fit bg-green-500 text-black px-6 py-2 rounded-xl shadow">
          <p className="text-sm font-medium">{recentMessage}</p>
        </div>
      )}

      {/* ================= MAIN CONTENT ================= */}
      <div>{renderContent()}</div>
    </div>
  );
}
