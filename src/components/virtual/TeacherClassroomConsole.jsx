// components/virtual/TeacherClassroomConsole.jsx
//
// Teacher Classroom Console (Phase 6B). Start/End class, join the Meet,
// regenerate a failed link, view attendance. Talks to /api/meet/teacher/*.
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import apiClient from "@/utils/apiClient";

export default function TeacherClassroomConsole() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [attendance, setAttendance] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/meet/teacher/sessions");
      setSessions(res.data?.sessions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your classes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id, path, after) => {
    setBusyId(id);
    try {
      const res = await apiClient.post(path);
      if (after) await after(res.data);
      await load();
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
      return null;
    } finally {
      setBusyId(null);
    }
  };

  const startClass = (id) => act(id, `/meet/teacher/${id}/start`, (d) => {
    const link = d?.meeting?.link;
    if (link) window.open(link, "_blank", "noopener,noreferrer");
  });
  const endClass = (id) => act(id, `/meet/teacher/${id}/end`);
  const regenerate = (id) => act(id, `/meet/teacher/${id}/regenerate`);
  const joinMeet = (s) => { if (s.meetingLink) window.open(s.meetingLink, "_blank", "noopener,noreferrer"); };

  const copyLink = async (s) => {
    try {
      await navigator.clipboard.writeText(s.meetingLink || "");
      setCopiedId(String(s.sessionId));
      setTimeout(() => setCopiedId(null), 1500);
    } catch { /* clipboard unavailable */ }
  };

  const viewAttendance = async (id) => {
    setBusyId(id);
    try {
      const res = await apiClient.get(`/meet/teacher/${id}/attendance`);
      setAttendance({ sessionId: id, rows: res.data?.attendance || [], count: res.data?.count || 0 });
    } catch (err) {
      setError(err.response?.data?.message || "Could not load attendance");
    } finally {
      setBusyId(null);
    }
  };
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 sm:text-lg">Classroom Console</h3>
        <p className="text-xs text-slate-500 sm:text-sm">Start, manage and review your virtual classes.</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</div>}
      {loading && <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Loading your schedule…</div>}

      {!loading && !sessions.length && (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">No scheduled classes.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {sessions.map((s) => {
          const id = String(s.sessionId);
          const busy = busyId === id;
          return (
            <div key={id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{s.subject || "Class"}</p>
                  <p className="text-xs text-slate-500">{new Date(s.date).toLocaleDateString()} · {s.startTime}–{s.endTime} {s.isSubstitute ? "· substituting" : ""}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${s.status === "live" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>{s.status}</span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Meeting: <span className={s.meetingStatus === "ready" ? "font-semibold text-emerald-600" : "font-semibold text-amber-600"}>{s.meetingStatus}</span>
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {s.status === "live" ? (
                  <Button size="sm" disabled={busy} onClick={() => endClass(id)} className="h-8 rounded-full bg-slate-800 hover:bg-slate-900">End Class</Button>
                ) : (
                  <Button size="sm" disabled={busy || s.status === "cancelled"} onClick={() => startClass(id)} className="h-8 rounded-full">Start Class</Button>
                )}
                {s.meetingLink && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => joinMeet(s)} className="h-8 rounded-full">Join Meet</Button>
                    <Button size="sm" variant="outline" onClick={() => copyLink(s)} className="h-8 rounded-full">{copiedId === id ? "Copied" : "Copy Link"}</Button>
                  </>
                )}
                {s.meetingStatus !== "ready" && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => regenerate(id)} className="h-8 rounded-full">Regenerate Link</Button>
                )}
                <Button size="sm" variant="outline" disabled={busy} onClick={() => viewAttendance(id)} className="h-8 rounded-full">Attendance</Button>
              </div>

              {attendance?.sessionId === id && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Attendance ({attendance.count})</p>
                  {attendance.rows.length ? (
                    <ul className="mt-1 space-y-1">
                      {attendance.rows.map((a) => (
                        <li key={a.student?.id || Math.random()} className="text-xs text-slate-600">
                          {a.student?.name || "Student"} — {a.duration ?? 0} min {a.leftAt ? "" : "(in class)"}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="mt-1 text-xs text-slate-500">No students have joined yet.</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}