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
  const [showNotifs, setShowNotifs] = useState(false);

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
        ] = await Promise.all([
          apiClient.get("/qao/teachers", config),
          apiClient.get("/qao/resources", config),
          apiClient.get("/qao/kpis", config),
          apiClient.get("/qao/sent", config),
          apiClient.get("/qao/notifications", config),
        ]);

        setTeachers(Array.isArray(resTeachers.data?.teachers) ? resTeachers.data.teachers : []);
        setResources(Array.isArray(resResources.data?.resources) ? resResources.data.resources : []);
        setKpis(Array.isArray(resKpis.data?.kpis) ? resKpis.data.kpis : []);
        setMessages(Array.isArray(resMessages.data?.messages) ? resMessages.data.messages : []);
        setNotifications(Array.isArray(resNotifs.data?.notifications) ? resNotifs.data.notifications : []);
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
      await apiClient.post(
        "/qao/broadcast",
        { recipients: [newMessage.receiver], subject: newMessage.subject, message: newMessage.message },
        config
      );
      alert("Message sent successfully!");
      setNewMessage({ receiver: "", subject: "", message: "" });
      const res = await apiClient.get("/qao/sent", config);
      setMessages(Array.isArray(res.data?.messages) ? res.data.messages : []);
    } catch (err) {
      console.error("Send message error:", err);
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("qaoToken");
    localStorage.removeItem("qaoUser");
    navigate("/qao/access");
  };

  const handleApproval = async (id, approved) => {
    try {
      await apiClient.put(`/qao/resources/${id}`, { approved }, config);
      setResources((prev) => prev.map((r) => (r._id === id ? { ...r, approved } : r)));
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

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button onClick={handleLogout} className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-300/30">Logout</Button>
            <Button variant="outline" onClick={() => setShowNotifs(!showNotifs)} className="rounded-full border border-slate-200 bg-white text-slate-700 hover:border-violet-300">
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
        className="grid gap-4 mt-8 md:grid-cols-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <StatCard title="Teachers" value={teachers.length} description="Active tutors assigned" color="from-violet-500 to-fuchsia-500" icon={<Users className="w-5 h-5" />} />
        <StatCard title="Resources" value={resources.length} description="Items awaiting review" color="from-sky-500 to-cyan-500" icon={<FileCheck className="w-5 h-5" />} />
        <StatCard title="KPIs" value={kpis.length} description="Metrics tracked" color="from-emerald-500 to-teal-500" icon={<BarChart3 className="w-5 h-5" />} />
      </motion.div>

      <Tabs defaultValue="overview" className="w-full mt-8">
        <TabsList className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <TabsTrigger value="overview" className="rounded-[1.75rem] bg-white/90 py-4 text-slate-700 shadow-sm hover:bg-white">Overview</TabsTrigger>
          <TabsTrigger value="teachers" className="rounded-[1.75rem] bg-white/90 py-4 text-slate-700 shadow-sm hover:bg-white">Teachers</TabsTrigger>
          <TabsTrigger value="resources" className="rounded-[1.75rem] bg-white/90 py-4 text-slate-700 shadow-sm hover:bg-white">Resources</TabsTrigger>
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
          <DataCard title="Teacher roster" icon={<Users />} data={teachers.map((t) => ({ label: t.fullName || "No Name", sub: t.email || "No email" }))} />
        </TabsContent>

        <TabsContent value="resources" className="mt-6">
          <DataCard
            title="Resource approvals"
            icon={<FileCheck />}
            data={resources.map((r) => ({
              label: r.title || "Untitled Resource",
              sub: `By ${r.teacher?.fullName || "Unknown"}`,
              action: !r.approved ? () => handleApproval(r._id, true) : null,
              approved: r.approved,
            }))}
            isResource
          />
        </TabsContent>
      </Tabs>

      <motion.div
        className="mt-8 grid gap-4 xl:grid-cols-[1.4fr_0.9fr]"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
      >
        <MessageCard
          teachers={teachers}
          messages={messages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          sending={sending}
          onSend={handleSendMessage}
        />

        <Card className="shadow-2xl border border-slate-200 bg-white/95">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Quick Notes</CardTitle>
            <CardDescription>Keep your day organized with these reminders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <NoteRow text="Approve new resources by midday." />
            <NoteRow text="Check the tutor roster for missing subject assignments." />
            <NoteRow text="Follow up with teachers who haven't submitted updates." />
          </CardContent>
        </Card>
      </motion.div>
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

const DataCard = ({ title, icon, data, isResource }) => (
  <Card className="shadow-2xl border border-slate-200 bg-white/95">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-slate-900">{icon} {title}</CardTitle>
      <CardDescription>Manage the latest items in your Tutor Manager workspace.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      {Array.isArray(data) && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((item, i) => (
            <motion.div key={i} whileHover={{ scale: 1.01 }} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 transition">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.sub}</p>
                </div>
                {isResource ? (
                  item.action ? (
                    <Button size="sm" onClick={item.action} className="rounded-full bg-purple-600 text-white hover:bg-purple-700">Approve</Button>
                  ) : (
                    <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">Approved</span>
                  )
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-slate-500">No data available yet.</div>
      )}
    </CardContent>
  </Card>
);

const MessageCard = ({ teachers, messages, newMessage, setNewMessage, sending, onSend }) => (
  <Card className="shadow-2xl border border-slate-200 bg-white/95">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-purple-600"><MessageSquare /> Messages</CardTitle>
      <CardDescription>Send broadcast updates and track recent activity.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Teacher</label>
            <select
              value={newMessage.receiver}
              onChange={(e) => setNewMessage({ ...newMessage, receiver: e.target.value })}
              className="mt-3 w-full rounded-[1.5rem] border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            >
              <option value="">Select Teacher</option>
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
              className="mt-3 w-full rounded-[1.5rem] border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Message</label>
            <textarea
              rows="4"
              placeholder="Type your message here..."
              value={newMessage.message}
              onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
              className="mt-3 w-full rounded-[1.5rem] border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <Button onClick={onSend} disabled={sending} className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 shadow-lg shadow-purple-200/40">
            <Send className="mr-2 h-4 w-4" /> {sending ? "Sending..." : "Broadcast Message"}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-lg font-semibold text-slate-900">Recent Communication</p>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{messages.length} messages</span>
        </div>

        {Array.isArray(messages) && messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((m) => (
              <motion.div key={m._id} whileHover={{ x: 2 }} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
                <p className="font-semibold text-slate-900">{m.subject}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{m.body || m.message || "No message body available."}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">No messages yet. Start by broadcasting a note to your team.</div>
        )}
      </div>
    </CardContent>
  </Card>
);

const NoteRow = ({ text }) => (
  <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 px-5 py-4 shadow-sm">
    <p className="text-sm text-slate-700">{text}</p>
  </div>
);

export default TutorManagerDashboard;
