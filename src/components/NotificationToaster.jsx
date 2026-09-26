import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  MessageSquare,
  Radio,
  X,
} from "lucide-react";
import { BACKEND_URL } from "../utils/backendUrl.js";

const SOCKET_URL = (import.meta.env.VITE_API_URL || BACKEND_URL).replace(/\/$/, "");
const MAX_TOASTS = 4;
const DISMISS_MS = 6500;

const EVENT_TITLES = {
  "notification:new": "Notification",
  "broadcast:new": "New announcement",
  "new-broadcast": "New announcement",
  "message:new": "New message",
  "payment:new": "Payment update",
  "payment:confirmed": "Payment confirmed",
  "timetable:published": "Timetable published",
  "timetable:reviewed": "Timetable reviewed",
  "timetable:submitted": "Timetable submitted",
  "class:created": "New class scheduled",
  "class:upcoming": "Upcoming class",
  "class:starting": "Class reminder",
  "class:live": "Class is live",
  "class:ended": "Class ended",
  "class:cancelled": "Class cancelled",
  "meeting:updated": "Class link updated",
  "teacher:overloaded": "Workload alert",
  "meeting:generated": "Meeting ready",
  "meeting:failed": "Meeting issue",
};

const ROUTES_BY_ROLE = {
  admin: "/admin/dashboard",
  qao: "/qao/dashboard",
  student: "/student/dashboard",
};

function parseStoredJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function decodeToken(token) {
  if (!token) return null;
  try {
    return jwtDecode(token);
  } catch {
    return null;
  }
}

function currentIdentity() {
  if (typeof window === "undefined") return null;

  const adminToken = localStorage.getItem("adminToken");
  const qaoToken = localStorage.getItem("qaoToken");
  const userToken = localStorage.getItem("token");

  if (adminToken) {
    const decoded = decodeToken(adminToken);
    const id = localStorage.getItem("adminId") || decoded?.id || decoded?._id || decoded?.adminId;
    return id ? { userId: String(id), role: "admin", token: adminToken } : null;
  }

  if (qaoToken) {
    const decoded = decodeToken(qaoToken);
    const qaoUser = parseStoredJson("qaoUser");
    const id = qaoUser?._id || qaoUser?.id || decoded?.id || decoded?._id || decoded?.userId;
    return id ? { userId: String(id), role: "qao", token: qaoToken } : null;
  }

  if (userToken) {
    const decoded = decodeToken(userToken);
    const id = localStorage.getItem("userId") || decoded?.id || decoded?._id || decoded?.userId;
    const path = window.location.hash || window.location.pathname;
    const role = String(localStorage.getItem("role") || decoded?.role || "").toLowerCase()
      || (path.includes("/teacher/") ? "teacher" : "student");
    return id && ["student", "teacher", "qao", "admin"].includes(role)
      ? { userId: String(id), role, token: userToken }
      : null;
  }

  return null;
}

function normalisePayload(eventName, payload = {}) {
  const raw = payload || {};
  const title = raw.title || raw.subject || EVENT_TITLES[eventName] || "StudiesMasters";
  const message =
    raw.message ||
    raw.body ||
    raw.content ||
    raw.reason ||
    [raw.classGroup || raw.subject || raw.groupCode, raw.date ? new Date(raw.date).toLocaleDateString() : ""]
      .filter(Boolean)
      .join(" - ") ||
    "You have a new update.";

  return {
    id: `${eventName}-${raw.notificationId || raw._id || raw.id || Date.now()}-${Math.random()}`,
    eventName,
    type: raw.type || eventName,
    title,
    message,
    url: raw.url || raw.link || null,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

function iconFor(type = "") {
  const value = String(type).toLowerCase();
  if (value.includes("class") || value.includes("timetable") || value.includes("meeting")) return CalendarClock;
  if (value.includes("broadcast") || value.includes("message")) return MessageSquare;
  if (value.includes("payment") || value.includes("confirmed")) return CheckCircle2;
  if (value.includes("warning") || value.includes("alert") || value.includes("failed") || value.includes("overloaded")) return AlertTriangle;
  if (value.includes("live")) return Radio;
  if (value.includes("student") || value.includes("teacher")) return BookOpen;
  return Bell;
}

function routeFor(identity, toast) {
  if (toast.url) return toast.url;
  if (identity?.role === "teacher") return `/teacher/dashboard/${identity.userId}`;
  return ROUTES_BY_ROLE[identity?.role] || "/";
}

function openToastDestination(destination, navigate) {
  if (!destination) return;
  if (/^https?:\/\//i.test(destination)) {
    window.open(destination, "_blank", "noopener,noreferrer");
    return;
  }
  if (destination.startsWith("/#/")) {
    navigate(destination.slice(2));
    return;
  }
  navigate(destination);
}

export default function NotificationToaster() {
  const [toasts, setToasts] = useState([]);
  const [identity, setIdentity] = useState(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const addToast = useCallback((eventName, payload) => {
    const next = normalisePayload(eventName, payload);
    setToasts((current) => [next, ...current].slice(0, MAX_TOASTS));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== next.id));
    }, DISMISS_MS);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    const update = () => setIdentity(currentIdentity());
    update();
    window.addEventListener("storage", update);
    window.addEventListener("focus", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("focus", update);
    };
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!identity?.userId || !identity?.role) return undefined;

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: { userId: identity.userId, role: identity.role, token: identity.token },
      query: { userId: identity.userId, role: identity.role },
    });
    socketRef.current = socket;

    const join = () => socket.emit(`${identity.role}-join`, identity.userId);
    socket.on("connect", join);
    if (socket.connected) join();

    const events = Object.keys(EVENT_TITLES);
    events.forEach((eventName) => socket.on(eventName, (payload) => addToast(eventName, payload)));

    return () => {
      events.forEach((eventName) => socket.off(eventName));
      socket.off("connect", join);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [identity?.userId, identity?.role, identity?.token, addToast]);

  const visibleToasts = useMemo(() => toasts, [toasts]);

  if (!visibleToasts.length) return null;

  return (
    <div className="notification-toast-stack" aria-live="polite" aria-atomic="false">
      {visibleToasts.map((toast) => {
        const Icon = iconFor(toast.type || toast.eventName);
        return (
          <div key={toast.id} className={`notification-toast notification-toast-${toast.type || "info"}`}>
            <button
              type="button"
              className="notification-toast-main"
              onClick={() => {
                removeToast(toast.id);
                openToastDestination(routeFor(identity, toast), navigate);
              }}
            >
              <span className="notification-toast-icon">
                <Icon size={18} />
              </span>
              <span className="notification-toast-copy">
                <span className="notification-toast-title">{toast.title}</span>
                <span className="notification-toast-message">{toast.message}</span>
              </span>
            </button>
            <button
              type="button"
              className="notification-toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
