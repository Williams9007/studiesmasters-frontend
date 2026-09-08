"use client";

import { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Button } from "./ui/button";
import {
  Users,
  FileCheck,
  MessageSquare,
  BarChart3,
  Bell,
  LogOut,
  Send,
  Monitor,
  MailOpen,
  CheckCheck,
  Paperclip,
  Image as ImageIcon,
  ExternalLink,
  X,
} from "lucide-react";
import ManageClass from "./ManageClass";
import { TeachersModule, ClassGroupsModule, TimetableApprovalsModule, SearchModule, SettingsModule } from "./qao/TutorManagerModules.jsx";
import CalendarView from "./qao/CalendarView.jsx";
import LiveClasses from "./qao/LiveClasses.jsx";
import LiveOpsCenter from "./virtual/LiveOpsCenter.jsx";
import ReportsModule from "./qao/ReportsModule.jsx";
import LeaveRequestsModule from "./qao/LeaveRequestsModule.jsx";
import WorkloadModule from "./qao/WorkloadModule.jsx";
import PerformanceModule from "./qao/PerformanceModule.jsx";
import NotificationCenter from "./qao/NotificationCenter.jsx";
import AuditLogsModule from "./qao/AuditLogsModule.jsx";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const BASE_URL = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

const getAttachmentUrl = (attachment) => {
  if (!attachment) return "";
  if (/^https?:\/\//i.test(attachment)) return attachment;
  return `${BASE_URL}${attachment.startsWith("/") ? attachment : `/${attachment}`}`;
};

const isImageAttachment = (attachment) => /\.(avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(attachment || "");

function TutorManagerDashboard() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [resources, setResources] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState({ receiver: "", subject: "", message: "" });
  const [classBroadcast, setClassBroadcast] = useState({ classGroupId: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sendingClass, setSendingClass] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showNotifs, setShowNotifs] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [classGroups, setClassGroups] = useState([]);
  const [overview, setOverview] = useState(null);
  const [reviewComment, setReviewComment] = useState({});

  const token = localStorage.getItem("qaoToken");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    if (!token) {
      navigate("/qao/access");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [
          resTeachers,
          resResources,
          resKpis,
          resMessages,
          resNotifs,
          resClassGroups,
          resOverview,
        ] = await Promise.all([
          apiClient.get("/qao/teachers", config),
          apiClient.get("/qao/resources", config),
          apiClient.get("/qao/kpis", config),
          apiClient.get("/qao/sent", config),
          apiClient.get("/qao/notifications", config),
          apiClient.get("/qao/class-groups", config),
          apiClient.get("/qao/overview", config).catch(() => null),
        ]);

        setTeachers(Array.isArray(resTeachers.data?.teachers) ? resTeachers.data.teachers : []);
        setResources(Array.isArray(resResources.data?.resources) ? resResources.data.resources : []);
        setKpis(Array.isArray(resKpis.data?.kpis) ? resKpis.data.kpis : []);
        setMessages(Array.isArray(resMessages.data?.messages) ? resMessages.data.messages : []);
        setNotifications(Array.isArray(resNotifs.data?.notifications) ? resNotifs.data.notifications : []);
        setClassGroups(Array.isArray(resClassGroups.data?.groups) ? resClassGroups.data.groups : []);
        setOverview(resOverview?.data?.overview || null);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const handleSendMessage = async () => {
    if (!newMessage.receiver || !newMessage.subject || !newMessage.message) {
      alert("Please fill in all fields.");
      return;
    }
    setSending(true);
    try {
      let recipients;
      if (newMessage.receiver === "__all__") {
        recipients = teachers.map((t) => t._id);
      } else {
        recipients = [newMessage.receiver];
      }
      await apiClient.post(
        "/qao/broadcast",
        { recipients, subject: newMessage.subject, message: newMessage.message },
        config
      );
      alert("Message sent successfully!");
      setNewMessage({ receiver: "", subject: "", message: "" });
      fetchSentMessages();
    } catch (err) {
      console.error("Send message error:", err);
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleClassBroadcast = async () => {
    if (!classBroadcast.classGroupId || !classBroadcast.subject || !classBroadcast.message) {
      alert("Please select a class and fill in subject and message.");
      return;
    }
    setSendingClass(true);
    try {
      const res = await apiClient.post(
        "/qao/broadcast/class",
        {
          classGroupId: classBroadcast.classGroupId,
          subject: classBroadcast.subject,
          message: classBroadcast.message,
        },
        config
      );
      alert(res.data?.message || "Broadcast sent to class successfully!");
      setClassBroadcast({ classGroupId: "", subject: "", message: "" });
      fetchSentMessages();
    } catch (err) {
      console.error("Broadcast to class error:", err);
      alert(err.response?.data?.message || "Failed to send broadcast to class.");
    } finally {
      setSendingClass(false);
    }
  };

  const fetchSentMessages = async () => {
    try {
      const res = await apiClient.get("/qao/sent", config);
      setMessages(Array.isArray(res.data?.messages) ? res.data.messages : []);
    } catch (err) {
      console.error("Fetch sent messages error:", err);
    }
  };

  const handleDeleteSentMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;
    try {
      await apiClient.delete(`/qao/messages/${messageId}`, config);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (err) {
      console.error("Delete message error:", err);
      alert("Failed to delete message.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("qaoToken");
    localStorage.removeItem("qaoUser");
    navigate("/qao/access");
  };

  const handleApproval = async (id, approved) => {
    const comment = reviewComment[id] || "";
    try {
      await apiClient.put(`/qao/resources/${id}`, { approved, comment }, config);
      setResources((prev) => prev.map((r) => (r._id === id ? { ...r, approved, comment } : r)));
      setReviewComment((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error("Approval error:", err);
    }
  };

  const unreadNotifications = notifications.filter((notification) => !notification.read);

  const markNotificationRead = async (notification) => {
    if (!notification || notification.read) return;
    setNotifications((current) => current.map((item) => (
      item._id === notification._id ? { ...item, read: true } : item
    )));
    try {
      await apiClient.patch(`/qao/notifications/${notification._id}/read`, {}, config);
    } catch (err) {
      console.error("Mark notification read error:", err);
      setNotifications((current) => current.map((item) => (
        item._id === notification._id ? { ...item, read: false } : item
      )));
    }
  };

  const openNotification = (notification) => {
    setSelectedNotification(notification);
    markNotificationRead(notification);
  };

  const closeNotification = () => {
    setSelectedNotification(null);
    setImagePreviewUrl("");
  };

  const markAllNotificationsRead = async () => {
    if (!unreadNotifications.length) return;
    const unreadIds = new Set(unreadNotifications.map((notification) => notification._id));
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    try {
      await apiClient.patch("/qao/notifications/read-all", {}, config);
    } catch (err) {
      console.error("Mark all notifications read error:", err);
      setNotifications((current) => current.map((item) => (
        unreadIds.has(item._id) ? { ...item, read: false } : item
      )));
    }
  };

  const formatNotificationDate = (date) => {
    if (!date) return "Just now";
    return new Intl.DateTimeFormat(undefined, {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    }).format(new Date(date));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading Tutor Manager Dashboard...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-violet-50 to-pink-50 px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      {/* Header Card */}
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-white/95 p-4 shadow-xl sm:rounded-[2rem] sm:p-6 sm:shadow-2xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <div className="absolute -right-20 top-10 h-56 w-56 rounded-full bg-violet-200/60 blur-3xl" />
        <div className="absolute left-8 top-0 h-36 w-36 rounded-full bg-pink-200/70 blur-3xl" />

        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-fuchsia-700 sm:text-sm sm:tracking-[0.35em]">Tutor Manager</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:mt-3 sm:text-3xl sm:sm:text-4xl">
              Streamline teacher approvals, communication, and resources.
            </h1>
            <p className="mt-2 text-xs leading-6 text-slate-600 sm:mt-4 sm:text-sm sm:leading-7">
              This dashboard helps you monitor tutor activity, review learning assets, and keep your team aligned.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button onClick={handleLogout} className="h-10 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 text-xs font-semibold text-white shadow-md sm:h-11 sm:rounded-xl sm:px-5 sm:text-sm sm:shadow-lg">
              <LogOut className="h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="sm:inline">Logout</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowNotifs((open) => !open)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 sm:h-11 sm:rounded-xl sm:px-4 sm:text-sm"
            >
              <Bell className="h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Notifications</span>
              {unreadNotifications.length > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white sm:ml-2 sm:h-5 sm:min-w-[1.25rem] sm:px-2 sm:text-[11px]">
                  {unreadNotifications.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Notifications */}
      {showNotifs && (
        <motion.div
          className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:mt-5 sm:rounded-[1.75rem] sm:p-5 sm:shadow-2xl"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-4 py-3 sm:px-5 sm:py-4">
            <div><p className="text-sm font-bold text-slate-900 sm:text-base">Notification inbox</p><p className="mt-0.5 text-xs text-slate-500">{unreadNotifications.length ? `${unreadNotifications.length} unread message${unreadNotifications.length === 1 ? "" : "s"}` : "You are all caught up"}</p></div>
            <div className="flex items-center gap-1"><button type="button" onClick={markAllNotificationsRead} disabled={!unreadNotifications.length} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-violet-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"><CheckCheck className="h-4 w-4" /><span className="hidden sm:inline">Mark all read</span></button><button type="button" onClick={() => setShowNotifs(false)} className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900" aria-label="Close notifications"><X className="h-4 w-4" /></button></div>
          </div>
          <div className="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto">
            {notifications.length ? notifications.map((notification) => <button key={notification._id} type="button" onClick={() => openNotification(notification)} className={`flex w-full gap-3 px-4 py-3.5 text-left transition hover:bg-violet-50/60 sm:px-5 ${notification.read ? "bg-white" : "bg-violet-50/70"}`}><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.read ? "bg-slate-200" : "bg-violet-600 ring-4 ring-violet-100"}`} /><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-3"><span className={`truncate text-sm ${notification.read ? "font-medium text-slate-700" : "font-bold text-slate-900"}`}>{notification.type === "broadcast" ? "New broadcast" : "System update"}</span><span className="shrink-0 text-[11px] text-slate-400">{formatNotificationDate(notification.createdAt)}</span></span><span className={`mt-1 block truncate text-xs sm:text-sm ${notification.read ? "text-slate-500" : "text-slate-700"}`}>{notification.message}</span></span></button>) : <div className="px-5 py-12 text-center"><MailOpen className="mx-auto h-8 w-8 text-violet-200" /><p className="mt-3 text-sm font-semibold text-slate-700">Your inbox is clear</p><p className="mt-1 text-xs text-slate-500">New notifications will appear here.</p></div>}
          </div>
          <div className="hidden">
          <p className="text-sm font-semibold text-slate-900">Recent notifications</p>
          <div className="mt-2 space-y-2 sm:mt-3 sm:space-y-3">
            {notifications.length > 0 ? notifications.map((n) => (
              <div key={n._id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 sm:rounded-3xl sm:px-4 sm:py-3 sm:text-sm">
                <span>{n.message}</span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {n.link && (
                    <a href={n.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700">
                      ðŸ”— Open Link
                    </a>
                  )}
                  {n.attachment && (
                    <a href={`${BASE_URL}${n.attachment}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700">
                      ðŸ“Ž View Attachment
                    </a>
                  )}
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-500 sm:text-sm">No notifications available.</p>
            )}
          </div>
          </div>
        </motion.div>
      )}

      {selectedNotification && (() => {
        const attachmentUrl = getAttachmentUrl(selectedNotification.attachment);
        const attachmentIsImage = isImageAttachment(selectedNotification.attachment);

        return <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6" onClick={closeNotification}><motion.article initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-[1.75rem]" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between bg-gradient-to-r from-violet-700 to-fuchsia-600 px-5 py-5 text-white sm:px-6"><div className="pr-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Inbox message</p><h2 className="mt-1 text-lg font-bold">{selectedNotification.type === "broadcast" ? "New broadcast" : "System update"}</h2></div><button type="button" onClick={closeNotification} className="rounded-lg p-2 text-white/80 hover:bg-white/15 hover:text-white" aria-label="Close message"><X className="h-5 w-5" /></button></div><div className="p-5 sm:p-6"><p className="text-xs font-medium text-slate-400">{formatNotificationDate(selectedNotification.createdAt)}</p><p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700 sm:text-base">{selectedNotification.message}</p>{attachmentIsImage && <button type="button" onClick={() => setImagePreviewUrl(attachmentUrl)} className="mt-5 block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left transition hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2" aria-label="View attached image full size"><img src={attachmentUrl} alt="Image attached by admin" className="max-h-80 w-full object-contain" /><span className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-violet-700"><ImageIcon className="h-4 w-4" />Click image to view full size</span></button>}{(selectedNotification.link || attachmentUrl) && <div className="mt-6 flex flex-wrap gap-2">{selectedNotification.link && <a href={selectedNotification.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"><ExternalLink className="h-4 w-4" />Open link</a>}{attachmentUrl && <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><Paperclip className="h-4 w-4" />{attachmentIsImage ? "Open image" : "View attachment"}</a>}</div>}</div></motion.article></div>;
      })()}

      {imagePreviewUrl && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/90 p-4" role="dialog" aria-modal="true" aria-label="Full-size image preview" onClick={() => setImagePreviewUrl("")}><button type="button" className="absolute right-4 top-4 rounded-lg p-2 text-white/80 transition hover:bg-white/15 hover:text-white" onClick={() => setImagePreviewUrl("")} aria-label="Close image preview"><X className="h-6 w-6" /></button><img src={imagePreviewUrl} alt="Image attached by admin" className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} /></div>}

      {/* Stat Cards */}
      <motion.div
        className="grid grid-cols-2 gap-2 mt-6 sm:grid-cols-2 sm:gap-3 sm:mt-8 lg:grid-cols-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <StatCard title="Teachers" value={teachers.length} description="Active tutors" color="from-violet-500 to-fuchsia-500" icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />} />
        <StatCard title="Resources" value={resources.length} description="Awaiting review" color="from-sky-500 to-cyan-500" icon={<FileCheck className="w-4 h-4 sm:w-5 sm:h-5" />} />
        <StatCard title="Classes" value={classGroups.length} description="Active groups" color="from-amber-500 to-orange-500" icon={<Users className="w-4 h-4 sm:w-5 sm:h-5" />} />
        <StatCard title="Messages" value={messages.length} description="Sent broadcasts" color="from-emerald-500 to-teal-500" icon={<Send className="w-4 h-4 sm:w-5 sm:h-5" />} />
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-5 sm:mt-7">
        <TabsList className="
          flex
          w-full
          gap-1.5
          overflow-x-auto
          bg-transparent
          sm:grid
          sm:grid-cols-3
          md:grid-cols-4
          lg:grid-cols-5
          [&_[data-slot=tab]]:rounded-lg
          [&_[data-slot=tab]]:bg-white/90
          [&_[data-slot=tab]]:px-2
          [&_[data-slot=tab]]:py-2
          [&_[data-slot=tab]]:text-xs
          [&_[data-slot=tab]]:font-semibold
          [&_[data-slot=tab]]:shadow-sm
          [&_[data-slot=tab]]:data-[state=active]:bg-violet-600
          [&_[data-slot=tab]]:data-[state=active]:text-white
          sm:[&_[data-slot=tab]]:rounded-xl
          sm:[&_[data-slot=tab]]:px-3
          sm:[&_[data-slot=tab]]:py-2.5
          sm:[&_[data-slot=tab]]:text-sm
        ">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
          <TabsTrigger value="class-groups">Classes</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="broadcasts">Messages</TabsTrigger>
          <TabsTrigger value="calendar">
            <span className="hidden sm:inline">Calendar</span>
            <span className="sm:hidden">Cal</span>
          </TabsTrigger>
          <TabsTrigger value="live-classes">
            <span className="hidden sm:inline">Live Classes</span>
            <span className="sm:hidden">Live</span>
          </TabsTrigger>
          <TabsTrigger value="live-ops">
            <span className="hidden sm:inline">Live Ops</span>
            <span className="sm:hidden">Ops</span>
          </TabsTrigger>
          <TabsTrigger value="reports">
            <span className="hidden sm:inline">Reports</span>
            <span className="sm:hidden">Rep</span>
          </TabsTrigger>
          <TabsTrigger value="performance">
            <span className="hidden sm:inline">Performance</span>
            <span className="sm:hidden">Perf</span>
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <span className="hidden sm:inline">Notifications</span>
            <span className="sm:hidden">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="audit-logs">
            <span className="hidden sm:inline">Audit Logs</span>
            <span className="sm:hidden">Audit</span>
          </TabsTrigger>
          <TabsTrigger value="leave">
            <span className="hidden sm:inline">Leave</span>
            <span className="sm:hidden">Lv</span>
          </TabsTrigger>
          <TabsTrigger value="workload">
            <span className="hidden sm:inline">Workload</span>
            <span className="sm:hidden">WL</span>
          </TabsTrigger>
          <TabsTrigger value="timetables">
            <span className="hidden sm:inline">Timetables</span>
            <span className="sm:hidden">TT</span>
          </TabsTrigger>
          <TabsTrigger value="search">
            <span className="hidden sm:inline">Search</span>
            <span className="sm:hidden">Find</span>
          </TabsTrigger>
          <TabsTrigger value="settings">
            <span className="hidden sm:inline">Settings</span>
            <span className="sm:hidden">Set</span>
          </TabsTrigger>
          <TabsTrigger value="manage-class">
            <Monitor className="inline mr-1 h-3 w-3 sm:mr-2 sm:h-3.5 sm:w-3.5" />
            <span className="hidden sm:inline">Manage Class</span>
            <span className="sm:hidden">Manage</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 sm:mt-6">
          <motion.div
            className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Card className="shadow-lg border border-slate-200 bg-white/95 sm:shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900 sm:text-xl">Activity Snapshot</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Focus on your highest priority tasks.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4">
                <MiniStat label="Broadcasts" value={messages.length} />
                <MiniStat label="Pending" value={resources.filter((item) => !item.approved).length} />
                <MiniStat label="Teachers" value={teachers.length} />
                <MiniStat label="Alerts" value={unreadNotifications.length} />
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-lg border border-slate-200 bg-gradient-to-br from-violet-700 via-fuchsia-600 to-pink-500 text-white sm:shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg text-white sm:text-xl">Action Center</CardTitle>
                <CardDescription className="text-xs text-slate-100/80 sm:text-sm">Clear the most important items quickly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <ActionItem label="Review resources" value={`${resources.filter((item) => !item.approved).length}`} />
                <ActionItem label="Updates sent" value={`${messages.length}`} />
                <ActionItem label="Manage tutors" value={teachers.length.toString()} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Teacher Operations summary (Phase 3) */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-4 sm:gap-4">
            <MiniStat label="Pending leave" value={overview?.pendingLeaveRequests ?? "–"} />
            <MiniStat label="Available today" value={`${overview?.availableToday ?? "–"} teachers`} />
            <MiniStat label="Overloaded" value={`${overview?.overloadedTeachers ?? "–"} teachers`} />
            <MiniStat label="Need substitute" value={`${overview?.sessionsNeedingSubstitute ?? "–"} sessions`} />
          </div>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="mt-4 sm:mt-6">
          <TeachersModule />
        </TabsContent>

        {/* Class Groups Tab */}
        <TabsContent value="class-groups" className="mt-4 sm:mt-6">
          <ClassGroupsModule />
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="mt-4 sm:mt-6">
          <Card className="shadow-lg border border-slate-200 bg-white/95 sm:shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 sm:text-xl">Resource Approvals</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Review teacher submissions. Approve, reject, or leave a comment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {resources.length ? (
                <div className="space-y-3 sm:space-y-4">
                  {resources.map((r) => (
                    <motion.div key={r._id} whileHover={{ scale: 1.01 }} className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:rounded-[1.75rem] sm:p-4 lg:p-5">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 sm:text-base">{r.title || "Untitled Resource"}</p>
                          <p className="text-xs text-slate-500 sm:text-sm">By {r.teacher?.fullName || "Unknown"}</p>
                          <p className="text-[11px] text-slate-500 sm:text-xs">Subject: {r.subject || "N/A"} Â· Curriculum: {r.curriculum || "N/A"}</p>
                          {r.comment && <p className="text-[11px] text-slate-500 sm:text-xs">Comment: {r.comment}</p>}
                        </div>
                        <div className="flex flex-col gap-2">
                          {!r.approved ? (
                            <>
                              <input
                                type="text"
                                placeholder="Comment (optional)"
                                value={reviewComment[r._id] || ""}
                                onChange={(e) => setReviewComment((prev) => ({ ...prev, [r._id]: e.target.value }))}
                                className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm"
                              />
                              <div className="flex gap-1.5 sm:gap-2">
                                <Button size="sm" onClick={() => handleApproval(r._id, true)} className="h-8 rounded-full bg-emerald-600 px-3 text-[11px] font-semibold text-white hover:bg-emerald-700 sm:h-9 sm:px-4 sm:text-sm">Approve</Button>
                                <Button size="sm" onClick={() => handleApproval(r._id, false)} className="h-8 rounded-full bg-rose-600 px-3 text-[11px] font-semibold text-white hover:bg-rose-700 sm:h-9 sm:px-4 sm:text-sm">Reject</Button>
                              </div>
                            </>
                          ) : (
                            <span className="inline-flex w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 sm:px-3 sm:py-1 sm:text-sm">Approved</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500 sm:rounded-[1.75rem] sm:p-10 sm:text-sm">No resources available yet.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manage Class Tab */}
        <TabsContent value="manage-class" className="mt-4 sm:mt-6">
          <ManageClass />
        </TabsContent>

        {/* Broadcasts Tab */}
        <TabsContent value="broadcasts" className="mt-4 grid gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-5">
          <Card className="shadow-lg border border-slate-200 bg-white/95 sm:shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 sm:text-xl">Send a broadcast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 sm:space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 sm:text-sm">Teacher</label>
                <select
                  value={newMessage.receiver}
                  onChange={(e) => setNewMessage({ ...newMessage, receiver: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <option value="">Select Teacher</option>
                  <option value="__all__">All Teachers</option>
                  {Array.isArray(teachers) && teachers.map((t) => <option key={t._id} value={t._id}>{t.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 sm:text-sm">Subject</label>
                <input
                  type="text"
                  placeholder="Enter subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 sm:text-sm">Message</label>
                <textarea
                  rows="3"
                  placeholder="Type your message here..."
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                />
              </div>
              <Button onClick={handleSendMessage} disabled={sending} className="w-full h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-xs font-semibold text-white shadow-md sm:h-11 sm:py-3 sm:text-sm sm:shadow-lg">
                <Send className="mr-1.5 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" /> {sending ? "Sending..." : "Send"}
              </Button>
            </CardContent>
          </Card>

          {/* Broadcast to a Class Group */}
          <Card className="shadow-lg border border-amber-200 bg-white/95 sm:shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 sm:text-xl">Broadcast to Class</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Notify a class about a substitute teacher.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 sm:space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 sm:text-sm">Class Group</label>
                <select
                  value={classBroadcast.classGroupId}
                  onChange={(e) => setClassBroadcast({ ...classBroadcast, classGroupId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <option value="">Select a class</option>
                  {Array.isArray(classGroups) && classGroups.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.code} â€” {g.subject} Â· Grade {g.grade}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 sm:text-sm">Subject</label>
                <input
                  type="text"
                  placeholder="e.g. Substitute update"
                  value={classBroadcast.subject}
                  onChange={(e) => setClassBroadcast({ ...classBroadcast, subject: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 sm:text-sm">Message</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Your teacher is unwell today..."
                  value={classBroadcast.message}
                  onChange={(e) => setClassBroadcast({ ...classBroadcast, message: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm"
                />
              </div>
              <Button onClick={handleClassBroadcast} disabled={sendingClass} className="w-full h-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-xs font-semibold text-white shadow-md sm:h-11 sm:py-3 sm:text-sm sm:shadow-lg">
                <Send className="mr-1.5 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" /> {sendingClass ? "Sending..." : "Send to Class"}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Communication */}
          <Card className="shadow-lg border border-slate-200 bg-white/95 sm:shadow-2xl sm:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 sm:text-xl">Recent Communication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 sm:space-y-3">
              {Array.isArray(messages) && messages.length > 0 ? (
                <div className="space-y-2.5 sm:space-y-3">
                  {messages.map((m) => (
                    <motion.div key={m._id} whileHover={{ x: 2 }} className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:rounded-[1.75rem] sm:p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-900 sm:text-base">{m.subject}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-600 sm:mt-2 sm:text-sm sm:leading-6">{m.body || m.message || "No message body available."}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSentMessage(m._id)}
                          className="shrink-0 rounded-md border border-rose-200 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs"
                          title="Delete message"
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500 sm:rounded-[1.75rem] sm:p-8 sm:text-sm">No messages yet.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="calendar" className="mt-4 sm:mt-6">
          <CalendarView />
        </TabsContent>

        <TabsContent value="live-classes" className="mt-4 sm:mt-6">
          <LiveClasses />
        </TabsContent>

        <TabsContent value="live-ops" className="mt-4 sm:mt-6">
          <LiveOpsCenter />
        </TabsContent>

        <TabsContent value="reports" className="mt-4 sm:mt-6">
          <ReportsModule />
        </TabsContent>

        <TabsContent value="performance" className="mt-4 sm:mt-6">
          <PerformanceModule />
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 sm:mt-6">
          <NotificationCenter />
        </TabsContent>

        <TabsContent value="audit-logs" className="mt-4 sm:mt-6">
          <AuditLogsModule />
        </TabsContent>

        <TabsContent value="leave" className="mt-4 sm:mt-6">
          <LeaveRequestsModule />
        </TabsContent>

        <TabsContent value="workload" className="mt-4 sm:mt-6">
          <WorkloadModule />
        </TabsContent>

        <TabsContent value="timetables" className="mt-4 sm:mt-6">
          <TimetableApprovalsModule />
        </TabsContent>

        <TabsContent value="search" className="mt-4 sm:mt-6">
          <SearchModule />
        </TabsContent>

        <TabsContent value="settings" className="mt-4 sm:mt-6">
          <SettingsModule />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const StatCard = ({ title, value, description, color, icon }) => (
  <motion.div whileHover={{ y: -4 }} className={`rounded-xl border border-white/80 bg-gradient-to-br ${color} p-4 text-white shadow-lg sm:rounded-[1.75rem] sm:p-5 sm:shadow-2xl`}>
    <div className="flex items-start justify-between gap-2 sm:gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80 sm:text-xs sm:tracking-[0.22em]">{title}</p>
        <p className="mt-2 text-xl font-bold tracking-tight sm:mt-4 sm:text-2xl sm:sm:text-3xl">{value}</p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white sm:h-12 sm:w-12 sm:rounded-2xl">
        {icon}
      </div>
    </div>
    <p className="mt-2 text-[11px] leading-5 text-white/80 sm:mt-5 sm:text-sm sm:leading-6">{description}</p>
  </motion.div>
);

const MiniStat = ({ label, value }) => (
  <div className="rounded-xl bg-slate-50 p-3 shadow-sm ring-1 ring-slate-200 sm:rounded-[1.75rem] sm:p-5">
    <p className="text-[11px] text-slate-500 sm:text-sm">{label}</p>
    <p className="mt-1.5 text-xl font-semibold text-slate-900 sm:mt-3 sm:text-2xl sm:sm:text-3xl">{value}</p>
  </div>
);

const ActionItem = ({ label, value }) => (
  <div className="rounded-xl border border-white/20 bg-white/10 p-3 shadow-sm backdrop-blur-sm sm:rounded-[1.75rem] sm:p-4 sm:backdrop-blur-md">
    <p className="text-[10px] uppercase tracking-wider text-white/80 sm:text-xs sm:tracking-[0.22em]">{label}</p>
    <p className="mt-2 text-xl font-semibold text-white sm:mt-4 sm:text-2xl sm:sm:text-3xl">{value}</p>
  </div>
);

const DashboardEmpty = ({ text }) => (
  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500 sm:rounded-[1.75rem] sm:p-10 sm:text-sm">{text}</div>
);

export default TutorManagerDashboard;


