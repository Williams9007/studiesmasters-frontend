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
} from "lucide-react";
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
  const [sending, setSending] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-violet-50 to-pink-50 px-4 py-6 sm:px-6 lg:px-8">
      <motion.div
        className="relative overflow-hidden rounded-[2rem] bg-white/95 p-6 shadow-2xl shadow-violet-200/30 ring-1 ring-slate-200 backdrop-blur"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <div className="absolute -right-20 top-10 h-56 w-56 rounded-full bg-violet-200/60 blur-3xl" />
        <div className="absolute left-8 top-0 h-36 w-36 rounded-full bg-pink-200/70 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-fuchsia-700">Tutor Manager</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Streamline teacher approvals, communication, and resources.</h1>
            <p className="mt-4 text-sm leading-7 text-slate-600">This dashboard helps you monitor tutor activity, review learning assets, and keep your team aligned.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:flex-row">
            <Button onClick={handleLogout} className="h-11 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-300/30 hover:from-violet-700 hover:to-fuchsia-700 transition">Logout</Button>
            <Button variant="outline" onClick={() => setShowNotifs(!showNotifs)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-violet-300 hover:bg-violet-50 transition">
              <Bell className="mr-2 h-4 w-4" /> Notifications {notifications.length > 0 && <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-2 text-[11px] font-semibold text-white">{notifications.length}</span>}
            </Button>
          </div>
        </div>
      </motion.div>

      {showNotifs && (
        <motion.div
          className="mt-5 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/20"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-sm font-semibold text-slate-900">Recent notifications</p>
          <div className="mt-3 space-y-3">
            {notifications.length > 0 ? notifications.map((n) => (
              <div key={n._id} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{n.message}</div>
            )) : (
              <p className="text-sm text-slate-500">No notifications available.</p>
            )}
          </div>
        </motion.div>
      )}

      <motion.div
        className="grid grid-cols-2 gap-3 mt-8 sm:grid-cols-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <StatCard title="Teachers" value={teachers.length} description="Active tutors assigned" color="from-violet-500 to-fuchsia-500" icon={<Users className="w-5 h-5" />} />
        <StatCard title="Resources" value={resources.length} description="Items awaiting review" color="from-sky-500 to-cyan-500" icon={<FileCheck className="w-5 h-5" />} />
        <StatCard title="Class Groups" value={classGroups.length} description="Active class groups" color="from-amber-500 to-orange-500" icon={<Users className="w-5 h-5" />} />
        <StatCard title="Broadcasts" value={messages.length} description="Messages sent" color="from-emerald-500 to-teal-500" icon={<Send className="w-5 h-5" />} />
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-7">

        <TabsList className="
          grid
          w-full
          grid-cols-2
          gap-2
          bg-transparent
          sm:grid-cols-3
          md:grid-cols-4
          lg:grid-cols-5
        ">

          <TabsTrigger
            value="overview"
            className="
              rounded-xl
              bg-white/90
              px-2
              py-2.5
              text-xs
              font-semibold
              text-slate-700
              shadow-sm
              hover:bg-white
              data-[state=active]:bg-violet-600
              data-[state=active]:text-white
              sm:px-3
              sm:py-3
              sm:text-sm
            "
          >
            Overview
          </TabsTrigger>

          <TabsTrigger
            value="teachers"
            className="
              rounded-xl
              bg-white/90
              px-2
              py-2.5
              text-xs
              font-semibold
              text-slate-700
              shadow-sm
              hover:bg-white
              data-[state=active]:bg-violet-600
              data-[state=active]:text-white
              sm:px-3
              sm:py-3
              sm:text-sm
            "
          >
            Teachers
          </TabsTrigger>

          <TabsTrigger
            value="class-groups"
            className="
              rounded-xl
              bg-white/90
              px-2
              py-2.5
              text-xs
              font-semibold
              text-slate-700
              shadow-sm
              hover:bg-white
              data-[state=active]:bg-violet-600
              data-[state=active]:text-white
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
              rounded-xl
              bg-white/90
              px-2
              py-2.5
              text-xs
              font-semibold
              text-slate-700
              shadow-sm
              hover:bg-white
              data-[state=active]:bg-violet-600
              data-[state=active]:text-white
              sm:px-3
              sm:py-3
              sm:text-sm
            "
          >
            Resources
          </TabsTrigger>

          <TabsTrigger
            value="broadcasts"
            className="
              rounded-xl
              bg-white/90
              px-2
              py-2.5
              text-xs
              font-semibold
              text-slate-700
              shadow-sm
              hover:bg-white
              data-[state=active]:bg-violet-600
              data-[state=active]:text-white
              sm:px-3
              sm:py-3
              sm:text-sm
            "
          >
            Broadcasts
          </TabsTrigger>

        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <motion.div
            className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
          >
            <Card className="shadow-2xl border border-slate-200 bg-white/95">
              <CardHeader>
                <CardTitle className="text-xl text-slate-900">Activity Snapshot</CardTitle>
                <CardDescription>Focus on your highest priority tasks.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <MiniStat label="Broadcasts" value={messages.length} />
                <MiniStat label="Pending approvals" value={resources.filter((item) => !item.approved).length} />
                <MiniStat label="Teacher groups" value={teachers.length ? Math.max(1, Math.ceil(teachers.length / 6)) : 0} />
                <MiniStat label="Unread alerts" value={notifications.length} />
              </CardContent>
            </Card>

            <Card className="overflow-hidden shadow-2xl border border-slate-200 bg-gradient-to-br from-violet-700 via-fuchsia-600 to-pink-500 text-white">
              <CardHeader>
                <CardTitle className="text-xl">Action Center</CardTitle>
                <CardDescription className="text-slate-100/80">Clear the most important items quickly.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ActionItem label="Review resources" value={`${resources.filter((item) => !item.approved).length}`} />
                <ActionItem label="Send teacher updates" value={`${messages.length}`} />
                <ActionItem label="Manage tutors" value={teachers.length.toString()} />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="teachers" className="mt-6">
          <Card className="shadow-2xl border border-slate-200 bg-white/95">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Teacher Roster</CardTitle>
              <CardDescription>All teachers separated by curriculum.</CardDescription>
            </CardHeader>
            <CardContent>
              {teachers.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {teachers.map((teacher) => (
                    <div key={teacher._id} className="rounded-xl border border-slate-200 p-4">
                      <p className="font-bold text-slate-900">{teacher.fullName || "No Name"}</p>
                      <p className="text-sm text-slate-500">{teacher.email || "No email"}</p>
                      <p className="text-xs text-slate-500">Curriculum: {teacher.curriculum || "N/A"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmpty text="No teachers found." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="class-groups" className="mt-6">
          <Card className="shadow-2xl border border-slate-200 bg-white/95">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Class Groups</CardTitle>
              <CardDescription>All class groups by curriculum and subject. Use this to manage substitutions.</CardDescription>
            </CardHeader>
            <CardContent>
              {classGroups.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {classGroups.map((group) => (
                    <div key={group._id} className="rounded-xl border border-slate-200 p-4">
                      <p className="font-bold"><Users className="inline mr-2 text-blue-600" />{group.code}</p>
                      <p className="mt-1 text-sm text-slate-600">{group.curriculum} · Grade {group.grade}</p>
                      <p className="text-xs text-slate-500">Subject: {group.subject}</p>
                      <p className="text-xs text-slate-500">Students: {group.students?.length || 0} / {group.capacity}</p>
                      {group.teacher && <p className="text-xs text-slate-500">Teacher: {group.teacher.fullName || "Unassigned"}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <DashboardEmpty text="No class groups available." />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <Card className="shadow-2xl border border-slate-200 bg-white/95">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Resource Approvals</CardTitle>
              <CardDescription>Review teacher submissions. Approve, reject, or leave a comment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {resources.length ? (
                <div className="space-y-4">
                  {resources.map((r) => (
                    <motion.div key={r._id} whileHover={{ scale: 1.01 }} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{r.title || "Untitled Resource"}</p>
                          <p className="text-sm text-slate-500">By {r.teacher?.fullName || "Unknown"}</p>
                          <p className="text-xs text-slate-500">Subject: {r.subject || "N/A"} · Curriculum: {r.curriculum || "N/A"}</p>
                          {r.comment && <p className="text-xs text-slate-500">Comment: {r.comment}</p>}
                        </div>
                        <div className="flex flex-col gap-2">
                          {!r.approved ? (
                            <>
                              <input
                                type="text"
                                placeholder="Comment (optional)"
                                value={reviewComment[r._id] || ""}
                                onChange={(e) => setReviewComment((prev) => ({ ...prev, [r._id]: e.target.value }))}
                                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleApproval(r._id, true)} className="rounded-full bg-emerald-600 text-white hover:bg-emerald-700">Approve</Button>
                                <Button size="sm" onClick={() => handleApproval(r._id, false)} className="rounded-full bg-rose-600 text-white hover:bg-rose-700">Reject</Button>
                              </div>
                            </>
                          ) : (
                            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">Approved</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">No resources available yet.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcasts" className="mt-6 grid gap-5 lg:grid-cols-2">
          <Card className="shadow-2xl border border-slate-200 bg-white/95">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Send a broadcast</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700">Teacher</label>
                <select
                  value={newMessage.receiver}
                  onChange={(e) => setNewMessage({ ...newMessage, receiver: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                >
                  <option value="">Select Teacher</option>
                  <option value="__all__">All Teachers</option>
                  {Array.isArray(teachers) && teachers.map((t) => <option key={t._id} value={t._id}>{t.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Subject</label>
                <input
                  type="text"
                  placeholder="Enter subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700">Message</label>
                <textarea
                  rows="4"
                  placeholder="Type your message here..."
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                />
              </div>
              <Button onClick={handleSendMessage} disabled={sending} className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 shadow-lg shadow-purple-200/40">
                <Send className="mr-2 h-4 w-4" /> {sending ? "Sending..." : "Broadcast Message"}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-2xl border border-slate-200 bg-white/95">
            <CardHeader>
              <CardTitle className="text-xl text-slate-900">Recent Communication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.isArray(messages) && messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.map((m) => (
                    <motion.div key={m._id} whileHover={{ x: 2 }} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900">{m.subject}</p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{m.body || m.message || "No message body available."}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSentMessage(m._id)}
                          className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          title="Delete message"
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No messages yet.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const StatCard = ({ title, value, description, color, icon }) => (
  <motion.div whileHover={{ y: -6 }} className={`rounded-[1.75rem] border border-white/80 bg-gradient-to-br ${color} p-6 text-white shadow-2xl shadow-slate-300/20 transition-transform`}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/80">{title}</p>
        <p className="mt-4 text-4xl font-bold tracking-tight">{value}</p>
      </div>
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/20 text-white">
        {icon}
      </div>
    </div>
    <p className="mt-5 text-sm leading-6 text-white/80">{description}</p>
  </motion.div>
);

const MiniStat = ({ label, value }) => (
  <div className="rounded-[1.75rem] bg-slate-50 p-5 shadow-sm ring-1 ring-slate-200">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
  </div>
);

const ActionItem = ({ label, value }) => (
  <div className="rounded-[1.75rem] border border-white/20 bg-white/10 p-5 shadow-sm backdrop-blur-md">
    <p className="text-sm uppercase tracking-[0.22em] text-white/80">{label}</p>
    <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
  </div>
);

const DashboardEmpty = ({ text }) => (
  <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">{text}</div>
);

export default TutorManagerDashboard;