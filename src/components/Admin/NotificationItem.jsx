// src/components/Admin/NotificationItem.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { FaBell } from "react-icons/fa";
import { io } from "socket.io-client";
import { apiClient } from "../../utils/api";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const socketRef = useRef(null);

  const token = localStorage.getItem("adminToken");
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    if (!token) return console.warn("Admin token not found");

    // ================= FETCH EXISTING NOTIFICATIONS =================
    const fetchNotifications = async () => {
      try {
        const res = await apiClient.get("/admin/notifications");
        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error("❌ Error fetching notifications:", err);
      }
    };

    fetchNotifications();

    // ================= SOCKET.IO =================
    const socket = io(BACKEND_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => console.log("🟢 Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("🔌 Socket disconnected"));

    // Listen to new broadcasts in real-time
    socket.on("broadcast:new", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => socket.disconnect();
  }, [token, BACKEND_URL]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id) => {
    try {
      await apiClient.post(`/admin/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("❌ Failed to mark notification as read:", err);
    }
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-gray-200 hover:text-white bg-gray-800 rounded-full"
      >
        <FaBell size={24} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 rounded shadow-lg border border-gray-700 overflow-hidden">
          {notifications.length === 0 ? (
            <p className="p-2 text-sm text-gray-400 text-center">No notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => markAsRead(n._id)}
                className={`p-3 border-b border-gray-700 cursor-pointer ${
                  !n.read ? "bg-gray-700 font-semibold" : ""
                }`}
              >
                <p className="text-sm text-white">{n.message}</p>
                <span className="text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
