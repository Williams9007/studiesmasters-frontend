// components/virtual/LiveOpsCenter.jsx
//
// QAO Live Classroom Operations Center (Phase 6C). Aggregated monitoring plus
// per-session actions. Counts only — no student PII is displayed.
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import apiClient from "@/utils/apiClient";

function Stat({ label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-900",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-800",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className={`rounded-2xl border border-slate-200 p-3 ${tones[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-0.5 text-lg font-bold sm:text-xl">{value}</p>
    </div>
  );
}

export default function LiveOpsCenter() {
  const [ops, setOps] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [a, b] = await Promise.all([
        apiClient.get("/meet/qao/live-ops"),
        apiClient.get("/qao/sessions/today"),
      ]);
      setOps(a.data?.ops || null);
      setSessions(b.data?.sessions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load live operations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const action = async (id, fn) => {
    setBusyId(id);
    try { await fn(); await load(); }
    catch (err) { setError(err.response?.data?.message || "Action failed"); }
    finally { setBusyId(null); }
  };

  const regenerate = (id) => action(id, () => apiClient.post(`/meet/${id}/regenerate`));
  const endSession = (id) => action(id, () => apiClient.patch(`/qao/sessions/${id}`, { status: "completed" }));
  const cancelSession = (id) => action(id, () => apiClient.patch(`/qao/sessions/${id}`, { status: "cancelled" }));

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 sm:text-lg">Live Operations Center</h3>
        <p className="text-xs text-slate-500 sm:text-sm">Real-time view of virtual classroom operations.</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</div>}
      {loading && <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Loading operations…</div>}

      {ops && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <Stat label="Live classes" value={ops.liveClasses} tone="red" />
          <Stat label="Upcoming today" value={ops.upcomingToday} />
          <Stat label="Teachers online" value={ops.teachersOnline} tone="emerald" />
          <Stat label="Teachers offline" value={ops.teachersOffline} />
          <Stat label="Students joined" value={ops.studentsJoined} tone="emerald" />
          <Stat label="Attendance %" value={`${ops.attendanceRate}%`} />
          <Stat label="Meeting pending" value={ops.meetingPending} tone="amber" />
          <Stat label="Meeting failed" value={ops.meetingFailed} tone="red" />
        </div>
      )}

      <section>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Today's sessions</p>
        {!sessions.length && <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">No sessions today.</p>}
        <div className="space-y-2">
          {sessions.map((s) => {
            const id = String(s._id);
            const busy = busyId === id;
            return (
              <div key={id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 sm:text-sm">
                      {s.classGroup?.subject || "Class"} · {s.startTime}–{s.endTime}
                    </p>
                    <p className="text-[11px] text-slate-500">{s.teacher?.fullName || "Unassigned"} · {s.classGroup?.grade || ""} · {s.status}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => regenerate(id)} className="h-7 rounded-full text-[11px]">Regenerate</Button>
                    {s.status !== "completed" && (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => endSession(id)} className="h-7 rounded-full text-[11px]">End</Button>
                    )}
                    {s.status !== "cancelled" && (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => cancelSession(id)} className="h-7 rounded-full text-[11px]">Cancel</Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}