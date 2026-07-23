// src/components/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import {
  FaChartPie,
  FaBullhorn,
  FaUsers,
  FaCreditCard,
  FaShieldAlt,
  FaCircle,
  FaSignOutAlt,
  FaLayerGroup,
} from "react-icons/fa";

import Overview from "./Admin/overview";
import BroadcastTab from "./Admin/BroadcastTab";
import Users from "./Admin/Users";
import PaymentsTab from "./Admin/PaymentsTab"; // âœ… NEW

import ClassGroups from "./Admin/ClassGroups";

const BASE_URL = (import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? "http://localhost:5000" : "https://studiesmasters-backend.onrender.com")).replace(/\/$/, "");

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [notifications, setNotifications] = useState([]);
  const [recentMessage, setRecentMessage] = useState(null);
  const [user, setUser] = useState({}); // âš¡ initialize safely

  // ================= GET USER FROM TOKEN =================
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    console.log("ðŸ“‹ AdminDashboard - Token from localStorage:", token ? "exists" : "missing");
    if (!token) {
      console.warn("âš ï¸ No admin token found");
      navigate("/admin-login", { replace: true });
      return;
    }

    try {
      const decoded = jwtDecode(token); // âš¡ works with Vite
      const expiresAt = decoded.exp ? decoded.exp * 1000 : 0;
      if (!decoded.role || !["MAIN_ADMIN", "MINOR_ADMIN"].includes(decoded.role) || expiresAt <= Date.now()) {
        console.warn("âš ï¸ Admin token invalid or expired", decoded);
        localStorage.removeItem("adminToken");
        navigate("/admin-login", { replace: true });
        return;
      }

      console.log("âœ… Token decoded successfully:", decoded);
      setUser({ _id: decoded.id, role: decoded.role });
    } catch (err) {
      console.error("âŒ Invalid token format or decode error:", err);
      console.error("Token was:", token);
      localStorage.removeItem("adminToken");
      navigate("/admin-login", { replace: true });
    }
  }, [navigate]);

  // ================= SOCKET.IO =================
  useEffect(() => {
    if (!user?._id) return;

    let socket;
    try {
      socket = io(BASE_URL, {
        withCredentials: true,
        query: { userId: user._id },
      });

      socket.on("connect", () => console.log("ðŸŸ¢ Admin connected:", socket.id));

      socket.on("message:new", (data) =>
        addNotification(`New message from ${data.senderName || "Teacher"}`)
      );

      socket.on("broadcast:new", (data) =>
        addNotification(`New broadcast: ${data.subject || "General"}`)
      );

      socket.on("payment:new", (data) =>
        addNotification(`New payment submitted by ${data.studentName}`)
      );

      socket.on("disconnect", () => console.log("ðŸ”Œ Socket disconnected"));
    } catch (err) {
      console.error("âŒ Socket error:", err);
    }

    return () => {
      if (socket) socket.disconnect();
    };
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
      case "payments":
        return <PaymentsTab />;
      case "class-groups":
        return <ClassGroups />;
      default:
        return <Overview />;
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: FaChartPie },
    { id: "broadcast", label: "Broadcasts", icon: FaBullhorn },
    { id: "users", label: "Users", icon: FaUsers },
    { id: "payments", label: "Payments", icon: FaCreditCard },
    { id: "class-groups", label: "Class Groups", icon: FaLayerGroup },
  ];

  // ================= RENDER =================
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 flex-col bg-slate-950 p-5 text-slate-300 lg:flex">
          <div className="flex items-center gap-3 border-b border-slate-800 px-2 pb-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-lg text-white shadow-lg shadow-blue-900/30">
              <FaShieldAlt />
            </span>
            <div>
              <p className="font-bold tracking-tight text-white">StudiesMasters</p>
              <p className="text-xs text-slate-500">Administration portal</p>
            </div>
          </div>

          <p className="mt-7 px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</p>
          <nav className="mt-3 space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                  activeTab === id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                    : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="text-base" />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400"><FaCircle className="text-[8px]" /> Live updates enabled</div>
            <p className="mt-2 text-xs leading-5 text-slate-500">New messages, broadcasts, and payments will appear here in real time.</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Admin workspace</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-slate-500">Manage your learning community from one place.</p>
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700 ring-4 ring-blue-50">
                  {user?.role?.charAt(0)?.toUpperCase() || "A"}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold capitalize text-slate-800">{user?.role || "Administrator"}</p>
                  <p className="text-xs text-slate-500">Secure session</p>
                </div>
              </div>
              <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50">
                <FaSignOutAlt /> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </header>

          <nav className="mb-6 flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm lg:hidden">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${activeTab === id ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                <Icon /> {label}
              </button>
            ))}
          </nav>

          {recentMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900 shadow-sm">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <p className="text-sm font-medium">{recentMessage}</p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}
