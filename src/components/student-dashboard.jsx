"use client";

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

const MOODLE_PORTAL_URL = import.meta.env.VITE_MOODLE_PORTAL_URL || "https://lms.studiesmasters.com/";

const formatDate = (value) =>
  value ? new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "Not available";

const formatMoney = (amount) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(Number(amount || 0));

// Timetable calendar helpers (the "My timetable" card on the Overview tab).
const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const dayNameOf = (value) => WEEK_DAYS[(new Date(value).getDay() + 6) % 7];
const formatTimetableDay = (value) =>
  new Date(value).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
const sameDay = (a, b) => {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
};

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
  const [notifications, setNotifications] = useState([]);
  const [timetable, setTimetable] = useState(null); // null = loading, [] = no classes this week
  const [syncingMoodle, setSyncingMoodle] = useState(false);
  const [moodleSyncMsg, setMoodleSyncMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const normaliseMessage = (message) => ({
    ...message,
    id: message._id || message.id || `message-${Date.now()}-${Math.random()}`,
    subjectName: message.subjectName || message.subject || "StudiesMasters",
  });

  // Server notifications are durable records (e.g. "New Class Added to Your
  // Timetable", "Class reminder", "Timetable published") fetched from
  // GET /students/:id/notifications and pushed live over the socket.
  // Live socket payloads carry `notificationId` (not `_id`), so prefer it —
  // otherwise per-item Mark as read / Dismiss would PATCH a random id.
  const normaliseNotification = (notification) => ({
    ...notification,
    id:
      notification._id ||
      notification.notificationId ||
      notification.id ||
      `notification-${Date.now()}-${Math.random()}`,
    title: notification.title || "Notification",
    message: notification.message || "",
    read: Boolean(notification.read),
    createdAt: notification.createdAt || new Date().toISOString(),
  });

  // Re-fetch this week's timetable. Called on mount and again whenever a class /
  // timetable event arrives over the socket, so the "My timetable" calendar
  // updates live the moment a timetable is fed in for this student.
  const refreshTimetable = async (id = null) => {
    const studentId = id || studentData?._id;
    if (!studentId) return;
    try {
      const { data } = await apiClient.get(`/students/${studentId}/timetable`);
      setTimetable(data?.timetable || []);
    } catch (err) {
      console.error("Failed to refresh timetable:", err);
    }
  };

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
        const notificationsRequest = apiClient
          .get(`/students/${student._id}/notifications`)
          .catch(() => ({ data: { notifications: [] } }));
        const timetableRequest = apiClient
          .get(`/students/${student._id}/timetable`)
          .catch(() => ({ data: { timetable: [] } }));
        const [broadcastsResponse, notificationsResponse, timetableResponse] = await Promise.all([
          broadcastsRequest,
          notificationsRequest,
          timetableRequest,
        ]);
        if (!active) return;

        setStudentData(student);
        setSubjects(Array.isArray(data.subjects) ? data.subjects : student.subjectsEnrolled || []);
        setPayments(Array.isArray(data.payments) ? data.payments : []);
        setBroadcasts((broadcastsResponse.data.broadcasts || []).map(normaliseMessage));
        setNotifications((notificationsResponse.data?.notifications || []).map(normaliseNotification));
        setTimetable(timetableResponse.data?.timetable || []);
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
      auth: { token, role: "student", userId: studentData._id },
      query: { userId: studentData._id, role: "student" },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    // Join this student's private room so server-side emits reach us.
    const joinRoom = () => socket.emit("student-join", studentData._id);
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);

    socket.on("broadcast:new", (message) => setBroadcasts((current) => [normaliseMessage(message), ...current]));

    // Durable notification payloads arrive as "notification:new"; the timetable
    // lifecycle events carry a class/date payload instead of a title+message.
    const pushNotification = (payload, fallbackTitle) => {
      if (!payload) return;
      const raw = payload.message
        ? payload
        : {
            title: payload.title || fallbackTitle,
            message: `${payload.subject || payload.classGroup || "Class"}${payload.date ? ` on ${formatDate(payload.date)}` : ""}`,
            createdAt: new Date().toISOString(),
          };
      setNotifications((current) => [normaliseNotification(raw), ...current]);
    };

    // Bell entry + live timetable refresh. The socket payload for class /
    // timetable events carries a class/date (not a title+message), so the
    // calendar is re-fetched so the new class shows up immediately.
    const onTimetableEvent = (payload, fallbackTitle) => {
      pushNotification(payload, fallbackTitle);
      refreshTimetable(studentData._id);
    };

    socket.on("notification:new", (payload) => pushNotification(payload, "Notification"));
    socket.on("timetable:published", (payload) => onTimetableEvent(payload, "Timetable published"));
    socket.on("class:created", (payload) => onTimetableEvent(payload, "New Class Added to Your Timetable"));
    socket.on("class:upcoming", (payload) => onTimetableEvent(payload, "Upcoming class"));
    socket.on("class:starting", (payload) => pushNotification(payload, "Class reminder"));
    socket.on("class:live", (payload) => pushNotification(payload, "Class is live"));
    socket.on("class:ended", (payload) => pushNotification(payload, "Class ended"));
    socket.on("class:cancelled", (payload) => onTimetableEvent(payload, "Class cancelled"));
    socket.on("meeting:updated", (payload) => pushNotification(payload, "Class link updated"));

    return () => socket.disconnect();
  }, [studentData?._id]);

  const unreadMessages = broadcasts.filter((message) => !readMessages.includes(message.id));
  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const totalUnread = unreadMessages.length + unreadNotifications.length;
  const duration = studentData?.studyDuration || payments[0]?.duration || "Not set";

  // The bell shows durable notifications (timetable/class events) first, then
  // the most recent admin broadcasts.
  const bellItems = [
    ...notifications.map((notification) => ({ ...notification, kind: "notification" })),
    ...broadcasts.map((message) => ({
      ...message,
      kind: "broadcast",
      title: message.subjectName,
      read: readMessages.includes(message.id),
    })),
  ]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 15);

  const openInbox = (message) => {
    setReadMessages((current) => (current.includes(message.id) ? current : [...current, message.id]));
    setShowNotifications(false);
    setActiveTab("inbox");
  };

  // Persist "read" for server notifications so the badge stays accurate.
  // Clicking a notification marks it read (and hides it via the
  // "unread only" filter); Dismiss deletes it for good.
  const markNotificationRead = async (notification) => {
    if (!notification || notification.kind === "broadcast" || notification.read) return;
    if (String(notification.id || "").startsWith("notification-")) return;
    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
    );
    try {
      await apiClient.patch(`/students/${studentData._id}/notifications/${notification.id}/read`);
    } catch (err) {
      console.error("Failed to mark notification read:", err);
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, read: false } : item))
      );
    }
  };

  // Mark every durable notification as read (server + local state).
  const markAllNotificationsRead = async () => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    try {
      await apiClient.patch(`/students/${studentData._id}/notifications/read-all`);
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    }
  };

  // Dismiss (delete) one notification — removes the dummy test rows too.
  const dismissNotification = async (notification) => {
    if (!notification || notification.kind === "broadcast") return;
    if (String(notification.id || "").startsWith("notification-")) {
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      return;
    }
    const previous = notifications;
    setNotifications((current) => current.filter((item) => item.id !== notification.id));
    try {
      await apiClient.delete(`/students/${studentData._id}/notifications/${notification.id}`);
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
      setNotifications(previous);
    }
  };

  // Clear read notifications on the server (keeps unread ones by default).
  const clearReadNotifications = async () => {
    const previous = notifications;
    setNotifications((current) => current.filter((item) => !item.read));
    try {
      await apiClient.delete(`/students/${studentData._id}/notifications`);
    } catch (err) {
      console.error("Failed to clear read notifications:", err);
      setNotifications(previous);
    }
  };

  // Push this week's timetable into the student's Moodle calendar (user
  // events). Moodle is where students access their live classes from.
  const syncTimetableToMoodle = async () => {
    setSyncingMoodle(true);
    setMoodleSyncMsg("");
    try {
      const { data } = await apiClient.post("/moodle/sync/timetable");
      setMoodleSyncMsg(
        data?.synced
          ? `Synced to Moodle ✔ ${data.created || 0} event(s) created, ${data.updated || 0} updated.${data.dryRun ? " (dry-run mode — connect MOODLE_WS_TOKEN for real events)" : ""}`
          : `Moodle said: ${data?.reason || "nothing to sync"}.`
      );
    } catch (err) {
      console.error("Moodle timetable sync failed:", err);
      setMoodleSyncMsg(err.response?.data?.message || "Could not sync to Moodle right now.");
    } finally {
      setSyncingMoodle(false);
    }
  };

  const openBellItem = (item) => {
    if (item.kind === "broadcast") openInbox(item);
    else markNotificationRead(item);
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

  // SSO: request a signed, short-lived Moodle URL from the backend, then open it.
  const openMoodleClass = async (courseId) => {
    try {
      const { data } = await apiClient.get("/moodle/sso", {
        params: courseId ? { course: courseId } : {},
      });
      if (data.url) window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to open Moodle class:", err);
      window.open(MOODLE_PORTAL_URL, "_blank", "noopener,noreferrer");
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-600">Loading your learning space...</div>;

  if (loadError || !studentData) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><Card className="w-full max-w-md"><CardContent className="p-7 text-center"><h1 className="text-xl font-bold">Dashboard unavailable</h1><p className="mt-2 text-sm text-slate-600">{loadError || "We could not load your profile."}</p><Button onClick={() => navigate("/login", { replace: true })} className="mt-6 w-full bg-blue-600 hover:bg-blue-700 sm:w-auto">Return to sign in</Button></CardContent></Card></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 sm:h-10 sm:w-10"><BookOpen size={18} className="sm:hidden" /><BookOpen size={20} className="hidden sm:block" /></div>
            <div className="min-w-0"><h1 className="truncate text-sm font-bold leading-none sm:text-base">StudiesMasters</h1><p className="mt-0.5 hidden text-xs text-slate-500 sm:block">Student learning portal</p></div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <div className="relative">
              <button type="button" onClick={() => setShowNotifications((open) => !open)} className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 sm:h-10 sm:w-10" aria-label="Open notifications">
                <Bell size={18} className="sm:hidden" /><Bell size={20} className="hidden sm:block" />
                {totalUnread > 0 && <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">{totalUnread > 9 ? "9+" : totalUnread}</span>}
              </button>
              {showNotifications && <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><p className="font-bold">Notifications</p><span className="text-xs text-slate-500">{totalUnread} unread</span></div>
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2"><button type="button" onClick={markAllNotificationsRead} className="text-xs font-bold text-blue-600 hover:text-blue-700">Mark all as read</button><button type="button" onClick={clearReadNotifications} className="text-xs font-semibold text-slate-500 hover:text-slate-700">Clear read</button></div>
                <div className="max-h-80 overflow-y-auto">{bellItems.length ? bellItems.map((item) => <div key={`${item.kind}-${item.id}`} className="flex items-start gap-2 border-b border-slate-100 px-4 py-3 hover:bg-blue-50"><button type="button" onClick={() => openBellItem(item)} className="block min-w-0 flex-1 text-left"><div className="flex items-start gap-3"><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.read ? "bg-slate-200" : "bg-blue-600"}`} /><span className="min-w-0"><span className="block text-sm font-semibold">{item.title || "StudiesMasters"}</span><span className="mt-1 block truncate text-xs text-slate-600">{item.message}</span><span className="mt-1 block text-[11px] text-slate-400">{formatDate(item.createdAt)}</span></span></div></button>{item.kind === "notification" && <div className="flex shrink-0 flex-col items-end gap-1">{!item.read && <button type="button" onClick={() => markNotificationRead(item)} className="rounded-lg px-2 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50" aria-label="Mark notification as read">Mark as read</button>}<button type="button" onClick={() => dismissNotification(item)} className="rounded-lg px-2 py-1 text-[11px] font-bold text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Dismiss notification">Dismiss</button></div>}</div>) : <p className="p-5 text-center text-sm text-slate-500">You're all caught up.</p>}</div>
                <button type="button" onClick={() => { setShowNotifications(false); setActiveTab("inbox"); }} className="w-full px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50">View inbox</button>
              </div>}
            </div>
            <div className="hidden text-right md:block"><p className="max-w-40 truncate text-sm font-bold">{studentData.fullName}</p><p className="max-w-40 truncate text-xs text-slate-500">{studentData.email}</p></div>
            <div className="relative">
              <button type="button" onClick={logout} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white sm:h-10 sm:w-10" aria-label="Logout"><User size={16} className="sm:hidden" /><User size={18} className="hidden sm:block" /></button>
            </div>
            <button type="button" onClick={logout} className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 md:inline-flex"><LogOut size={16} className="mr-2" />Logout</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8">
        <section className="dashboard-hero relative overflow-hidden rounded-2xl bg-slate-900 px-4 py-5 text-white shadow-2xl sm:rounded-3xl sm:px-10 sm:py-10">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100"><GraduationCap size={15} /> {studentData.curriculum || "StudiesMasters"} learner</span>
            <h2 className="mt-3 text-2xl font-bold tracking-tight sm:mt-4 sm:text-4xl">Hi, {studentData.fullName?.split(" ")[0] || "Student"}! Ready to learn?</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:mt-3 sm:text-base">Pick one simple thing to do next. Your classes and messages are waiting for you.</p>
            <Button onClick={() => openMoodleClass()} className="mt-5 h-12 w-full rounded-xl bg-yellow-400 px-5 text-base font-bold text-slate-900 hover:bg-yellow-300 sm:mt-6 sm:w-auto"><PlayCircle size={19} /> Start a class <ChevronRight size={17} /></Button>
          </div>
          <div className="dashboard-orb dashboard-orb-one" aria-hidden="true" /><div className="dashboard-orb dashboard-orb-two" aria-hidden="true" /><div className="dashboard-grid" aria-hidden="true" />
        </section>

        <section className="-mt-1 relative z-10 grid grid-cols-3 gap-1.5 sm:gap-4">
          <Metric icon={<><BookOpen size={14} className="sm:hidden" /><BookOpen size={20} className="hidden sm:block" /></>} label="Subjects" value={subjects.length} color="blue" />
          <Metric icon={<><Mail size={14} className="sm:hidden" /><Mail size={20} className="hidden sm:block" /></>} label="Messages" value={unreadMessages.length} color="amber" />
          <Metric icon={<><CalendarDays size={14} className="sm:hidden" /><CalendarDays size={20} className="hidden sm:block" /></>} label="Plan" value={duration} color="violet" />
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6 gap-4 sm:mt-8 sm:gap-5">
          <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
            <TabsTrigger value="overview" className="min-h-10 shrink-0 px-3 sm:px-4">Home</TabsTrigger><TabsTrigger value="subjects" className="min-h-10 shrink-0 px-3 sm:px-4">My subjects</TabsTrigger><TabsTrigger value="inbox" className="min-h-10 shrink-0 px-3 sm:px-4">Messages {unreadMessages.length > 0 && <span className="rounded-full bg-blue-100 px-1.5 text-[10px] text-blue-700">{unreadMessages.length}</span>}</TabsTrigger><TabsTrigger value="payments" className="min-h-10 shrink-0 px-3 sm:px-4">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="min-w-0"><CardTitle>My timetable</CardTitle><CardDescription>Your classes for this week (Mon–Sun). Dummy test classes appear here with a DUMMY- code.</CardDescription></div>
                <Button variant="outline" size="sm" disabled={syncingMoodle} onClick={syncTimetableToMoodle} className="shrink-0 rounded-full">{syncingMoodle ? "Syncing…" : "Sync to Moodle"}</Button>
              </CardHeader>
              <CardContent>
                {moodleSyncMsg && <p className="mb-3 rounded-xl bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">{moodleSyncMsg}</p>}
                {timetable === null ? <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Loading your timetable…</p> : timetable.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {WEEK_DAYS.map((day) => {
                      const dayItems = timetable.filter((item) => dayNameOf(item.date) === day);
                      if (!dayItems.length) return null;
                      const today = dayItems.some((item) => sameDay(item.date, new Date()));
                      return (
                        <div key={day} className={`rounded-2xl border p-3 ${today ? "border-blue-300 bg-blue-50/60" : "border-slate-200"}`}>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{formatTimetableDay(dayItems[0].date)}{today ? " · Today" : ""}</p>
                          <div className="mt-2 space-y-2">
                            {dayItems.map((item) => (
                              <div key={item.id} className="rounded-xl bg-white px-3 py-2 shadow-sm">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm font-bold">{item.subject || "Class"}</p>
                                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${item.status === "live" ? "bg-red-100 text-red-700" : item.status === "completed" ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}`}>{item.status}</span>
                                </div>
                                <p className="mt-1 text-xs text-slate-600">{item.startTime} – {item.endTime}</p>
                                <p className="text-xs text-slate-400">{item.teacher}{item.groupCode ? ` · ${item.groupCode}` : ""}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No classes on your timetable this week yet.</p>}
              </CardContent>
            </Card>
            <div className="mt-4 grid gap-4 lg:grid-cols-5">
              <Card className="border-slate-200 shadow-sm lg:col-span-3">
                <CardHeader><CardTitle>What would you like to do?</CardTitle><CardDescription>Choose one quick action.</CardDescription></CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
                  <button type="button" onClick={() => setActiveTab("subjects")} className="flex items-center gap-3 rounded-2xl bg-violet-50 p-3.5 text-left text-violet-900 transition hover:bg-violet-100 sm:flex-col sm:items-start sm:p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 sm:h-auto sm:w-auto sm:bg-transparent"><BookOpen size={22} /></span><span className="min-w-0"><span className="block font-bold">My subjects</span><span className="mt-0.5 block text-xs text-violet-700 sm:mt-1">See your {subjects.length} classes</span></span></button>
                  <button type="button" onClick={openMoodleClass} className="flex items-center gap-3 rounded-2xl bg-red-50 p-3.5 text-left text-red-900 transition hover:bg-red-100 sm:flex-col sm:items-start sm:p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 sm:h-auto sm:w-auto sm:bg-transparent"><PlayCircle size={22} /></span><span className="min-w-0"><span className="block font-bold">Live classes</span><span className="mt-0.5 block text-xs text-red-700 sm:mt-1">Join on Moodle — your classes, calendar and Meet links all live there</span></span></button>
                  <button type="button" onClick={() => setActiveTab("inbox")} className="flex items-center gap-3 rounded-2xl bg-amber-50 p-3.5 text-left text-amber-900 transition hover:bg-amber-100 sm:flex-col sm:items-start sm:p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 sm:h-auto sm:w-auto sm:bg-transparent"><Mail size={22} /></span><span className="min-w-0"><span className="block font-bold">Messages</span><span className="mt-0.5 block text-xs text-amber-700 sm:mt-1">{unreadMessages.length ? `${unreadMessages.length} new message${unreadMessages.length === 1 ? "" : "s"}` : "You are all caught up"}</span></span></button>
                  <button type="button" onClick={managePlanPayment} className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-3.5 text-left text-emerald-900 transition hover:bg-emerald-100 sm:flex-col sm:items-start sm:p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 sm:h-auto sm:w-auto sm:bg-transparent"><WalletCards size={22} /></span><span className="min-w-0"><span className="block font-bold">My plan</span><span className="mt-0.5 block text-xs text-emerald-700 sm:mt-1">Renew or upgrade</span></span></button>
                </CardContent>
              </Card>
              <Card className="border-slate-200 shadow-sm lg:col-span-2">
                <CardHeader><CardTitle>My learning plan</CardTitle><CardDescription>Your enrolment details.</CardDescription></CardHeader>
                <CardContent className="grid gap-3">
                  <Detail label="Current package" value={studentData.selectedPlan || studentData.package} />
                  <Detail label="Level / grade" value={studentData.grade} />
                  <Detail label="Study duration" value={duration} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="subjects"><section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{subjects.length ? subjects.map((subject) => <Card key={subject._id || subject.id || subject.name} className="group overflow-hidden border-slate-200 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><BookOpen size={21} /></span><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{formatMoney(subject.price)}</span></div><h3 className="mt-5 text-lg font-bold">{subject.name}</h3><p className="mt-1 text-sm text-slate-500">{subject.grade || studentData.grade} - {subject.package || studentData.package}</p><button type="button" onClick={() => openMoodleClass(subject.moodleCourseId)} className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-blue-600 hover:text-blue-700">Open class <ChevronRight size={15} /></button></CardContent></Card>) : <EmptyState text="No subjects are assigned to your account yet." />}</section></TabsContent>
          <TabsContent value="inbox"><Card className="border-slate-200 shadow-sm"><CardHeader><CardTitle>Inbox</CardTitle><CardDescription>Messages and announcements from StudiesMasters.</CardDescription></CardHeader><CardContent className="space-y-3">{broadcasts.length ? broadcasts.map((message) => <article key={message.id} onClick={() => setReadMessages((current) => current.includes(message.id) ? current : [...current, message.id])} className={`cursor-pointer rounded-2xl border p-4 transition hover:border-blue-200 hover:bg-blue-50/40 ${readMessages.includes(message.id) ? "border-slate-200 bg-white" : "border-blue-100 bg-blue-50/60"}`}><div className="flex gap-3"><span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${readMessages.includes(message.id) ? "bg-slate-200" : "bg-blue-600"}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{message.subjectName}</h3><span className="text-xs text-slate-400">{formatDate(message.createdAt)}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{message.message}</p><p className="mt-3 text-xs font-medium text-slate-400">From {message.sender?.fullName || "StudiesMasters Admin"}</p></div></div></article>) : <EmptyState text="No messages available." />}</CardContent></Card></TabsContent>
          <TabsContent value="payments"><Card className="border-slate-200 shadow-sm"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Payment history</CardTitle><CardDescription>Payments made for your StudiesMasters enrollment.</CardDescription></div><Button onClick={managePlanPayment} className="w-full bg-blue-600 hover:bg-blue-700 sm:w-auto"><WalletCards size={17} />Renew or upgrade</Button></div></CardHeader><CardContent>{payments.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><tr><th className="pb-3 font-semibold">Date</th><th className="pb-3 font-semibold">Package</th><th className="pb-3 font-semibold">Duration</th><th className="pb-3 font-semibold">Amount</th><th className="pb-3 font-semibold">Status</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment._id || payment.id} className="border-b border-slate-100 last:border-0"><td className="py-4 text-slate-600">{formatDate(payment.transactionDate || payment.createdAt)}</td><td className="py-4 font-medium">{payment.package || studentData.package}</td><td className="py-4 text-slate-600">{payment.duration || duration}</td><td className="py-4 font-bold">{formatMoney(payment.amount)}</td><td className="py-4"><PaymentStatus status={payment.status} /></td></tr>)}</tbody></table></div> : <EmptyState text="No payments have been recorded for your account." />}</CardContent></Card></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Metric({ icon, label, value, color }) { const colors = { blue: "bg-blue-600 shadow-blue-200", violet: "bg-violet-600 shadow-violet-200", emerald: "bg-emerald-600 shadow-emerald-200", amber: "bg-amber-500 shadow-amber-200" }; return <Card className="border-slate-200 shadow-sm"><CardContent className="flex items-center gap-1.5 p-2 sm:gap-3 sm:p-4"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white shadow-lg sm:h-10 sm:w-10 sm:rounded-xl ${colors[color]}`}>{icon}</span><div className="min-w-0"><p className="text-sm font-bold leading-none sm:text-xl">{value}</p><p className="mt-0.5 truncate text-[9px] font-medium text-slate-500 sm:mt-1 sm:text-xs">{label}</p></div></CardContent></Card>; }
function Detail({ label, value }) { return <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 font-bold text-slate-800">{value || "Not available"}</p></div>; }
function EmptyState({ text }) { return <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">{text}</div>; }
function PaymentStatus({ status }) { const approved = ["confirmed", "approved"].includes(status); const rejected = status === "rejected"; return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${approved ? "bg-emerald-100 text-emerald-700" : rejected ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{approved && <CheckCircle2 size={13} />}{status || "pending"}</span>; }

export default StudentDashboard;