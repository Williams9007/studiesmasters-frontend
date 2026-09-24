"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { BookOpen, User, Bell, CheckCircle, Send, LogOut, PlayCircle, ArrowUpRight, CalendarDays, Unlink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { FaUsers } from "react-icons/fa";

const BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
const MOODLE_PORTAL_URL = import.meta.env.VITE_MOODLE_PORTAL_URL || "https://lms.studiesmasters.com/";

// Timetable calendar helpers (the "My timetable" card on the Overview tab).
const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
// ClassSession.date is stored as UTC midnight for the intended calendar day.
// Read UTC parts here so browsers behind UTC do not display the class one day early.
const sessionDateParts = (value) => {
  const d = new Date(value);
  return [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()];
};
const dayNameOf = (value) => {
  const [year, month, day] = sessionDateParts(value);
  return WEEK_DAYS[(new Date(Date.UTC(year, month, day)).getUTCDay() + 6) % 7];
};
const formatTimetableDay = (value) => {
  const [year, month, day] = sessionDateParts(value);
  return new Date(Date.UTC(year, month, day)).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
};
const sameDay = (a, b) => {
  const d1 = sessionDateParts(a);
  const d2 = sessionDateParts(b);
  return d1[0] === d2[0] && d1[1] === d2[1] && d1[2] === d2[2];
};

export function TeacherDashboard({ user = {}, onLogout }) {
  const navigate = useNavigate();
  const { id: routeTeacherId } = useParams();
  const teacherId = routeTeacherId || user._id || localStorage.getItem("userId");
  const [token, setToken] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);

  const [notifications, setNotifications] = useState([]);
  const [timetable, setTimetable] = useState(null); // null = loading, [] = no classes this week
  const [performance, setPerformance] = useState([]);
  const [messagesSub, setMessagesSub] = useState("inbox"); // sub-tab: inbox | broadcasts
  const [syncingMoodle, setSyncingMoodle] = useState(false);
  const [moodleSyncMsg, setMoodleSyncMsg] = useState("");
  // Guards the AUTOMATIC Moodle push: the dashboard load and every timetable
  // refresh both trigger a sync, so this prevents overlapping requests.
  const moodleSyncRef = useRef(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentMessage, setRecentMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replies, setReplies] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcasts, setBroadcasts] = useState([]);
    const [resources, setResources] = useState([]);
    const [newResource, setNewResource] = useState({ title: "", description: "", fileUrl: "", subject: "", curriculum: "", classGroupId: "" });
    const [sending, setSending] = useState(false);
    const [activities, setActivities] = useState([]);
    const [activeTab, setActiveTab] = useState("overview");
    const [classGroups, setClassGroups] = useState([]);
    // Uploaded-timetable records (file-based flow: teacher submits → Tutor
    // Manager reviews → teacher + students are notified).
    const [timetableRecords, setTimetableRecords] = useState([]);
    const [newTimetable, setNewTimetable] = useState({ subjectId: "", classLevel: "", fileUrl: "", fileName: "" });
    const [submittingTimetable, setSubmittingTimetable] = useState(false);
  const [googleStatus, setGoogleStatus] = useState({ connected: false, loading: true });
  const [googleActionLoading, setGoogleActionLoading] = useState(false);
  const [googleMessage, setGoogleMessage] = useState("");
  const displayTeacher = teacherProfile || user;

  const readJson = async (response) => {
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) throw new Error("The server returned a non-JSON response.");
    return response.json();
  };

  const fetchGoogleStatus = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/google/teacher/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readJson(res);
      setGoogleStatus({ ...(data.data || {}), loading: false });
    } catch (error) {
      setGoogleStatus({ connected: false, loading: false, error: error.message });
    }
  };

  const connectGoogle = async () => {
    setGoogleActionLoading(true);
    setGoogleMessage("");
    try {
      const res = await fetch(`${BASE_URL}/api/google/teacher/connect`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readJson(res);
      if (data.consentUrl) {
        window.open(data.consentUrl, "_blank", "noopener,noreferrer");
        setGoogleMessage("Complete Google sign-in in the new tab, then return here.");
      } else {
        setGoogleMessage(data.message || "Google account is already connected.");
        await fetchGoogleStatus();
      }
    } catch (error) {
      setGoogleMessage(error.response?.data?.message || "Unable to start Google connection.");
    } finally {
      setGoogleActionLoading(false);
    }
  };

  const disconnectGoogle = async () => {
    setGoogleActionLoading(true);
    setGoogleMessage("");
    try {
      const res = await fetch(`${BASE_URL}/api/google/teacher/disconnect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readJson(res);
      setGoogleMessage(data.message || "Google account disconnected.");
      setGoogleStatus({ connected: false, loading: false });
    } catch (error) {
      setGoogleMessage(error.response?.data?.message || "Unable to disconnect Google account.");
    } finally {
      setGoogleActionLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") setToken(localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    if (!token) return;
    fetchGoogleStatus();
  }, [token]);

  useEffect(() => {
    if (!teacherId || !token) return;
    fetch(`${BASE_URL}/api/teachers/dashboard/${teacherId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(readJson)
      .then((data) => setTeacherProfile(data.user || null))
      .catch((error) => console.error("Unable to load teacher profile:", error));
  }, [teacherId, token]);

  useEffect(() => {
    if (!teacherId || !token) return;
    addNotification(`Welcome back, ${displayTeacher.fullName || displayTeacher.name || "Teacher"}! 👋`);
    fetchSubjects();
    fetchBroadcasts();
    fetchStudents();
    fetchResources();
    fetchClassGroups();
    fetchMessages();
    fetchNotifications();
    fetchTimetable();
    fetchTimetableRecords();
    fetchPerformance();
  }, [teacherId, token]);

  useEffect(() => {
    if (!teacherId) return;
    const socket = io(BASE_URL, {
      withCredentials: true,
      query: { userId: teacherId, role: "teacher" },
      auth: { userId: teacherId, role: "teacher" },
    });
    // Join the teacher rooms (teacher:{id} + "teachers") so server-side
    // notifications are delivered live. server.js also auto-joins from the
    // handshake role, so this is belt-and-braces.
    socket.emit("teacher-join", teacherId);
    socket.on("connect", () => console.log("🟢 Connected to socket:", socket.id));
    socket.on("message:new", (data) => {
      setMessages(prev => [data, ...prev]);
      setActivities(prev => [{ type: "message", message: data.content || data.message, time: new Date().toLocaleString() }, ...prev]);
      addNotification("New message received 📩");
    });
    socket.on("disconnect", () => console.log("🔌 Socket disconnected"));
    // Durable notifications + timetable lifecycle events from the backend.
    // The raw payload is forwarded so per-item Mark as read / Dismiss keeps
    // the real notification id.
    const onServerNotification = (payload, fallbackTitle) => {
      if (!payload) return;
      const title = payload.title || fallbackTitle;
      const body = payload.message
        || `${payload.subject || payload.classGroup || "Class"}${payload.date ? ` on ${new Date(payload.date).toLocaleDateString()}` : ""}`;
      pushServerNotification(title ? `${title}: ${body}` : body, payload.createdAt || payload.time, payload);
    };

    // Bell entry + live timetable refresh: when a timetable is fed in for this
    // teacher (single class or a whole generated term), re-fetch the week so the
    // "My timetable" calendar updates without a manual reload.
    const onTimetableEvent = (payload, fallbackTitle) => {
      onServerNotification(payload, fallbackTitle);
      fetchTimetable(); // fetchTimetable now auto-syncs to Moodle
    };

    socket.on("notification:new", (payload) => onServerNotification(payload, "Notification"));
    socket.on("timetable:published", (payload) => onTimetableEvent(payload, "Timetable published"));
    socket.on("timetable:reviewed", (payload) => onServerNotification(payload, "Timetable review"));
    socket.on("timetable:submitted", (payload) => onServerNotification(payload, "Timetable submitted"));
    socket.on("class:created", (payload) => onTimetableEvent(payload, "New Class Scheduled"));
    socket.on("class:upcoming", (payload) => onTimetableEvent(payload, "Upcoming class"));
    socket.on("class:starting", (payload) => onServerNotification(payload, "Class reminder"));
    socket.on("class:live", (payload) => onServerNotification(payload, "Class is live"));
    socket.on("class:ended", (payload) => onTimetableEvent(payload, "Class ended"));
    socket.on("class:cancelled", (payload) => onTimetableEvent(payload, "Class cancelled"));
    socket.on("teacher:overloaded", (payload) => onServerNotification(payload, "Workload alert"));

    return () => socket.disconnect();
  }, [teacherId]);

  const fetchSubjects = async () => {
    if (!teacherId || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/${teacherId}/subjects`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await readJson(res);
      setSubjects(data || []);
    } catch (err) { console.error(err); }
  };

  const fetchStudents = async () => {
    if (!teacherId || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/${teacherId}/students`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await readJson(res);
      setStudents(data || []);
    } catch (err) { console.error(err); }
  };

  const fetchClassGroups = async () => {
    if (!teacherId || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/${teacherId}/class-groups`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await readJson(res);
      setClassGroups(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
  };

  const fetchResources = async () => {
    if (!teacherId || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/resources/my-resources`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await readJson(res);
      setResources(data.resources || []);
    } catch (err) { console.error(err); }
  };

  const fetchBroadcasts = async () => {
    if (!teacherId || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/teacher/broadcasts/${teacherId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await readJson(res);
      setBroadcasts(data || []);
      const newActs = (data || []).map(b => ({ type: "broadcast", subject: b.subjectName || "General", message: b.message, time: new Date(b.createdAt).toLocaleString() }));
      setActivities(prev => [...newActs, ...prev]);
    } catch (err) { console.error(err); }
  };

  const fetchMessages = async () => {
    if (!teacherId || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/messages/teacher/${teacherId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const messagesList = (data?.messages || []).filter(Boolean);
      setMessages(messagesList);
    } catch (err) { console.error(err); }
  };

  const handleDeleteMessage = async (recipientId) => {
    if (!token) return;
    try {
      await fetch(`${BASE_URL}/api/messages/recipient/${recipientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages((prev) => prev.filter((m) => m.recipientId !== recipientId));
      if (selectedMessage?.recipientId === recipientId) setSelectedMessage(null);
    } catch (err) { console.error(err); }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim() || !broadcastSubject) return alert("Please complete all fields");
    setSending(true);
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/teacher/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ teacherId, classGroupId: broadcastSubject, message: broadcastMessage })
      });
      if (res.ok) {
        addNotification("Broadcast sent ✅");
        setBroadcastMessage("");
        fetchBroadcasts();
      }
    } catch (err) { console.error(err); } finally { setSending(false); }
  };

  const handleResourceFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewResource((prev) => ({ ...prev, fileUrl: reader.result, fileType: file.type }));
    };
    reader.readAsDataURL(file);
  };

  // ── Uploaded timetable (file-based flow) ────────────────────────────────────
  // GET /api/teachers/:id/timetables — the teacher's own submissions + status.
  const fetchTimetableRecords = async () => {
    if (!teacherId || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/${teacherId}/timetables`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readJson(res);
      setTimetableRecords(Array.isArray(data?.timetables) ? data.timetables : []);
    } catch (err) { console.error("Unable to load timetable records:", err); }
  };

  const handleTimetableFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewTimetable((prev) => ({ ...prev, fileUrl: reader.result, fileName: file.name }));
    };
    reader.readAsDataURL(file);
  };

  // POST /api/teachers/:id/timetables — feeds the timetable in and notifies the
  // Tutor Managers immediately (durable + socket + push), then notifies the
  // teacher again once it is approved or flagged.
  const submitTimetable = async () => {
    if (!newTimetable.subjectId) return alert("Please choose the subject for this timetable.");
    if (!newTimetable.fileUrl) return alert("Please attach the timetable file.");
    setSubmittingTimetable(true);
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/${teacherId}/timetables`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          subjectId: newTimetable.subjectId,
          classLevel: newTimetable.classLevel,
          fileUrl: newTimetable.fileUrl,
        }),
      });
      const data = await readJson(res);
      if (data?.success) {
        addNotification("Timetable submitted for review ✅");
        setNewTimetable({ subjectId: "", classLevel: "", fileUrl: "", fileName: "" });
        fetchTimetableRecords();
      }
    } catch (err) {
      console.error("Timetable submission failed:", err);
      alert("Could not submit the timetable. Please try again.");
    } finally {
      setSubmittingTimetable(false);
    }
  };

  const handleSubmitResource = async () => {
    if (!newResource.title || !newResource.fileUrl) return alert("Title and file URL are required");
    try {
      const res = await fetch(`${BASE_URL}/api/resources/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newResource, teacherId })
      });
      if (res.ok) {
        addNotification("Resource submitted ✅");
        setNewResource({ title: "", description: "", fileUrl: "", subject: "", curriculum: "", classGroupId: "" });
        fetchResources();
      }
    } catch (err) { console.error(err); }
  };

  const handleReply = async (e, msgId) => {
    e.preventDefault();
    const replyText = replies[msgId];
    if (!replyText?.trim()) return;
    try {
      const res = await fetch(`${BASE_URL}/api/messages/reply/${msgId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reply: replyText, teacherId })
      });
      if (res.ok) {
        setReplies(prev => ({ ...prev, [msgId]: "" }));
        fetchMessages();
        addNotification("Reply sent ✅");
        setActivities(prev => [{ type: "reply", message: replyText, time: new Date().toLocaleString() }, ...prev]);
      }
    } catch (err) { console.error(err); }
  };

  const addNotification = (message) => {
    const note = { id: Date.now(), message, time: new Date().toLocaleTimeString() };
    setNotifications(prev => [note, ...prev]);
    setRecentMessage(message);
    setTimeout(() => setRecentMessage(null), 5000);
  };

  // Server notifications ("New Class Scheduled", "Timetable published",
  // "Class reminder"...) are durable records. They are merged into the same
  // bell list as the local activity notes above. Server rows keep their
  // `_id`/`notificationId` + `serverId` so Mark as read / Dismiss can hit the
  // API; local rows are client-only.
  const pushServerNotification = (message, when = null, source = {}) => {
    if (!message) return;
    const serverId = source._id || source.notificationId || source.id || null;
    const note = {
      id: serverId || `server-${Date.now()}-${Math.random()}`,
      serverId,
      server: Boolean(serverId),
      title: source.title || "",
      message,
      read: false,
      time: when ? new Date(when).toLocaleString() : new Date().toLocaleTimeString(),
    };
    setNotifications(prev => [note, ...prev].slice(0, 50));
  };

  // GET /api/teachers/:id/notifications (durable, survives being offline).
  const fetchNotifications = async () => {
    if (!teacherId || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/${teacherId}/notifications?limit=30`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readJson(res);
      const items = (data.notifications || []).map((n) => ({
        id: n._id,
        serverId: n._id,
        server: true,
        title: n.title || "",
        message: n.title ? `${n.title}: ${n.message}` : n.message,
        read: Boolean(n.read),
        time: new Date(n.createdAt).toLocaleString(),
      }));
      if (items.length) setNotifications(prev => [...items, ...prev].slice(0, 50));
    } catch (err) {
      console.error("Unable to load teacher notifications:", err);
    }
  };

    // GET /api/teachers/:id/timetable — this week's classes for the calendar card.
  // Automatically syncs classes to Moodle after fetching, so teachers don't
  // need to click "Sync to Moodle" manually for their classes to appear.
  const fetchTimetable = async () => {
    if (!teacherId || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/${teacherId}/timetable`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readJson(res);
      setTimetable(data.timetable || []);
      // Auto-sync classes to Moodle immediately after fetching timetable
      if ((data.timetable || []).length > 0) {
        syncClassesToMoodleAuto();
      }
    } catch (err) {
      console.error("Unable to load teacher timetable:", err);
      setTimetable([]);
    }
  };

  // Auto-sync — runs on dashboard load and whenever a class/timetable socket
  // event fires, so the Google Meet link for every session reaches Moodle
  // without the teacher pressing a button. Never throws to the UI.
  const syncClassesToMoodleAuto = async () => {
    if (moodleSyncRef.current) return; // a sync is already in flight
    moodleSyncRef.current = true;
    setSyncingMoodle(true);
    try {
      const res = await fetch(`${BASE_URL}/api/moodle/sync/teacher-timetable`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readJson(res);
      if (data?.synced) {
        setMoodleSyncMsg(
          `Moodle calendar ${data.failed ? "needs attention" : "updated"} ✔ ${data.created || 0} event(s) created, ${data.updated || 0} updated.${data.dryRun ? " (dry-run mode — no live Moodle changes)" : ""}`
        );
      } else if (data?.reason) {
        setMoodleSyncMsg(`Moodle said: ${data.reason}.`);
      }
    } catch (err) {
      console.error("Automatic Moodle sync failed:", err);
      // Non-blocking — a sync failure must never break the timetable card.
    } finally {
      moodleSyncRef.current = false;
      setSyncingMoodle(false);
    }
  };

  // GET /api/teachers/:id/performance — attendance + performance per student,
  // merged from the main website AND Moodle virtual-classroom sessions.
  const fetchPerformance = async () => {
    if (!teacherId || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/${teacherId}/performance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await readJson(res);
      setPerformance(data.performance || []);
    } catch (err) {
      console.error("Unable to load class records:", err);
    }
  };

  // Mark ONE durable notification as read (server + local). Local-only notes
  // are just flipped locally; server rows persist across sessions.
  const markOneNotificationRead = async (note) => {
    if (!note || note.read) return;
    if (!note.server || !note.serverId) {
      setNotifications(prev => prev.map((n) => (n.id === note.id ? { ...n, read: true } : n)));
      return;
    }
    setNotifications(prev => prev.map((n) => (n.id === note.id ? { ...n, read: true } : n)));
    try {
      await fetch(`${BASE_URL}/api/teachers/${teacherId}/notifications/${note.serverId}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Mark teacher notification read failed:", err);
      setNotifications(prev => prev.map((n) => (n.id === note.id ? { ...n, read: false } : n)));
    }
  };

  // Mark every durable notification as read (server + local).
  const markAllServerNotificationsRead = async () => {
    setNotifications(prev => prev.map((n) => ({ ...n, read: true })));
    if (!teacherId || !token) return;
    try {
      await fetch(`${BASE_URL}/api/teachers/${teacherId}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Mark all teacher notifications read failed:", err);
    }
  };

  // Dismiss (delete) one durable notification — removes it for good.
  const dismissServerNotification = async (note) => {
    if (!note?.server || !note.serverId) {
      setNotifications(prev => prev.filter((n) => n.id !== note.id));
      return;
    }
    const previous = notifications;
    setNotifications(prev => prev.filter((n) => n.id !== note.id));
    try {
      await fetch(`${BASE_URL}/api/teachers/${teacherId}/notifications/${note.serverId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Dismiss teacher notification failed:", err);
      setNotifications(previous);
    }
  };

  // Clear read notifications on the server (keeps unread ones by default).
  const clearReadServerNotifications = async () => {
    const previous = notifications;
    setNotifications(prev => prev.filter((n) => !n.read));
    if (!teacherId || !token) return;
    try {
      await fetch(`${BASE_URL}/api/teachers/${teacherId}/notifications`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Clear teacher notifications failed:", err);
      setNotifications(previous);
    }
  };

  // Opening the bell no longer auto-clears — teachers now explicitly
  // Mark as read / Dismiss / Clear read so old notifications stay visible.

  const handleLogout = () => {
    if (onLogout) onLogout();
    localStorage.removeItem("token");
    navigate("/login");
  };

  const openMoodleClassroom = async () => {
    // SSO: request a signed, short-lived Moodle URL from the backend, then open it.
    try {
      const res = await fetch(`${BASE_URL}/api/moodle/teacher-sso`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("SSO request failed");
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to open Moodle classroom:", err);
      window.open(MOODLE_PORTAL_URL, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200 sm:h-10 sm:w-10"><BookOpen size={18} className="sm:hidden" /><BookOpen size={20} className="hidden sm:block" /></span>
            <div className="min-w-0"><h1 className="truncate text-sm font-bold sm:text-base">StudiesMasters</h1><p className="hidden text-xs text-slate-500 sm:block">Teacher portal</p></div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="relative">
              <button type="button" onClick={() => setShowDropdown((open) => !open)} className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 sm:h-10 sm:w-10" aria-label="Notifications"><Bell size={18} className="sm:hidden" /><Bell size={19} className="hidden sm:block" />{notifications.filter((n) => !n.read).length > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-violet-600" />}</button>
              {showDropdown && <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"><div className="flex items-center justify-between border-b px-4 py-3"><p className="text-sm font-bold">Notifications</p><span className="text-xs text-slate-500">{notifications.filter((n) => !n.read).length} unread</span></div><div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2"><button type="button" onClick={markAllServerNotificationsRead} className="text-xs font-bold text-violet-600 hover:text-violet-700">Mark all as read</button><button type="button" onClick={clearReadServerNotifications} className="text-xs font-semibold text-slate-500 hover:text-slate-700">Clear read</button></div>{notifications.length ? notifications.slice(0, 8).map((note) => <div key={note.id} className="flex items-start gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-0"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${note.read ? "bg-slate-200" : "bg-violet-600"}`} /><div className="min-w-0 flex-1"><p className={note.read ? "text-slate-500" : ""}>{note.message}</p><p className="mt-1 text-xs text-slate-400">{note.time}</p>{!note.read && <button type="button" onClick={() => markOneNotificationRead(note)} className="mt-1 text-[11px] font-bold text-violet-600 hover:text-violet-700">Mark as read</button>}</div><button type="button" onClick={() => dismissServerNotification(note)} className="shrink-0 rounded-lg px-1.5 py-1 text-[11px] font-bold text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Dismiss notification">Dismiss</button></div>) : <p className="p-4 text-sm text-slate-500">No notifications yet.</p>}</div>}
            </div>
            <span className="hidden text-right md:block"><span className="block text-sm font-bold">{displayTeacher.fullName || displayTeacher.name || "Teacher"}</span><span className="block text-xs text-slate-500">Teaching workspace</span></span>
            <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 sm:px-3"><LogOut size={16} /><span className="hidden sm:inline">Logout</span></button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8">
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-950 px-4 py-5 text-white shadow-xl sm:rounded-3xl sm:px-9 sm:py-10">
          <motion.div aria-hidden="true" animate={{ x: [0, 18, 0], y: [0, -12, 0], scale: [1, 1.08, 1] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-fuchsia-400/25 blur-2xl" />
          <motion.div aria-hidden="true" animate={{ x: [0, -18, 0], y: [0, 12, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-20 right-1/4 h-48 w-48 rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl"><p className="text-sm font-semibold text-violet-200">Teacher workspace</p><h2 className="mt-2 text-2xl font-bold sm:text-4xl">Welcome back, {displayTeacher.fullName?.split(" ")[0] || displayTeacher.name?.split(" ")[0] || "Teacher"}.</h2><p className="mt-2 text-sm leading-6 text-violet-100 sm:mt-3 sm:text-base">Manage your subjects, students, assignments, and class announcements from one place.</p></div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.18, type: "spring", stiffness: 180 }} className="w-full lg:w-auto">
              <Button onClick={openMoodleClassroom} className="group h-12 w-full rounded-xl bg-yellow-400 px-5 text-base font-bold text-slate-950 shadow-lg shadow-yellow-500/20 transition hover:bg-yellow-300 lg:w-auto"><PlayCircle size={20} />Start class <ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Button>
            </motion.div>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)", backgroundSize: "30px 30px", maskImage: "linear-gradient(to right, black, transparent)" }} />
        </motion.section>

        <section className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-4 sm:gap-3">
          <DashboardMetric icon={<><BookOpen size={18} className="sm:hidden" /><BookOpen size={20} className="hidden sm:block" /></>} label="Subjects" value={subjects.length} color="violet" />
          <DashboardMetric icon={<><User size={18} className="sm:hidden" /><User size={20} className="hidden sm:block" /></>} label="Students" value={students.length} color="blue" />
          <DashboardMetric icon={<><CheckCircle size={18} className="sm:hidden" /><CheckCircle size={20} className="hidden sm:block" /></>} label="Resources" value={resources.length} color="emerald" />
          <DashboardMetric icon={<><FaUsers size={18} className="sm:hidden" /><FaUsers size={20} className="hidden sm:block" /></>} label="Class Groups" value={classGroups.length} color="amber" />
        </section>

         <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 sm:mt-7">

  <TabsList
    className="
      grid
      w-full
      grid-cols-2
      gap-1.5
      rounded-xl
      border
      border-slate-200
      bg-white
      p-1.5
      shadow-sm

      sm:grid-cols-3
      sm:gap-2
      sm:p-2
      md:grid-cols-4
      lg:grid-cols-6
    "
  >

    <TabsTrigger
      value="overview"
      className="
        rounded-lg
        px-2
        py-2
        text-xs
        font-semibold
        whitespace-nowrap

        sm:px-3
        sm:py-3
        sm:text-sm
      "
    >
      Overview
    </TabsTrigger>


    <TabsTrigger
      value="records"
      className="
        rounded-lg
        px-2
        py-2
        text-xs
        font-semibold
        whitespace-nowrap

        sm:px-3
        sm:py-3
        sm:text-sm
      "
    >
      Class records
    </TabsTrigger>


    <TabsTrigger
      value="students"
      className="
        rounded-lg
        px-2
        py-2
        text-xs
        font-semibold
        whitespace-nowrap

        sm:px-3
        sm:py-3
        sm:text-sm
      "
    >
      Students
    </TabsTrigger>


    <TabsTrigger
      value="class-groups"
      className="
        rounded-lg
        px-2
        py-2
        text-xs
        font-semibold
        whitespace-nowrap

        sm:px-3
        sm:py-3
        sm:text-sm
      "
    >
      Class Groups
    </TabsTrigger>


    <TabsTrigger
      value="resources"
      className="
        rounded-lg
        px-2
        py-2
        text-xs
        font-semibold
        whitespace-nowrap

        sm:px-3
        sm:py-3
        sm:text-sm
      "
    >
      Resources
    </TabsTrigger>

    <TabsTrigger
      value="messages"
      className="
        rounded-lg
        px-2
        py-2
        text-xs
        font-semibold
        whitespace-nowrap

        sm:px-3
        sm:py-3
        sm:text-sm
      "
    >
      Messages
    </TabsTrigger>

  </TabsList>

          <TabsContent value="overview" className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 lg:grid-cols-2">
            <Card className="lg:col-span-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="flex gap-3">
                  <div className="rounded-xl bg-white p-2 text-violet-600 shadow-sm"><CalendarDays size={22} /></div>
                  <div>
                    <CardTitle>Google Calendar & Meet access</CardTitle>
                    <CardDescription>Connect your Google account so StudiesMasters classes appear on your Calendar and you are automatically invited as a Meet co-host.</CardDescription>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${googleStatus.connected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {googleStatus.loading ? "Checking..." : googleStatus.connected ? "Connected" : "Not connected"}
                </span>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600">
                  {googleStatus.connected ? (
                    <span>Connected as <strong className="text-slate-900">{googleStatus.googleMeetEmail}</strong>. Calendar invitations and reminders are sent automatically.</span>
                  ) : (
                    <span>You need to verify the Google account that should receive class invitations and join as co-host.</span>
                  )}
                  {googleMessage && <p className="mt-1 text-xs text-violet-700">{googleMessage}</p>}
                </div>
                {googleStatus.connected ? (
                  <Button type="button" variant="outline" onClick={disconnectGoogle} disabled={googleActionLoading} className="shrink-0 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">
                    <Unlink size={16} /> {googleActionLoading ? "Working..." : "Disconnect"}
                  </Button>
                ) : (
                  <Button type="button" onClick={connectGoogle} disabled={googleActionLoading || googleStatus.loading} className="shrink-0 bg-violet-600 hover:bg-violet-700">
                    <CalendarDays size={16} /> {googleActionLoading ? "Opening Google..." : "Connect Google Account"}
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <Card><CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="min-w-0"><CardTitle>My timetable</CardTitle><CardDescription>Your classes for this week (Mon–Sun), synced automatically to Moodle with the Google Meet link for every session. Live classes are managed from Moodle; records sync back here.</CardDescription></div>
              </CardHeader><CardContent>
                {moodleSyncMsg && <p className="mb-3 rounded-xl bg-violet-50 px-3 py-2 text-xs font-medium text-violet-700">{moodleSyncMsg}</p>}
                {timetable === null ? <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Loading your timetable…</p> : timetable.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {WEEK_DAYS.map((day) => {
                      const dayItems = timetable.filter((item) => dayNameOf(item.date) === day);
                      if (!dayItems.length) return null;
                      const today = dayItems.some((item) => sameDay(item.date, new Date()));
                      return (
                        <div key={day} className={`rounded-2xl border p-3 ${today ? "border-violet-300 bg-violet-50/60" : "border-slate-200"}`}>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{formatTimetableDay(dayItems[0].date)}{today ? " · Today" : ""}</p>
                          <div className="mt-2 space-y-2">
                            {dayItems.map((item) => (
                              <div key={item.id} className="rounded-xl bg-white px-3 py-2 shadow-sm">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-bold">{item.subject || "Class"}</p>
                                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.status === "live" ? "bg-red-100 text-red-700" : item.status === "completed" ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}`}>{item.status}</span>
                                </div>
                                <p className="mt-1 text-xs text-slate-600">{item.startTime} – {item.endTime}</p>
                                <p className="text-xs text-slate-400">{item.groupCode || "Class group TBA"}{item.isSubstitute ? " · substituting" : ""}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <DashboardEmpty text="No classes on your timetable this week yet." />}
              </CardContent></Card>
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Submit your timetable</CardTitle>
                  <CardDescription>Feed in your timetable file — the Tutor Manager is notified immediately, and you get a notification with their decision (approval, or feedback if flagged).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select value={newTimetable.subjectId} onValueChange={(value) => setNewTimetable((prev) => ({ ...prev, subjectId: value }))}>
                      <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject._id || subject.id || subject.name} value={subject._id || subject.id}>
                            {subject.name || "Subject"}{subject.grade ? ` · ${subject.grade}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Class level (e.g. JHS 2)" value={newTimetable.classLevel} onChange={(e) => setNewTimetable((prev) => ({ ...prev, classLevel: e.target.value }))} />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input type="file" accept=".pdf,.xls,.xlsx,.csv,.doc,.docx,image/*" onChange={handleTimetableFileChange} className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-violet-100 file:px-3 file:py-1 file:text-violet-700 sm:text-sm" />
                    {newTimetable.fileName && <span className="truncate text-xs text-slate-500">{newTimetable.fileName}</span>}
                  </div>
                  <Button onClick={submitTimetable} disabled={submittingTimetable} className="w-full bg-violet-600 hover:bg-violet-700 sm:w-auto">
                    {submittingTimetable ? "Submitting…" : "Submit timetable for review"}
                  </Button>

                  <div className="space-y-2 pt-2">
                    {timetableRecords.length ? timetableRecords.map((record) => (
                      <div key={record.id} className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{record.subject || "Timetable"}{record.classLevel ? ` · ${record.classLevel}` : ""}</p>
                          <p className="text-xs text-slate-500">
                            {record.uploadedAt ? `Submitted ${new Date(record.uploadedAt).toLocaleDateString()}` : "Submitted"}
                            {record.feedback ? ` · Feedback: ${record.feedback}` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${record.status === "Approved" ? "bg-emerald-100 text-emerald-700" : record.status === "Flagged" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{record.status}</span>
                          {record.fileUrl && <a href={record.fileUrl} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-violet-600 underline">View</a>}
                        </div>
                      </div>
                    )) : <DashboardEmpty text="No timetables submitted yet." />}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card><CardHeader><CardTitle>Your subjects</CardTitle><CardDescription>Subjects currently assigned to you.</CardDescription></CardHeader><CardContent className="space-y-3">{subjects.length ? subjects.map((subject) => <div key={subject._id || subject.id || subject.name} className="flex items-center justify-between rounded-xl bg-violet-50 px-4 py-3"><span><span className="block font-semibold">{subject.name || "Subject"}</span><span className="text-xs text-slate-500">{subject.grade || "Class not set"}</span></span><BookOpen size={18} className="text-violet-600" /></div>) : <DashboardEmpty text="No subjects are assigned yet." />}</CardContent></Card>
            <Card><CardHeader><CardTitle>Recent activity</CardTitle><CardDescription>Latest broadcasts and messages.</CardDescription></CardHeader><CardContent className="space-y-3">{activities.length ? activities.slice(0, 5).map((activity, index) => <div key={`${activity.time}-${index}`} className="rounded-xl border border-slate-100 px-4 py-3"><p className="font-medium">{activity.subject || activity.type}</p><p className="mt-1 text-sm text-slate-600">{activity.message}</p><p className="mt-1 text-xs text-slate-400">{activity.time}</p></div>) : <DashboardEmpty text="No recent activity." />}</CardContent></Card>
          </TabsContent>

          <TabsContent value="records" className="mt-4 sm:mt-5">
            <Card><CardHeader><CardTitle>Class records</CardTitle><CardDescription>Attendance and performance per student — merged from classes attended on the main website AND in Moodle.</CardDescription></CardHeader>
              <CardContent>{performance.length ? (
                <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b text-xs uppercase text-slate-500"><tr><th className="pb-3">Student</th><th className="pb-3">Class</th><th className="pb-3">Sessions</th><th className="pb-3">Attended</th><th className="pb-3">Attendance</th><th className="pb-3">Minutes</th><th className="pb-3">Last attended</th></tr></thead>
                  <tbody>{performance.map((row) => (
                    <tr key={row.studentId} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-semibold">{row.name}</td>
                      <td className="py-3 text-slate-600">{row.classGroup} · {row.subject}</td>
                      <td className="py-3 text-slate-600">{row.totalSessions}</td>
                      <td className="py-3 text-slate-600">{row.attended}</td>
                      <td className="py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${row.attendancePct >= 75 ? "bg-emerald-100 text-emerald-700" : row.attendancePct >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{row.attendancePct}%</span></td>
                      <td className="py-3 text-slate-600">{row.minutes}</td>
                      <td className="py-3 text-slate-500">{row.lastAttended ? new Date(row.lastAttended).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}</tbody>
                </table></div>
              ) : <DashboardEmpty text="No class records yet — attendance appears here once classes are completed." />}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="mt-4 sm:mt-5"><Card><CardHeader><CardTitle>Students</CardTitle><CardDescription>Students assigned to your classes. Only names are shown for privacy.</CardDescription></CardHeader><CardContent>{students.length ? <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><thead className="border-b text-xs uppercase text-slate-500"><tr><th className="pb-3">Name</th><th className="pb-3">Class</th></tr></thead><tbody>{students.map((student) => <tr key={student._id} className="border-b border-slate-100 last:border-0"><td className="py-4 font-semibold">{student.name || student.fullName}</td><td className="py-4 text-slate-600">{student.className || student.grade || "-"}</td></tr>)}</tbody></table></div> : <DashboardEmpty text="No students are assigned to your classes yet." />}</CardContent></Card></TabsContent>

          <TabsContent value="class-groups" className="mt-4 sm:mt-5"><Card><CardHeader><CardTitle>Your Class Groups</CardTitle><CardDescription>Groups assigned to you.</CardDescription></CardHeader><CardContent>{classGroups.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{classGroups.map((group) => <div key={group._id} className="rounded-xl border border-slate-200 p-4"><p className="font-bold"><FaUsers className="inline mr-2 text-blue-600" />{group.code}</p><p className="mt-1 text-sm text-slate-600">{group.curriculum} · Grade {group.grade}</p><p className="text-xs text-slate-500">Subject: {group.subject}</p><p className="text-xs text-slate-500">Students: {group.students?.length || 0} / {group.capacity}</p></div>)}</div> : <DashboardEmpty text="You don't have assigned class groups yet." />}</CardContent></Card></TabsContent>

          <TabsContent value="resources" className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Submit Resource</CardTitle><CardDescription>Upload lesson notes and learning materials.</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Title" value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} />
                <Textarea placeholder="Description" value={newResource.description} onChange={(e) => setNewResource({ ...newResource, description: e.target.value })} />
                <Input type="file" accept=".pdf,.doc,.docx" onChange={handleResourceFileChange} />
                {newResource.fileUrl && <p className="text-xs text-slate-500">File selected: {newResource.fileType || "pdf"}</p>}
                <Input placeholder="Subject" value={newResource.subject} onChange={(e) => setNewResource({ ...newResource, subject: e.target.value })} />
                <Input placeholder="Curriculum" value={newResource.curriculum} onChange={(e) => setNewResource({ ...newResource, curriculum: e.target.value })} />
                <Button onClick={handleSubmitResource} className="w-full bg-violet-600 hover:bg-violet-700">Submit Resource</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>My Resources</CardTitle><CardDescription>Track your submissions and reviews.</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                {resources.length ? resources.map((r) => (
                  <div key={r._id} className="rounded-xl border border-slate-200 p-4">
                    <p className="font-bold">{r.title}</p>
                    <p className="text-sm text-slate-600">{r.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${r.approved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {r.approved ? "Approved" : "Pending"}
                      </span>
                      {r.comment && <span className="text-xs text-slate-500">Comment: {r.comment}</span>}
                    </div>
                  </div>
                )) : <DashboardEmpty text="No resources submitted yet." />}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="mt-4 sm:mt-5">
            <div className="mb-3 flex gap-1.5 rounded-xl border border-slate-200 bg-white p-1 w-fit">
              {[["inbox", "Inbox"], ["broadcasts", "My broadcasts"]].map(([id, label]) => (
                <button key={id} type="button" onClick={() => setMessagesSub(id)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${messagesSub === id ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                  {label}
                </button>
              ))}
            </div>
            {messagesSub === "broadcasts" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card><CardHeader><CardTitle>Send a broadcast</CardTitle><CardDescription>Announce something to one of your class groups.</CardDescription></CardHeader><CardContent className="space-y-3"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={broadcastSubject} onChange={(event) => setBroadcastSubject(event.target.value)}><option value="">Select class group</option>{classGroups.map((group) => <option key={group._id} value={group._id}>{group.code} - {group.curriculum} · Grade {group.grade}</option>)}</select><Textarea placeholder="Write an announcement for students in this class group" value={broadcastMessage} onChange={(event) => setBroadcastMessage(event.target.value)} /><Button onClick={handleSendBroadcast} disabled={sending} className="w-full bg-violet-600 hover:bg-violet-700"><Send size={16} />{sending ? "Sending..." : "Send broadcast"}</Button></CardContent></Card>
                <Card><CardHeader><CardTitle>Previous broadcasts</CardTitle></CardHeader><CardContent className="space-y-3">{broadcasts.length ? broadcasts.map((broadcast, index) => <div key={`${broadcast.createdAt}-${index}`} className="rounded-xl border border-slate-200 p-4"><p className="font-bold">{broadcast.subjectName || "General"}</p><p className="mt-1 text-sm text-slate-600">{broadcast.message}</p></div>) : <DashboardEmpty text="No broadcasts have been sent." />}</CardContent></Card>
              </div>
            ) : (
            <Card>
              <CardHeader>
                <CardTitle>Messages from Admin & Tutor Manager</CardTitle>
                <CardDescription>Broadcasts and announcements sent to you.</CardDescription>
              </CardHeader>
              <CardContent>
                {messages.length ? (
                  <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
                    {/* Inbox list */}
                    <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
                      {messages.map((msg) => (
                        <div
                          key={msg._id}
                          onClick={() => setSelectedMessage(msg)}
                          className={`cursor-pointer rounded-xl border p-3 transition ${
                            selectedMessage?._id === msg._id
                              ? "border-violet-500 bg-violet-50"
                              : "border-slate-200 hover:border-violet-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">{msg.subject || "Broadcast"}</p>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                From: {msg.senderName || "Unknown"} · <span className="font-medium">{msg.roleLabel || msg.senderRole || "System"}</span>
                              </p>
                              <p className="mt-1 text-xs text-slate-400">{new Date(msg.createdAt).toLocaleString()}</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.recipientId); }}
                              className="rounded-lg border border-rose-200 p-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                              title="Delete message"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message detail */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                      {selectedMessage ? (
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-slate-500">Subject</p>
                            <p className="text-lg font-semibold text-slate-900">{selectedMessage.subject || "Broadcast"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">From</p>
                            <p className="text-sm text-slate-900">
                              {selectedMessage.senderName || "Unknown"} · <span className="font-medium">{selectedMessage.roleLabel || selectedMessage.senderRole || "System"}</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Message</p>
                            <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-800">
                              {selectedMessage.body || selectedMessage.message || selectedMessage.content}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Received</p>
                            <p className="text-xs text-slate-400">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(selectedMessage.recipientId)}
                              className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                            >
                              Delete message
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Select a message to read it.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <DashboardEmpty text="No messages yet." />
                )}
              </CardContent>
            </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function DashboardMetric({ icon, label, value, color }) {
  const colors = { violet: "bg-violet-600", blue: "bg-blue-600", emerald: "bg-emerald-600", amber: "bg-amber-500" };
  return <Card><CardContent className="flex items-center gap-2 p-2.5 sm:gap-3 sm:p-4"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white sm:h-10 sm:w-10 sm:rounded-xl ${colors[color]}`}>{icon}</span><span className="min-w-0"><span className="block text-base font-bold leading-none sm:text-xl">{value}</span><span className="mt-0.5 block truncate text-[10px] font-medium text-slate-500 sm:mt-1 sm:text-xs">{label}</span></span></CardContent></Card>;
}

function DashboardEmpty({ text }) {
  return <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{text}</p>;
}

export default TeacherDashboard;