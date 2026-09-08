// components/qao/NotificationCenter.jsx
// Phase 4 — Persistent notification center for Tutor Managers.
// Backed by models/Notification (role=qao). Real-time socket events are emitted
// server-side to the `qaos` room; this view also polls + supports manual refresh,
// mark-read / mark-all-read. No student PII in payloads.
import { useCallback, useEffect, useRef, useState } from "react";
import apiClient from "../../utils/apiClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Bell, CheckCheck, RefreshCw, MailOpen } from "lucide-react";

const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("qaoToken")}` } });
const TYPE_STYLE = {
  info: "bg-sky-100 text-sky-700",
  alert: "bg-rose-100 text-rose-700",
  warning: "bg-amber-100 text-amber-700",
  broadcast: "bg-violet-100 text-violet-700",
};

function fmtDate(value) {
  if (!value) return "";
  try { return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const timer = useRef(null);

  const load = useCallback(async () => {
    try {
      const r = await apiClient.get("/qao/notifications/center?limit=50", config());
      setNotifications(Array.isArray(r.data?.notifications) ? r.data.notifications : []);
      setUnread(r.data?.unread || 0);
    } catch (err) {
      console.error("Notification load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    timer.current = setInterval(load, 30000);
    return () => clearInterval(timer.current);
  }, [load]);

  const markRead = async (id) => {
    setNotifications((cur) => cur.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    try { await apiClient.patch(`/qao/notifications/${id}/read`, {}, config()); } catch { /* ignore */ }
  };

  const markAll = async () => {
    setNotifications((cur) => cur.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try { await apiClient.patch("/qao/notifications/read-all", {}, config()); } catch { /* ignore */ }
  };

  const visible = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm">Notification center</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} className="h-8 rounded-lg px-2.5 text-[11px] sm:text-xs">
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={markAll} disabled={!unread} className="h-8 rounded-lg px-2.5 text-[11px] sm:text-xs">
            <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all read
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {["all", "unread"].map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${filter === f ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {f === "all" ? `All (${notifications.length})` : `Unread (${unread})`}
          </button>
        ))}
      </div>

      <Card className="border border-slate-200 bg-white shadow-lg sm:shadow-xl">
        <CardHeader>
          <CardTitle className="text-base text-slate-900 sm:text-lg"><Bell className="mr-1.5 inline h-4 w-4" />Notifications</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Operational alerts from scheduling, leave, workload, and announcements.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">Loading notifications...</div>
          ) : visible.length ? (
            <div className="divide-y divide-slate-100">
              {visible.map((n) => (
                <button key={n._id} type="button" onClick={() => !n.read && markRead(n._id)}
                  className={`flex w-full items-start gap-3 px-2 py-3 text-left transition ${n.read ? "" : "bg-violet-50/60"}`}>
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${n.read ? "bg-slate-200" : "bg-violet-600 ring-4 ring-violet-100"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">{n.title || n.type}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${TYPE_STYLE[n.type] || TYPE_STYLE.info}`}>{n.type}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-600 sm:text-sm">{n.message}</span>
                    <span className="mt-1 block text-[10px] text-slate-400">{fmtDate(n.createdAt)}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
              <MailOpen className="mx-auto h-8 w-8 text-violet-200" />
              <p className="mt-2 font-semibold text-slate-700">You are all caught up</p>
              <p className="mt-1 text-xs text-slate-500">New operational alerts will appear here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}