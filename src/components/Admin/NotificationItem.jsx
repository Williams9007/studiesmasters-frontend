// src/components/Admin/NotificationItem.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { FaBell, FaCheck, FaTimes, FaInbox } from "react-icons/fa";
import { io } from "socket.io-client";
import apiClient from "../../utils/apiClient";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);

  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) return;

    async function fetchNotifications() {
      try {
        const res = await apiClient.get("/admin/notifications");
        setNotifications(res.data.notifications || []);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    }

    fetchNotifications();

    const socket = io(BASE_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("new-broadcast", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => socket.disconnect();
  }, [token]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id) => {
    try {
      await apiClient.post(`/admin/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(unread.map((n) => apiClient.post(`/admin/notifications/${n._id}/read`)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        title="Notifications"
      >
        <FaBell className="text-base" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white shadow-md shadow-rose-500/30">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                <FaCheck className="text-[10px]" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <FaInbox className="mx-auto mb-2 text-2xl text-slate-300" />
                <p className="text-sm font-medium text-slate-500">No notifications yet</p>
                <p className="text-xs text-slate-400">We'll alert you when something happens.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => markAsRead(n._id)}
                  className={`group relative flex items-start gap-3 p-3.5 transition cursor-pointer ${
                    !n.read ? "bg-blue-50/50 hover:bg-blue-50" : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      !n.read ? "bg-blue-600" : "bg-transparent"
                    }`}
                  />
                  <div className="flex-1 pr-2">
                    <p className={`text-xs sm:text-sm leading-snug ${!n.read ? "font-bold text-slate-900" : "text-slate-600"}`}>
                      {n.message}
                    </p>
                    <span className="mt-1 block text-[11px] text-slate-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

