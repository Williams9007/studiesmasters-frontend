"use client";

<<<<<<< HEAD
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "@/utils/apiClient";
import { io } from "socket.io-client";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  LogOut,
  Mail,
  Menu,
  PlayCircle,
  User,
  WalletCards,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";

const MOODLE_PORTAL_URL = import.meta.env.VITE_MOODLE_PORTAL_URL || "https://moodle.org/";

const formatDate = (value) =>
  value ? new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "Not available";

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(Number(amount || 0));

export function StudentDashboard() {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [studentData, setStudentData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [readMessages, setReadMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const normaliseMessage = (message) => ({
    ...message,
    id: message._id || message.id || `message-${Date.now()}-${Math.random()}`,
    subjectName: message.subjectName || message.subject || "StudiesMasters",
  });

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      if (!localStorage.getItem("token")) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const { data } = await apiClient.get("/students/me");
        const student = data.user || data;
        if (!student?._id) throw new Error("Your student profile could not be loaded.");

        const broadcastsRequest = apiClient.get(`/students/broadcasts/${student._id}`);
        const [broadcastsResponse] = await Promise.all([broadcastsRequest]);
        if (!active) return;

        setStudentData(student);
        setSubjects(Array.isArray(data.subjects) ? data.subjects : student.subjectsEnrolled || []);
        setPayments(Array.isArray(data.payments) ? data.payments : []);
        setBroadcasts((broadcastsResponse.data.broadcasts || []).map(normaliseMessage));
      } catch (error) {
        console.error("Error fetching student dashboard:", error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("role");
          navigate("/login", { replace: true });
          return;
        }
        if (active) setLoadError(error.response?.data?.message || error.message || "Unable to load your dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();
    return () => { active = false; };
  }, [navigate]);

  useEffect(() => {
    if (!studentData?._id) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      auth: { token, role: "student" },
      query: { userId: studentData._id },
      transports: ["websocket"],
    });
    socketRef.current = socket;
    socket.on("broadcast:new", (message) => setBroadcasts((current) => [normaliseMessage(message), ...current]));
    return () => socket.disconnect();
  }, [studentData?._id]);

  const unreadMessages = broadcasts.filter((message) => !readMessages.includes(message.id));
  const duration = studentData?.studyDuration || payments[0]?.duration || "Not set";

  const openInbox = (message) => {
    setReadMessages((current) => (current.includes(message.id) ? current : [...current, message.id]));
    setShowNotifications(false);
    setActiveTab("inbox");
  };

  const logout = () => {
    ["token", "userId", "role"].forEach((key) => localStorage.removeItem(key));
    navigate("/", { replace: true });
  };

  const managePlanPayment = () => {
    navigate("/payment", {
      state: {
        user: studentData,
        curriculum: studentData.curriculum,
        grade: studentData.grade,
        package: studentData.selectedPlan || studentData.package,
        subjects: subjects.map((subject) => subject.name || subject.subjectName || subject).filter(Boolean),
        payments,
      },
    });
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-600">Loading your learning space…</div>;

  if (loadError || !studentData) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><Card className="w-full max-w-md"><CardContent className="p-7 text-center"><h1 className="text-xl font-bold">Dashboard unavailable</h1><p className="mt-2 text-sm text-slate-600">{loadError || "We could not load your profile."}</p><Button onClick={() => navigate("/login", { replace: true })} className="mt-6 bg-blue-600 hover:bg-blue-700">Return to sign in</Button></CardContent></Card></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200"><BookOpen size={20} /></div>
            <div><h1 className="font-bold leading-none">StudiesMasters</h1><p className="mt-1 text-xs text-slate-500">Student learning portal</p></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button type="button" onClick={() => setShowNotifications((open) => !open)} className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100" aria-label="Open notifications">
                <Bell size={20} />
                {unreadMessages.length > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">{unreadMessages.length > 9 ? "9+" : unreadMessages.length}</span>}
              </button>
              {showNotifications && <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><p className="font-bold">Notifications</p><span className="text-xs text-slate-500">{unreadMessages.length} unread</span></div>
                <div className="max-h-80 overflow-y-auto">{broadcasts.length ? broadcasts.slice(0, 5).map((message) => <button key={message.id} type="button" onClick={() => openInbox(message)} className="block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-blue-50"><div className="flex items-start gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${readMessages.includes(message.id) ? "bg-slate-200" : "bg-blue-600"}`} /><span className="min-w-0"><span className="block text-sm font-semibold">{message.subjectName}</span><span className="mt-1 block truncate text-xs text-slate-600">{message.message}</span><span className="mt-1 block text-[11px] text-slate-400">{formatDate(message.createdAt)}</span></span></div></button>) : <p className="p-5 text-center text-sm text-slate-500">You’re all caught up.</p>}</div>
                <button type="button" onClick={() => { setShowNotifications(false); setActiveTab("inbox"); }} className="w-full px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50">View inbox</button>
              </div>}
            </div>
            <div className="hidden text-right sm:block"><p className="max-w-40 truncate text-sm font-bold">{studentData.fullName}</p><p className="max-w-40 truncate text-xs text-slate-500">{studentData.email}</p></div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white"><User size={18} /></div>
            <button type="button" onClick={logout} className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 sm:inline-flex"><LogOut size={16} className="mr-2" />Logout</button>
=======
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "@/utils/apiClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input"; // optional, only if needed
import { User, BookOpen, Bell, Upload } from "lucide-react";
import { io } from "socket.io-client";

export function StudentDashboard() {
  const [studentData, setStudentData] = useState(null);
  const [broadcasts, setBroadcasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [typedAnswers, setTypedAnswers] = useState({});
  const [fileAnswers, setFileAnswers] = useState({});

  const navigate = useNavigate();
  const socketRef = useRef(null);

  const addNotification = (broadcast) => {
    const note = {
      id: broadcast._id || Date.now(),
      subjectName: broadcast.subjectName || "General",
      message: broadcast.message,
      sender: broadcast.sender || { fullName: "Admin" },
      createdAt: broadcast.createdAt || new Date(),
      open: false,
    };

    setNotifications((prev) => [note, ...prev]);
    setBroadcasts((prev) => [note, ...prev]);
  };

  // ================= FETCH STUDENT DATA =================
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        // fetch student info
        const { data } = await apiClient.get("/students/me");
        const student = data.user || data;
        setStudentData(student);

        // fetch broadcasts
        const broadcastsRes = await apiClient.get(`/students/broadcasts/${student._id}`);
        const fetchedBroadcasts = broadcastsRes.data.broadcasts.map((b) => ({ ...b, open: false }));
        setBroadcasts(fetchedBroadcasts);
        fetchedBroadcasts.forEach((b) => addNotification(b));

        // fetch assignments
        const assignmentRes = await apiClient.get(`/students/assignments/${student._id}`);
        setAssignments(Array.isArray(assignmentRes.data) ? assignmentRes.data : []);

        // fetch subjects
        const subjectRes = await apiClient.get(`/students/subjects/${student._id}`);
        setSubjects(Array.isArray(subjectRes.data) ? subjectRes.data : subjectRes.data.subjects || []);

        // fetch payments
        const paymentRes = await apiClient.get(`/students/payments/${student._id}`);
        setPayments(Array.isArray(paymentRes.data) ? paymentRes.data : []);

        // welcome notification
        addNotification({
          subjectName: "Welcome",
          message: `Welcome back, ${student.fullName || "Student"}! 👋`,
        });

        setLoading(false);
      } catch (err) {
        console.error("❌ Error fetching student data:", err);
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [navigate]);

  // ================= SOCKET.IO =================
  useEffect(() => {
    if (!studentData?._id) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(
      import.meta.env.VITE_API_URL || "https://studiesmasters-backend.onrender.com",
      {
        auth: { token, role: "student" },
        transports: ["websocket"],
      }
    );
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 Student connected:", socket.id);
    });

    socket.on("broadcast:new", (data) => {
      console.log("📢 New broadcast received:", data);
      addNotification(data);
    });

    return () => socket.disconnect();
  }, [studentData?._id]);

  // ================= HANDLE ASSIGNMENT SUBMISSION =================
  const handleSubmitAssignment = async (assignmentId) => {
    try {
      const formData = new FormData();
      if (typedAnswers[assignmentId]) formData.append("typedAnswer", typedAnswers[assignmentId]);
      if (fileAnswers[assignmentId]) formData.append("file", fileAnswers[assignmentId]);

      const res = await apiClient.post(`/students/assignments/submit/${assignmentId}`, formData);
      alert(res.data.message || "Assignment submitted!");
      // Clear local state
      setTypedAnswers((prev) => ({ ...prev, [assignmentId]: "" }));
      setFileAnswers((prev) => ({ ...prev, [assignmentId]: null }));
    } catch (err) {
      console.error(err);
      alert("Failed to submit assignment");
    }
  };

  if (loading) return <p className="text-center mt-10">Loading dashboard...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative">
      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                EduConnect
              </h1>
              <p className="text-sm text-gray-600">Student Portal</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative">
                <Bell className="h-6 w-6 text-gray-700" />
                {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white shadow-md rounded-lg border border-gray-100 z-50">
                  {notifications.length ? (
                    notifications.slice(0, 5).map((note) => (
                      <div
                        key={note.id}
                        className="p-3 border-b border-gray-100 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setShowNotifications(false);
                          document.querySelector('[data-value="broadcasts"]')?.click();
                          setBroadcasts((prev) =>
                            prev.map((b) => (b.id === note.id ? { ...b, open: true } : b))
                          );
                        }}
                      >
                        <p className="font-semibold">{note.subjectName}</p>
                        <p>{note.message}</p>
                        <p className="text-xs text-gray-400">{new Date(note.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="p-3 text-sm text-gray-500 text-center">No notifications</p>
                  )}
                </div>
              )}
            </div>

            <div className="text-center sm:text-right">
              <p className="font-semibold text-gray-900">{studentData.fullName || "Student"}</p>
              <p className="text-sm text-gray-600 truncate max-w-[150px] sm:max-w-full">{studentData.email}</p>
            </div>

            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <User className="h-6 w-6 text-white" />
            </div>

            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/");
              }}
              className="hover:bg-red-50 hover:text-red-600"
            >
              Logout
            </Button>
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
          </div>
        </div>
      </header>

<<<<<<< HEAD
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="dashboard-hero relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-8 text-white shadow-2xl sm:px-10 sm:py-10">
          <div className="relative z-10 max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100"><GraduationCap size={15} /> {studentData.curriculum || "StudiesMasters"} learner</span><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Hi, {studentData.fullName?.split(" ")[0] || "Student"}! Ready to learn?</h2><p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">Pick one simple thing to do next. Your classes and messages are waiting for you.</p><Button onClick={() => window.open(MOODLE_PORTAL_URL, "_blank", "noopener,noreferrer")} className="mt-6 h-12 rounded-xl bg-yellow-400 px-5 text-base font-bold text-slate-900 hover:bg-yellow-300"><PlayCircle size={19} /> Start a class <ChevronRight size={17} /></Button></div>
          <div className="dashboard-orb dashboard-orb-one" aria-hidden="true" /><div className="dashboard-orb dashboard-orb-two" aria-hidden="true" /><div className="dashboard-grid" aria-hidden="true" />
        </section>

        <section className="-mt-1 relative z-10 grid gap-4 sm:grid-cols-3">
          <Metric icon={<BookOpen size={20} />} label="My subjects" value={subjects.length} color="blue" />
          <Metric icon={<Mail size={20} />} label="New messages" value={unreadMessages.length} color="amber" />
          <Metric icon={<CalendarDays size={20} />} label="My learning plan" value={duration} color="violet" />
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8 gap-5">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <TabsTrigger value="overview" className="min-h-10 px-4">Home</TabsTrigger><TabsTrigger value="subjects" className="min-h-10 px-4">My subjects</TabsTrigger><TabsTrigger value="inbox" className="min-h-10 px-4">Messages {unreadMessages.length > 0 && <span className="rounded-full bg-blue-100 px-1.5 text-[10px] text-blue-700">{unreadMessages.length}</span>}</TabsTrigger><TabsTrigger value="payments" className="min-h-10 px-4">Payments</TabsTrigger>
          </TabsList>
          <TabsContent value="overview"><div className="grid gap-5 lg:grid-cols-5"><Card className="border-slate-200 shadow-sm lg:col-span-3"><CardHeader><CardTitle>What would you like to do?</CardTitle><CardDescription>Choose one quick action.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3"><button type="button" onClick={() => window.open(MOODLE_PORTAL_URL, "_blank", "noopener,noreferrer")} className="rounded-2xl bg-blue-600 p-4 text-left text-white shadow-sm transition hover:bg-blue-700"><PlayCircle size={24} /><span className="mt-5 block font-bold">Start a class</span><span className="mt-1 block text-xs text-blue-100">Open your learning portal</span></button><button type="button" onClick={() => setActiveTab("subjects")} className="rounded-2xl bg-violet-50 p-4 text-left text-violet-900 transition hover:bg-violet-100"><BookOpen size={24} /><span className="mt-5 block font-bold">My subjects</span><span className="mt-1 block text-xs text-violet-700">See your {subjects.length} classes</span></button><button type="button" onClick={() => setActiveTab("inbox")} className="rounded-2xl bg-amber-50 p-4 text-left text-amber-900 transition hover:bg-amber-100"><Mail size={24} /><span className="mt-5 block font-bold">Messages</span><span className="mt-1 block text-xs text-amber-700">{unreadMessages.length ? `${unreadMessages.length} new message${unreadMessages.length === 1 ? "" : "s"}` : "You are all caught up"}</span></button></CardContent></Card><Card className="border-slate-200 shadow-sm lg:col-span-2"><CardHeader><CardTitle>My learning plan</CardTitle><CardDescription>Your enrolment details.</CardDescription></CardHeader><CardContent className="grid gap-3"><Detail label="Current package" value={studentData.selectedPlan || studentData.package} /><Detail label="Level / grade" value={studentData.grade} /><Detail label="Study duration" value={duration} /><Button onClick={managePlanPayment} className="mt-1 bg-blue-600 hover:bg-blue-700"><WalletCards size={17} />Renew or upgrade plan</Button></CardContent></Card></div></TabsContent>
          <TabsContent value="subjects"><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{subjects.length ? subjects.map((subject) => <Card key={subject._id || subject.id || subject.name} className="group overflow-hidden border-slate-200 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><BookOpen size={21} /></span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{formatMoney(subject.price)}</span></div><h3 className="mt-5 text-lg font-bold">{subject.name}</h3><p className="mt-1 text-sm text-slate-500">{subject.grade || studentData.grade} · {subject.package || studentData.package}</p><button type="button" onClick={() => window.open(MOODLE_PORTAL_URL, "_blank", "noopener,noreferrer")} className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700">Open class <ChevronRight size={15} /></button></CardContent></Card>) : <EmptyState text="No subjects are assigned to your account yet." />}</section></TabsContent>
          <TabsContent value="inbox"><Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle>Inbox</CardTitle><CardDescription>Messages and announcements from StudiesMasters.</CardDescription></CardHeader><CardContent className="space-y-3">{broadcasts.length ? broadcasts.map((message) => <article key={message.id} onClick={() => setReadMessages((current) => current.includes(message.id) ? current : [...current, message.id])} className={`cursor-pointer rounded-2xl border p-4 transition hover:border-blue-200 hover:bg-blue-50/40 ${readMessages.includes(message.id) ? "border-slate-200 bg-white" : "border-blue-100 bg-blue-50/60"}`}><div className="flex gap-3"><span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${readMessages.includes(message.id) ? "bg-slate-200" : "bg-blue-600"}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{message.subjectName}</h3><span className="text-xs text-slate-400">{formatDate(message.createdAt)}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{message.message}</p><p className="mt-3 text-xs font-medium text-slate-400">From {message.sender?.fullName || "StudiesMasters Admin"}</p></div></div></article>) : <EmptyState text="No messages available." />}</CardContent></Card></TabsContent>
          <TabsContent value="payments"><Card className="border-slate-200 shadow-sm"><CardHeader><div className="flex flex-wrap items-center justify-between gap-4"><div><CardTitle>Payment history</CardTitle><CardDescription>Payments made for your StudiesMasters enrollment.</CardDescription></div><Button onClick={managePlanPayment} className="bg-blue-600 hover:bg-blue-700"><WalletCards size={17} />Renew or upgrade</Button></div></CardHeader><CardContent>{payments.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="pb-3 font-semibold">Date</th><th className="pb-3 font-semibold">Package</th><th className="pb-3 font-semibold">Duration</th><th className="pb-3 font-semibold">Amount</th><th className="pb-3 font-semibold">Status</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment._id || payment.id} className="border-b border-slate-100 last:border-0"><td className="py-4 text-slate-600">{formatDate(payment.transactionDate || payment.createdAt)}</td><td className="py-4 font-medium">{payment.package || studentData.package}</td><td className="py-4 text-slate-600">{payment.duration || duration}</td><td className="py-4 font-bold">{formatMoney(payment.amount)}</td><td className="py-4"><PaymentStatus status={payment.status} /></td></tr>)}</tbody></table></div> : <EmptyState text="No payments have been recorded for your account." />}</CardContent></Card></TabsContent>
        </Tabs>
      </main>
=======
      {/* TABS */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 gap-1 bg-white rounded-lg shadow-sm overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="broadcasts">Inbox</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <Card className="shadow-md p-4 sm:p-6">
              <CardHeader>
                <CardTitle>Welcome, {studentData.fullName || "Student"}!</CardTitle>
                <CardDescription>Your personalized EduConnect dashboard.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  Curriculum: {studentData.curriculum || "N/A"} <br />
                  Grade: {studentData.grade || "N/A"} <br />
                  Duration: {studentData.studyDuration || "N/A"} <br />
                  Package: {studentData.package || "N/A"}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subjects */}
          <TabsContent value="subjects">
            <Card className="shadow-md p-4 sm:p-6">
              <CardHeader>
                <CardTitle>Your Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                {subjects.length ? (
                  <ul className="list-disc pl-4 space-y-2 text-sm sm:text-base">
                    {subjects.map((s) => (
                      <li key={s._id}>
                        {s.name} - <span className="font-semibold text-blue-700">₵{s.price}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm sm:text-base">No subjects assigned.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Broadcasts */}
          <TabsContent value="broadcasts">
            <Card className="shadow-md p-4 sm:p-6">
              <CardHeader>
                <CardTitle>📥 Inbox</CardTitle>
                <CardDescription>Click to expand messages</CardDescription>
              </CardHeader>
              <CardContent>
                {broadcasts.length ? (
                  <ul className="space-y-3">
                    {broadcasts.map((b) => (
                      <li key={b.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() =>
                            setBroadcasts((prev) =>
                              prev.map((item) => (item.id === b.id ? { ...item, open: !item.open } : item))
                            )
                          }
                        >
                          <div>
                            <p className="font-semibold">{b.subjectName}</p>
                            <p className="text-xs text-gray-500">
                              From: {b.sender?.fullName || "Admin"} | {new Date(b.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span className="text-gray-400">{b.open ? "−" : "+"}</span>
                        </div>
                        {b.open && <div className="mt-2 text-sm text-gray-700">{b.message}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No messages available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments">
            <Card className="shadow-md p-4 sm:p-6">
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignments.length ? (
                  assignments.map((a) => (
                    <Card key={a._id} className="p-3 border rounded-md shadow-sm">
                      <p className="font-semibold">{a.title}</p>
                      <p className="text-sm text-gray-600">{a.description}</p>
                      <Textarea
                        placeholder="Type your answer here..."
                        value={typedAnswers[a._id] || ""}
                        onChange={(e) =>
                          setTypedAnswers((prev) => ({ ...prev, [a._id]: e.target.value }))
                        }
                        className="mt-2 w-full"
                      />
                      <input
                        type="file"
                        onChange={(e) =>
                          setFileAnswers((prev) => ({ ...prev, [a._id]: e.target.files[0] }))
                        }
                        className="mt-2"
                      />
                      <Button
                        onClick={() => handleSubmitAssignment(a._id)}
                        className="mt-2"
                      >
                        Submit Assignment
                      </Button>
                    </Card>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No assignments assigned.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments">
            <Card className="shadow-md p-4 sm:p-6">
              <CardHeader>
                <CardTitle>Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length ? (
                  <ul className="list-disc pl-4 space-y-2 text-sm sm:text-base">
                    {payments.map((p) => (
                      <li key={p._id}>
                        Amount: ₵{p.amount} | Package: {p.package} | Status:{" "}
                        <span
                          className={`font-semibold ${
                            p.status === "approved"
                              ? "text-green-600"
                              : p.status === "pending"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No payments recorded.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
    </div>
  );
}

<<<<<<< HEAD
function Metric({ icon, label, value, color }) { const colors = { blue: "bg-blue-600 shadow-blue-200", violet: "bg-violet-600 shadow-violet-200", emerald: "bg-emerald-600 shadow-emerald-200", amber: "bg-amber-500 shadow-amber-200" }; return <Card className="border-slate-200 shadow-sm"><CardContent className="flex items-center gap-3 p-4"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-lg ${colors[color]}`}>{icon}</span><div className="min-w-0"><p className="text-xl font-bold leading-none">{value}</p><p className="mt-1 truncate text-xs font-medium text-slate-500">{label}</p></div></CardContent></Card>; }
function Detail({ label, value }) { return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-800">{value || "Not available"}</p></div>; }
function EmptyState({ text }) { return <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">{text}</div>; }
function PaymentStatus({ status }) { const approved = ["confirmed", "approved"].includes(status); const rejected = status === "rejected"; return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${approved ? "bg-emerald-100 text-emerald-700" : rejected ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{approved && <CheckCircle2 size={13} />}{status || "pending"}</span>; }

=======
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
export default StudentDashboard;
