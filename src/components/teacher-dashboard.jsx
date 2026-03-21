"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { BookOpen, User, Bell, CheckCircle, Send, LogOut, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";

const BASE_URL = "https://studiesmasters-backend.onrender.com";

export function TeacherDashboard({ user = {}, onLogout }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentMessage, setRecentMessage] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replies, setReplies] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcasts, setBroadcasts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [newAssignment, setNewAssignment] = useState({ title: "", description: "", className: "", subjectId: "" });
  const [sending, setSending] = useState(false);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  // Load token
  useEffect(() => {
    if (typeof window !== "undefined") setToken(localStorage.getItem("token"));
  }, []);

  // Fetch initial data when user exists
  useEffect(() => {
    if (!user._id || !token) return;

    addNotification(`Welcome back, ${user.name || "Teacher"}! 👋`);
    fetchSubjects();
    fetchBroadcasts();
    fetchMessages();
    fetchStudents();
    fetchAssignments();
  }, [user._id, token]);

  // -------- SOCKET.IO REAL-TIME SETUP --------
  useEffect(() => {
    if (!user._id) return;

    const socket = io(BASE_URL, {
      withCredentials: true,
      query: { userId: user._id },
    });

    socket.on("connect", () => {
      console.log("🟢 Connected to socket:", socket.id);
    });

    socket.on("message:new", (data) => {
      console.log("📩 New message event:", data);

      // Add to messages
      setMessages(prev => [data, ...prev]);

      // Add to activities
      setActivities(prev => [
        {
          type: "message",
          message: data.content || data.message,
          time: new Date().toLocaleString(),
        },
        ...prev
      ]);

      addNotification("New message received 📩");
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
    });

    return () => socket.disconnect();
  }, [user._id]);

  // -------- FETCH FUNCTIONS --------
  const fetchSubjects = async () => {
    if (!user._id || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/${user._id}/subjects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSubjects(data || []);
    } catch (err) { console.error(err); }
  };

  const fetchStudents = async () => {
    if (!user._id || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/${user._id}/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStudents(data || []);
    } catch (err) { console.error(err); }
  };

  const fetchAssignments = async () => {
    if (!user._id || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/${user._id}/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAssignments(data || []);
    } catch (err) { console.error(err); }
  };

  const fetchBroadcasts = async () => {
    if (!user._id || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/${user._id}/broadcasts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setBroadcasts(data || []);

      const newActs = (data || []).map(b => ({
        type: "broadcast",
        subject: b.subjectName || "General",
        message: b.message,
        time: new Date(b.createdAt).toLocaleString()
      }));
      setActivities(prev => [...newActs, ...prev]);
    } catch (err) { console.error(err); }
  };

  const fetchMessages = async () => {
    if (!user._id || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/messages/teacher/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data || []);

      const msgActs = (data || []).map(m => ({
        type: "message",
        message: m.content || m.message,
        time: new Date(m.createdAt || m.date).toLocaleString()
      }));
      setActivities(prev => [...msgActs, ...prev]);
    } catch (err) { console.error(err); }
  };

  // -------- ACTIONS --------
  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim() || !broadcastSubject) return alert("Please complete all fields");
    setSending(true);
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ teacherId: user._id, subjectId: broadcastSubject, message: broadcastMessage })
      });
      if (res.ok) {
        addNotification("Broadcast sent ✅");
        setBroadcastMessage("");
        fetchBroadcasts();
      }
    } catch (err) { console.error(err); } finally { setSending(false); }
  };

  const handlePostAssignment = async () => {
    if (!newAssignment.title || !newAssignment.description || !newAssignment.subjectId) return alert("Complete all fields");
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newAssignment, teacherId: user._id })
      });
      if (res.ok) {
        addNotification("Assignment posted ✅");
        setNewAssignment({ title: "", description: "", className: "", subjectId: "" });
        fetchAssignments();
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
        body: JSON.stringify({ reply: replyText, teacherId: user._id })
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

  const handleLogout = () => {
    if (onLogout) onLogout();
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      {/* HEADER + TABS + UI remains unchanged */}
      {/* Your existing header, notifications, tabs and content */}
    </div>
  );
}

export default TeacherDashboard;
