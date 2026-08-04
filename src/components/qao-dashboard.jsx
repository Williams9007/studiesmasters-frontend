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
} from "lucide-react";
import ManageClass from "./ManageClass";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

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
  const [classGroups, setClassGroups] = useState([]);
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
        ] = await Promise.all([
          apiClient.get("/qao/teachers", config),
          apiClient.get("/qao/resources", config),
          apiClient.get("/qao/kpis", config),
          apiClient.get("/qao/sent", config),
          apiClient.get("/qao/notifications", config),
          apiClient.get("/qao/class-groups", config),
        ]);

        setTeachers(Array.isArray(resTeachers.data?.teachers) ? resTeachers.data.teachers : []);
        setResources(Array.isArray(resResources.data?.resources) ? resResources.data.resources : []);
        setKpis(Array.isArray(resKpis.data?.kpis) ? resKpis.data.kpis : []);
        setMessages(Array.isArray(resMessages.data?.messages) ? resMessages.data.messages : []);
        setNotifications(Array.isArray(resNotifs.data?.notifications) ? resNotifs.data.notifications : []);
        setClassGroups(Array.isArray(resClassGroups.data?.groups) ? resClassGroups.data.groups : []);
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
              onClick={() => setShowNotifs(!showNotifs)} 
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 sm:h-11 sm:rounded-xl sm:px-4 sm:text-sm"
            >
              <Bell className="h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Notifications</span>
              {notifications.length > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white sm:ml-2 sm:h-5 sm:min-w-[1.25rem] sm:px-2 sm:text-[11px]">
                  {notifications.length}
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
          <p className="text-sm font-semibold text-slate-900">Recent notifications</p>
          <div className="mt-2 space-y-2 sm:mt-3 sm:space-y-3">
            {notifications.length > 0 ? notifications.map((n) => (
              <div key={n._id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 sm:rounded-3xl sm:px-4 sm:py-3 sm:text-sm">{n.message}</div>
            )) : (
              <p className="text-xs text-slate-500 sm:text-sm">No notifications available.</p>
            )}
          </div>
        </motion.div>
      )}

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
                <MiniStat label="Alerts" value={notifications.length} />
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
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="mt-4 sm:mt-6">
          <Card className="shadow-lg border border-slate-200 bg-white/95 sm:shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 sm:text-xl">Teacher Roster</CardTitle>
              <CardDescription className="text-xs sm:text-sm">All teachers separated by curriculum.</CardDescription>
            </CardHeader>
            <CardContent>
              {teachers.length ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {teachers.map((teacher) => (
                    <div key={teacher._id} className="rounded-lg border border-slate-200 p-3 sm:rounded-xl sm:p-4">
                      <p className="font-bold text-sm text-slate-900 sm:text-base">{teacher.fullName || "No Name"}</p>
                      <p className="text-xs text-slate-500 sm:text-sm">{teacher.email || "No email"}</p>
                      <p className="text-[11px] text-slate-500 sm:text-xs">Curriculum: {teacher.curriculum || "N/A"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmpty text="No teachers found." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Class Groups Tab */}
        <TabsContent value="class-groups" className="mt-4 sm:mt-6">
          <Card className="shadow-lg border border-slate-200 bg-white/95 sm:shadow-2xl">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 sm:text-xl">Class Groups</CardTitle>
              <CardDescription className="text-xs sm:text-sm">All class groups by curriculum and subject.</CardDescription>
            </CardHeader>
            <CardContent>
              {classGroups.length ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                  {classGroups.map((group) => (
                    <div key={group._id} className="rounded-lg border border-slate-200 p-3 sm:rounded-xl sm:p-4">
                      <p className="font-bold text-sm text-slate-900 sm:text-base"><Users className="inline mr-1.5 text-blue-600 sm:mr-2" />{group.code}</p>
                      <p className="mt-1 text-xs text-slate-600 sm:text-sm">{group.curriculum} · Grade {group.grade}</p>
                      <p className="text-[11px] text-slate-500 sm:text-xs">Subject: {group.subject}</p>
                      <p className="text-[11px] text-slate-500 sm:text-xs">Students: {group.students?.length || 0} / {group.capacity}</p>
                      {group.teacher && <p className="text-[11px] text-slate-500 sm:text-xs">Teacher: {group.teacher.fullName || "Unassigned"}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmpty text="No class groups available." />
              )}
            </CardContent>
          </Card>
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
                          <p className="text-[11px] text-slate-500 sm:text-xs">Subject: {r.subject || "N/A"} · Curriculum: {r.curriculum || "N/A"}</p>
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
                      {g.code} — {g.subject} · Grade {g.grade}
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