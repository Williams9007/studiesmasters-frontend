"use client";

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { BookOpen, User, Bell, CheckCircle, Send, LogOut, PlayCircle, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { FaUsers } from "react-icons/fa";
import TeacherAssignments from "./TeacherAssignments";
import TeacherQuizzes from "./TeacherQuizzes";

const BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
const MOODLE_PORTAL_URL = import.meta.env.VITE_MOODLE_PORTAL_URL || "https://moodle.org/";

export function TeacherDashboard({ user = {}, onLogout }) {
  const navigate = useNavigate();
  const { id: routeTeacherId } = useParams();
  const teacherId = routeTeacherId || user._id || localStorage.getItem("userId");
  const [token, setToken] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);

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
  const [classGroups, setClassGroups] = useState([]);
  const displayTeacher = teacherProfile || user;

  const readJson = async (response) => {
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) throw new Error("The server returned a non-JSON response.");
    return response.json();
  };

  useEffect(() => {
    if (typeof window !== "undefined") setToken(localStorage.getItem("token"));
  }, []);

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
    fetchAssignments();
    fetchClassGroups();
  }, [teacherId, token]);

  useEffect(() => {
    if (!teacherId) return;
    const socket = io(BASE_URL, { withCredentials: true, query: { userId: teacherId } });
    socket.on("connect", () => console.log("🟢 Connected to socket:", socket.id));
    socket.on("message:new", (data) => {
      setMessages(prev => [data, ...prev]);
      setActivities(prev => [{ type: "message", message: data.content || data.message, time: new Date().toLocaleString() }, ...prev]);
      addNotification("New message received 📩");
    });
    socket.on("disconnect", () => console.log("🔌 Socket disconnected"));
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

  const fetchAssignments = async () => {
    if (!teacherId || !token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/${teacherId}/assignments`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await readJson(res);
      setAssignments(data || []);
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
      setMessages(data || []);
      const msgActs = (data || []).map(m => ({ type: "message", message: m.content || m.message, time: new Date(m.createdAt || m.date).toLocaleString() }));
      setActivities(prev => [...msgActs, ...prev]);
    } catch (err) { console.error(err); }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim() || !broadcastSubject) return alert("Please complete all fields");
    setSending(true);
    try {
      const res = await fetch(`${BASE_URL}/api/teachers/teacher/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ teacherId, subjectId: broadcastSubject, message: broadcastMessage })
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
        body: JSON.stringify({ ...newAssignment, teacherId })
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

  const handleLogout = () => {
    if (onLogout) onLogout();
    localStorage.removeItem("token");
    navigate("/login");
  };

  const openMoodleClassroom = () => {
    window.open(MOODLE_PORTAL_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-200"><BookOpen size={20} /></span>
            <div><h1 className="font-bold">StudiesMasters</h1><p className="text-xs text-slate-500">Teacher portal</p></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button type="button" onClick={() => setShowDropdown((open) => !open)} className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100" aria-label="Notifications"><Bell size={19} />{notifications.length > 0 && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-violet-600" />}</button>
              {showDropdown && <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"><div className="border-b px-4 py-3 text-sm font-bold">Notifications</div>{notifications.length ? notifications.slice(0, 5).map((note) => <div key={note.id} className="border-b border-slate-100 px-4 py-3 text-sm last:border-0"><p>{note.message}</p><p className="mt-1 text-xs text-slate-400">{note.time}</p></div>) : <p className="p-4 text-sm text-slate-500">No notifications yet.</p>}</div>}
            </div>
            <span className="hidden text-right sm:block"><span className="block text-sm font-bold">{displayTeacher.fullName || displayTeacher.name || "Teacher"}</span><span className="block text-xs text-slate-500">Teaching workspace</span></span>
            <button type="button" onClick={handleLogout} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600"><LogOut size={16} /><span className="hidden sm:inline">Logout</span></button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 via-indigo-800 to-slate-950 px-6 py-8 text-white shadow-xl sm:px-9 sm:py-10">
          <motion.div aria-hidden="true" animate={{ x: [0, 18, 0], y: [0, -12, 0], scale: [1, 1.08, 1] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-fuchsia-400/25 blur-2xl" />
          <motion.div aria-hidden="true" animate={{ x: [0, -18, 0], y: [0, 12, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-20 right-1/4 h-48 w-48 rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl"><p className="text-sm font-semibold text-violet-200">Teacher workspace</p><h2 className="mt-2 text-3xl font-bold sm:text-4xl">Welcome back, {displayTeacher.fullName?.split(" ")[0] || displayTeacher.name?.split(" ")[0] || "Teacher"}.</h2><p className="mt-3 text-sm leading-6 text-violet-100 sm:text-base">Manage your subjects, students, assignments, and class announcements from one place.</p></div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.18, type: "spring", stiffness: 180 }}>
              <Button onClick={openMoodleClassroom} className="group h-12 rounded-xl bg-yellow-400 px-5 text-base font-bold text-slate-950 shadow-lg shadow-yellow-500/20 transition hover:bg-yellow-300"><PlayCircle size={20} />Start class <ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Button>
            </motion.div>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)", backgroundSize: "30px 30px", maskImage: "linear-gradient(to right, black, transparent)" }} />
        </motion.section>

        <section className="mt-5 grid gap-4 sm:grid-cols-3">
          <DashboardMetric icon={<BookOpen size={20} />} label="Subjects" value={subjects.length} color="violet" />
          <DashboardMetric icon={<User size={20} />} label="Students" value={students.length} color="blue" />
          <DashboardMetric icon={<CheckCircle size={20} />} label="Assignments" value={assignments.length} color="emerald" />
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-7">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <TabsTrigger value="overview" className="min-h-10 px-4">Overview</TabsTrigger>
          <TabsTrigger value="students" className="min-h-10 px-4">Students</TabsTrigger>
          <TabsTrigger value="class-groups" className="min-h-10 px-4">Class Groups</TabsTrigger>
          <TabsTrigger value="assignments" className="min-h-10 px-4">Assignments</TabsTrigger>
          <TabsTrigger value="quizzes" className="min-h-10 px-4">Quizzes</TabsTrigger>
          <TabsTrigger value="broadcasts" className="min-h-10 px-4">Broadcasts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-5 grid gap-5 lg:grid-cols-2">
            <Card><CardHeader><CardTitle>Your subjects</CardTitle><CardDescription>Subjects currently assigned to you.</CardDescription></CardHeader><CardContent className="space-y-3">{subjects.length ? subjects.map((subject) => <div key={subject._id || subject.id || subject.name} className="flex items-center justify-between rounded-xl bg-violet-50 px-4 py-3"><span><span className="block font-semibold">{subject.name || "Subject"}</span><span className="text-xs text-slate-500">{subject.grade || "Class not set"}</span></span><BookOpen size={18} className="text-violet-600" /></div>) : <DashboardEmpty text="No subjects are assigned yet." />}</CardContent></Card>
            <Card><CardHeader><CardTitle>Recent activity</CardTitle><CardDescription>Latest broadcasts and messages.</CardDescription></CardHeader><CardContent className="space-y-3">{activities.length ? activities.slice(0, 5).map((activity, index) => <div key={`${activity.time}-${index}`} className="rounded-xl border border-slate-100 px-4 py-3"><p className="font-medium">{activity.subject || activity.type}</p><p className="mt-1 text-sm text-slate-600">{activity.message}</p><p className="mt-1 text-xs text-slate-400">{activity.time}</p></div>) : <DashboardEmpty text="No recent activity." />}</CardContent></Card>
          </TabsContent>

          <TabsContent value="students" className="mt-5"><Card><CardHeader><CardTitle>Students</CardTitle><CardDescription>Students assigned to your classes. Only names are shown for privacy.</CardDescription></CardHeader><CardContent>{students.length ? <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><thead className="border-b text-xs uppercase text-slate-500"><tr><th className="pb-3">Name</th><th className="pb-3">Class</th></tr></thead><tbody>{students.map((student) => <tr key={student._id} className="border-b border-slate-100 last:border-0"><td className="py-4 font-semibold">{student.name || student.fullName}</td><td className="py-4 text-slate-600">{student.className || student.grade || "-"}</td></tr>)}</tbody></table></div> : <DashboardEmpty text="No students are assigned to your classes yet." />}</CardContent></Card></TabsContent>

          <TabsContent value="class-groups" className="mt-5"><Card><CardHeader><CardTitle>Your Class Groups</CardTitle><CardDescription>Groups assigned to you.</CardDescription></CardHeader><CardContent>{classGroups.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{classGroups.map((group) => <div key={group._id} className="rounded-xl border border-slate-200 p-4"><p className="font-bold"><FaUsers className="inline mr-2 text-blue-600" />{group.code}</p><p className="mt-1 text-sm text-slate-600">{group.curriculum} · Grade {group.grade}</p><p className="text-xs text-slate-500">Subject: {group.subject}</p><p className="text-xs text-slate-500">Students: {group.students?.length || 0} / {group.capacity}</p></div>)}</div> : <DashboardEmpty text="You don't have assigned class groups yet." />}</CardContent></Card></TabsContent>

          <TabsContent value="assignments" className="mt-5"><TeacherAssignments teacherId={teacherId} token={token} /></TabsContent>

          <TabsContent value="quizzes" className="mt-5"><TeacherQuizzes teacherId={teacherId} token={token} /></TabsContent>

          <TabsContent value="broadcasts" className="mt-5 grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>Send a broadcast</CardTitle></CardHeader><CardContent className="space-y-3"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={broadcastSubject} onChange={(event) => setBroadcastSubject(event.target.value)}><option value="">Select subject</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name}</option>)}</select><Textarea placeholder="Write an announcement for students" value={broadcastMessage} onChange={(event) => setBroadcastMessage(event.target.value)} /><Button onClick={handleSendBroadcast} disabled={sending} className="w-full bg-violet-600 hover:bg-violet-700"><Send size={16} />{sending ? "Sending..." : "Send broadcast"}</Button></CardContent></Card><Card><CardHeader><CardTitle>Previous broadcasts</CardTitle></CardHeader><CardContent className="space-y-3">{broadcasts.length ? broadcasts.map((broadcast, index) => <div key={`${broadcast.createdAt}-${index}`} className="rounded-xl border border-slate-200 p-4"><p className="font-bold">{broadcast.subjectName || "General"}</p><p className="mt-1 text-sm text-slate-600">{broadcast.message}</p></div>) : <DashboardEmpty text="No broadcasts have been sent." />}</CardContent></Card></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function DashboardMetric({ icon, label, value, color }) {
  const colors = { violet: "bg-violet-600", blue: "bg-blue-600", emerald: "bg-emerald-600" };
  return <Card><CardContent className="flex items-center gap-3 p-4"><span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${colors[color]}`}>{icon}</span><span><span className="block text-xl font-bold">{value}</span><span className="text-xs font-medium text-slate-500">{label}</span></span></CardContent></Card>;
}

function DashboardEmpty({ text }) {
  return <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{text}</p>;
}

export default TeacherDashboard;