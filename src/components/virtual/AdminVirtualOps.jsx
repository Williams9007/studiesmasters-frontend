// components/virtual/AdminVirtualOps.jsx
//
// Admin Virtual Classroom Operations Center (Phase 6D + 6H + 6J).
// Master schedule, analytics, force actions (reason-gated) and Google
// Workspace settings (masked values only — secrets never returned).
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import apiClient from "@/utils/apiClient";

function Stat({ label, value, tone = "slate" }) {
  const tones = { slate: "bg-slate-50 text-slate-900", red: "bg-red-50 text-red-700", emerald: "bg-emerald-50 text-emerald-700" };
  return (
    <div className={`rounded-2xl border border-slate-200 p-3 ${tones[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-0.5 text-lg font-bold sm:text-xl">{value}</p>
    </div>
  );
}

export default function AdminVirtualOps() {
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [settings, setSettings] = useState(null);
  const [testMsg, setTestMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [reasonFor, setReasonFor] = useState(null); // {id, action}
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [a, b, c] = await Promise.all([
        apiClient.get("/meet/admin/overview"),
        apiClient.get("/meet/admin/virtual-analytics"),
        apiClient.get("/meet/admin/google-status"),
      ]);
      setOverview(a.data || null);
      setAnalytics(b.data?.analytics || null);
      setSettings(c.data?.settings || null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load the operations center");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const testConnection = async () => {
    setTestMsg("Testing…");
    try {
      const res = await apiClient.post("/meet/admin/google-status/test-connection");
      setTestMsg(`${res.data?.mode === "live" ? "LIVE" : "MOCK"} — ${res.data?.message || "OK"}`);
    } catch (err) {
      setTestMsg(err.response?.data?.message || "Test failed");
    }
  };

  const runForce = async () => {
    if (!reasonFor) return;
    const { id, action } = reasonFor;
    if (!reason.trim()) { setError("A reason is required for every override."); return; }
    setBusyId(id);
    setError("");
    try {
      await apiClient.post(`/meet/admin/${id}/${action}`, { reason: reason.trim() });
      setReasonFor(null);
      setReason("");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const FORCE_ACTIONS = [
    ["force-start", "Force Start"], ["force-end", "Force End"], ["force-cancel", "Force Cancel"],
    ["force-create-meeting", "Force Meeting"], ["force-replace-teacher", "Replace Teacher"],
  ];
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-slate-900 sm:text-lg">Virtual Classroom Operations</h3>
        <p className="text-xs text-slate-500 sm:text-sm">Master schedule, analytics and Google Workspace status.</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</div>}
      {loading && <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Loading…</div>}

      {overview?.stats && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <Stat label="Total classes" value={overview.stats.total} />
          <Stat label="Today" value={overview.stats.daily} />
          <Stat label="This week" value={overview.stats.weekly} />
          <Stat label="This month" value={overview.stats.monthly} />
          <Stat label="Live now" value={overview.stats.live} tone="red" />
          <Stat label="Meeting pending" value={overview.stats.meetingPending} tone="red" />
          <Stat label="Meeting failed" value={overview.stats.meetingFailed} tone="red" />
        </div>
      )}

      {analytics && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Analytics</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <p>Meeting success: <span className="font-bold">{analytics.meeting?.successRate}%</span></p>
            <p>Join rate: <span className="font-bold">{analytics.attendance?.joinRate}%</span></p>
            <p>Late rate: <span className="font-bold">{analytics.attendance?.lateRate}%</span></p>
            <p>Avg duration: <span className="font-bold">{analytics.attendance?.avgDurationMinutes} min</span></p>
          </div>
          {analytics.mostActiveStudents?.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Most active students</p>
              <ul className="mt-1 space-y-0.5 text-xs text-slate-600">
                {analytics.mostActiveStudents.slice(0, 5).map((s) => (
                  <li key={String(s.studentId)}>{s.name} ({s.userId}) — {s.joins} joins · {s.minutes} min</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {settings && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Google Workspace (masked)</p>
          <div className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
            <p>Enabled: <span className="font-bold">{String(settings.enabled)}</span></p>
            <p>Mock mode: <span className="font-bold">{String(settings.allowMock)}</span></p>
            <p>Client ID: <span className="font-mono">{settings.clientId || "not set"}</span></p>
            <p>Client secret: <span className="font-mono">{settings.clientSecret || "not set"}</span></p>
            <p>OAuth configured: <span className="font-bold">{String(settings.oauthConfigured)}</span></p>
            <p>Timezone: <span className="font-bold">{settings.timezone}</span></p>
            <p className="sm:col-span-2">
              Refresh token: {settings.tokenStatus
                ? (settings.tokenStatus.hasRefreshToken ? <span className="font-bold text-emerald-600">stored (encrypted)</span> : <span className="font-bold text-amber-600">missing</span>)
                : <span className="font-bold text-slate-400">no token yet</span>}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={testConnection} className="h-8 rounded-full">Test connection</Button>
            {testMsg && <span className="text-xs text-slate-600">{testMsg}</span>}
          </div>
        </section>
      )}
      <section>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Master schedule (recent 50)</p>
        <div className="space-y-2">
          {(overview?.sessions || []).map((s) => {
            const id = String(s.sessionId);
            const busy = busyId === id;
            return (
              <div key={id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 sm:text-sm">{s.subject} · {new Date(s.date).toLocaleDateString()} {s.startTime}–{s.endTime}</p>
                    <p className="text-[11px] text-slate-500">{s.teacher}{s.substitute ? ` (sub: ${s.substitute})` : ""} · {s.status} · meeting {s.meetingStatus} · stage {s.stage}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FORCE_ACTIONS.map(([action, label]) => (
                      <Button key={action} size="sm" variant="outline" disabled={busy}
                        onClick={() => { setReasonFor({ id, action }); setReason(""); }}
                        className="h-7 rounded-full text-[11px]">{label}</Button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          {!loading && !overview?.sessions?.length && (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">No sessions yet.</p>
          )}
        </div>
      </section>

      {reasonFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <p className="text-sm font-bold text-slate-900">Override required</p>
            <p className="mt-1 text-xs text-slate-500">Every override requires a reason and is written to the audit log. QAO will be notified.</p>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="e.g. Emergency replacement" className="mt-3 w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="mt-3 flex justify-end gap-2">
              <Button size="sm" variant="outline" className="h-8 rounded-full" onClick={() => setReasonFor(null)}>Cancel</Button>
              <Button size="sm" className="h-8 rounded-full" disabled={busyId === reasonFor.id} onClick={runForce}>Confirm override</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}