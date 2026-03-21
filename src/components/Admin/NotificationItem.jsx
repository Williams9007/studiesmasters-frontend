// src/components/Admin/NotificationItem.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { FaBell } from "react-icons/fa";
import { io } from "socket.io-client";
import apiClient from "../../utils/apiClient";

const BASE_URL = "https://studiesmasters-backend.onrender.com";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await apiClient.get("/admin/notifications");
        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();

    // Socket for real-time updates
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    const socket = io(BASE_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect", () => console.log("Socket connected:", socket.id));
    socket.on("disconnect", () => console.log("Socket disconnected"));

    socket.on("new-broadcast", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id) => {
    try {
      await apiClient.post(`/admin/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  return (
    <div className="absolute right-4 top-2 z-50">
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
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 rounded shadow-lg">
          {notifications.length === 0 && <p className="p-2 text-sm text-gray-400">No notifications</p>}
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => markAsRead(n._id)}
              className={`p-3 border-b border-gray-700 cursor-pointer ${!n.read ? "bg-gray-700 font-bold" : ""}`}
            >
              <p className="text-sm text-white">{n.message}</p>
              <span className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
