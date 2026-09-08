// components/qao/LiveClasses.jsx
// Live class monitoring: sessions with status transitions and a quick
// substitute assignment. Teacher/group names only — no student data.
import { useCallback, useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { RefreshCw, Radio } from "lucide-react";

const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("qaoToken")}` } });

const badge = (status) => {
  const map = {
    scheduled: "bg-violet-100 text-violet-700",
    live: "bg-rose-100 text-rose-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-200 text-slate-600",
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold sm:px-2.5 sm:py-1 sm:text-[11px] ${map[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
};

export default function LiveClasses() {
  const [sessions, setSessions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subs, setSubs] = useState({}); // sessionId -> teacherId

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        apiClient.get("/qao/sessions", config()),
        apiClient.get("/qao/teachers/all", config()),
      ]);
      const list = Array.isArray(s.data?.sessions) ? s.data.sessions : [];
      // Show today's sessions + anything live, most relevant first
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const todays = list.filter((x) => new Date(x.date) >= start && new Date(x.date) < end);
      const live = list.filter((x) => x.status === "live");
      const seen = new Set();
      setSessions([...live, ...todays].filter((x) => (seen.has(x._id) ? false : (seen.add(x._id), true))));
      setTeachers(Array.isArray(t.data?.teachers) ? t.data.teachers : []);
    } catch (err) {
      console.error("Live classes load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (session, status) => {
    try {
      const res = await apiClient.patch(`/qao/sessions/${session._id}`, { status }, config());
      setSessions((prev) => prev.map((s) => (s._id === session._id ? res.data.session : s)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update status.");
    }
  };

  const assignSub = async (session) => {
    const sub = subs[session._id];
    if (!sub) return alert("Select a substitute teacher first.");
    try {
      const res = await apiClient.patch(`/qao/sessions/${session._id}`, { substituteTeacher: sub }, config());
      setSessions((prev) => prev.map((s) => (s._id === session._id ? res.data.session : s)));
      setSubs((p) => ({ ...p, [session._id]: "" }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign substitute.");
    }
  };

  return (
    <Card className="border border-slate-200 bg-white shadow-lg sm:shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-slate-900 sm:text-xl"><Radio className="h-5 w-5 text-rose-600" /> Live Classes</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Monitor today's sessions, update status, and assign substitutes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={load} className="h-8 rounded-lg px-3 text-[11px] font-semibold sm:text-xs">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
        {loading ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">Loading sessions...</div>
        ) : sessions.length ? (
          sessions.map((s) => {
            const g = s.classGroup || {};
            return (
              <div key={s._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:rounded-[1.5rem] sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 sm:text-base">{[g.curriculum, g.grade, g.subject].filter(Boolean).join(" ") || "Session"}</p>
                    <p className="text-[11px] text-slate-500 sm:text-xs">
                      {new Date(s.date).toLocaleDateString()} · {s.startTime} - {s.endTime}
                      {s.durationMinutes ? ` · ${s.durationMinutes} min` : ""} · Teacher: {s.teacher?.fullName || "Unassigned"}
                      {s.substituteTeacher?.fullName ? ` · Sub: ${s.substituteTeacher.fullName}` : ""}
                    </p>
                    {s.notes && <p className="text-[11px] text-amber-700">Note: {s.notes}</p>}
                  </div>
                  {badge(s.status)}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {s.status === "scheduled" && <Button size="sm" onClick={() => setStatus(s, "live")} className="h-7 rounded-full bg-rose-600 px-3 text-[10px] font-semibold text-white hover:bg-rose-700 sm:text-[11px]">Mark live</Button>}
                  {(s.status === "live" || s.status === "scheduled") && <Button size="sm" onClick={() => setStatus(s, "completed")} className="h-7 rounded-full bg-emerald-600 px-3 text-[10px] font-semibold text-white hover:bg-emerald-700 sm:text-[11px]">Completed</Button>}
                  {(s.status === "live" || s.status === "scheduled") && <Button size="sm" variant="outline" onClick={() => setStatus(s, "cancelled")} className="h-7 rounded-full px-3 text-[10px] font-semibold text-slate-600 sm:text-[11px]">Cancel</Button>}
                  {s.meetingLink && <a href={s.meetingLink} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-violet-600 underline">Join link</a>}
                </div>
                <div className="mt-2 flex flex-col gap-1.5 border-t border-slate-100 pt-2 sm:flex-row sm:items-center">
                  <select value={subs[s._id] || ""} onChange={(e) => setSubs((p) => ({ ...p, [s._id]: e.target.value }))} className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-[11px] sm:w-64 sm:text-xs">
                    <option value="">Assign substitute (this session only)...</option>
                    {teachers.filter((t) => t._id !== s.teacher?._id).map((t) => <option key={t._id} value={t._id}>{t.fullName || t.name}</option>)}
                  </select>
                  <Button size="sm" variant="outline" onClick={() => assignSub(s)} className="h-7 rounded-full px-3 text-[10px] font-semibold sm:text-[11px]">Assign</Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">No sessions today. Schedule classes from the Calendar tab.</div>
        )}
      </CardContent>
    </Card>
  );
}
