// src/components/Admin/MoodleTab.jsx
//
// Admin dashboard tab for the StudiesMasters <-> Moodle integration:
// provisioning, bulk sync, reconciliation, course mappings, queue status,
// health and recent errors. Talks exclusively to /api/moodle/* admin routes.

import { useCallback, useEffect, useState } from "react";
import apiClient from "../config/api.js";

const Card = ({ title, children }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
    {children}
  </div>
);

const Stat = ({ label, value, tone = "slate" }) => {
  const tones = {
    slate: "bg-slate-100 text-slate-800",
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-rose-100 text-rose-800",
  };
  return (
    <div className={`rounded-lg px-4 py-3 ${tones[tone]}`}>
      <div className="text-2xl font-bold">{value ?? "—"}</div>
      <div className="text-xs font-medium opacity-80">{label}</div>
    </div>
  );
};

const Btn = ({ onClick, busy, children, variant = "primary" }) => {
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
    secondary: "bg-slate-200 hover:bg-slate-300 text-slate-800",
  };
  return (
    <button onClick={onClick} disabled={busy}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${variants[variant]}`}>
      {busy ? "Working…" : children}
    </button>
  );
};

export default function MoodleTab() {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [provisionStatus, setProvisionStatus] = useState(null);
  const [health, setHealth] = useState(null);
  const [queue, setQueue] = useState(null);
  const [mappings, setMappings] = useState([]);
  const [showMappings, setShowMappings] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [showWarnings, setShowWarnings] = useState(false);
  const [previewId, setPreviewId] = useState("");
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [status, hlt, que, maps, sync, warns] = await Promise.all([
        apiClient.get("/moodle/provision/status").then((r) => r.data),
        apiClient.get("/moodle/health").then((r) => r.data),
        apiClient.get("/moodle/queue").then((r) => r.data),
        apiClient.get("/moodle/course-mappings").then((r) => r.data),
        apiClient.get("/moodle/sync-status").then((r) => r.data).catch(() => null),
        apiClient.get("/moodle/warnings").then((r) => r.data).catch(() => null),
      ]);
      setProvisionStatus(status || {});
      setHealth(hlt || {});
      setQueue(que || {});
      setMappings(maps?.mappings || []);
      setSyncStatus(sync || {});
      setWarnings(warns?.warnings || []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load Moodle status");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (key, fn) => {
    setBusy(key); setError(null); setNotice(null);
    try {
      const data = await fn();
      setNotice(JSON.stringify(data?.data || data, null, 2).slice(0, 600));
      await load();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Action failed");
    } finally { setBusy(null); }
  };

  const runProvision = () => act("provision", () => apiClient.post("/moodle/provision", {}));
  const runSyncAll = () => act("syncall", () => apiClient.post("/moodle/sync-all-users", {}));
  const runReconcile = () => act("reconcile", () => apiClient.post("/moodle/reconcile", {}));
  const runRetryFailed = () => act("retryfailed", () => apiClient.post("/moodle/retry-failed", {}));

  const runPreview = async () => {
    if (!previewId.trim()) return;
    setBusy("preview"); setError(null); setPreview(null);
    try {
      const r = await apiClient.get(`/moodle/access-preview/${previewId.trim()}`);
      setPreview(r.data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Preview failed");
    } finally { setBusy(null); }
  };

  const runSyncStudent = async () => {
    if (!previewId.trim()) return;
    await act("syncstudent", () => apiClient.post("/moodle/sync", { id: previewId.trim(), role: "student" }));
  };

  const lastSyncLabel = queue?.lastSynchronization
    ? new Date(queue.lastSynchronization).toLocaleString() : "Never";
  const failedTotal = (queue?.failed || 0) + (queue?.deadLetter || 0);

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Btn onClick={runProvision} busy={busy === "provision"}>Provision Moodle</Btn>
        <Btn onClick={runSyncAll} busy={busy === "syncall"}>Sync All Students</Btn>
        <Btn onClick={runReconcile} busy={busy === "reconcile"}>Reconcile Enrollments</Btn>
        <Btn onClick={runRetryFailed} busy={busy === "retryfailed"} variant="secondary">Retry Failed Syncs</Btn>
        <Btn variant="secondary" onClick={() => setShowMappings((v) => !v)}>
          {showMappings ? "Hide Course Mappings" : `View Course Mappings (${mappings.length})`}
        </Btn>
      </div>

      {/* Student access preview + single-student sync */}
      <Card title="Student Moodle Access Preview">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={previewId}
            onChange={(e) => setPreviewId(e.target.value)}
            placeholder="Student MongoDB _id"
            className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
          <Btn onClick={runPreview} busy={busy === "preview"} variant="secondary">Preview Access</Btn>
          <Btn onClick={runSyncStudent} busy={busy === "syncstudent"}>Sync Student</Btn>
        </div>
        {preview && (
          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm">
            <p><b>{preview.student?.name}</b> · {preview.student?.curriculum} {preview.student?.grade} · {preview.student?.package || "(no package)"} · source: <b>{preview.student?.subjectSource}</b></p>
            <p className="mt-1 text-slate-600">Subjects: {(preview.student?.subjects || []).join(", ") || "none"}</p>
            {preview.courses?.length ? (
              <ul className="mt-2 space-y-1">
                {preview.courses.map((c) => (
                  <li key={c.courseId} className="text-emerald-700">✓ {c.curriculum} {c.grade} {c.subject} — Moodle course {c.courseId}</li>
                ))}
              </ul>
            ) : <p className="mt-2 text-rose-700">✗ No Moodle courses resolved — sync would be blocked (NO_COURSES_FOUND).</p>}
            {preview.warnings?.length ? (
              <ul className="mt-2 space-y-1 text-xs text-amber-700">
                {preview.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}
              </ul>
            ) : null}
          </div>
        )}
      </Card>

      {/* Admin warnings */}
      <Card title={`Sync Warnings (${warnings.length})`}>
        <Btn variant="secondary" onClick={() => setShowWarnings((v) => !v)}>
          {showWarnings ? "Hide Warnings" : "Show Warnings"}
        </Btn>
        {showWarnings && (warnings.length ? (
          <ul className="mt-3 max-h-72 space-y-2 overflow-auto text-xs">
            {warnings.map((w) => (
              <li key={w.studentId} className="rounded border border-amber-200 bg-amber-50 p-3">
                <b>{w.name}</b> ({w.status}) · {w.curriculum || "—"} · {w.grade || "—"} · {w.package || "no package"}
                <span className="block text-slate-600">Issue: {w.warnings?.[0]?.message || w.lastError || "No matching Moodle courses found. Review CourseMapping."}</span>
                <span className="block text-slate-400">Action: Review CourseMapping · last sync {w.lastSync ? new Date(w.lastSync).toLocaleString() : "never"}</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-3 text-sm text-slate-500">No students need attention 🎉</p>)}
      </Card>

      {error && <div className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">⚠️ {error}</div>}
      {notice && <pre className="max-h-56 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-emerald-300">{notice}</pre>}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Moodle Courses" value={provisionStatus?.provisionedCourses ?? "—"} tone="green" />
        <Stat label="Categories" value={provisionStatus?.provisionedCategories ?? "—"} tone="green" />
        <Stat label="Students Synced" value={syncStatus?.studentsSynced ?? queue?.succeeded ?? "—"} tone="green" />
        <Stat label="Without Courses" value={syncStatus?.studentsWithoutCourses ?? 0} tone={(syncStatus?.studentsWithoutCourses || 0) > 0 ? "amber" : "slate"} />
        <Stat label="Failed Syncs" value={syncStatus?.failedSyncs ?? failedTotal} tone={(syncStatus?.failedSyncs || 0) > 0 ? "red" : "slate"} />
        <Stat label="Pending Jobs" value={queue?.pending ?? "—"} tone={(queue?.pending || 0) > 0 ? "amber" : "slate"} />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Successful Syncs" value={syncStatus?.successfulSyncs ?? "—"} />
        <Stat label="Dead-letter Jobs" value={queue?.deadLetter ?? 0} tone={(queue?.deadLetter || 0) > 0 ? "red" : "slate"} />
        <Stat label="Course Mappings" value={syncStatus?.courseMapping?.enabled ?? mappings.length} />
        <Stat label="Empty Mappings" value={syncStatus?.courseMapping?.empty ?? 0} tone={(syncStatus?.courseMapping?.empty || 0) > 0 ? "amber" : "slate"} />
        <Stat label="Admin Warnings" value={warnings.length} tone={warnings.length > 0 ? "amber" : "slate"} />
        <Stat label="Moodle Reachable" value={health?.dryRun ? "dry-run" : health?.moodleReachable ? "Yes" : "No"} tone={health?.moodleReachable ? "green" : "amber"} />
      </div>

      {/* Health / sync status */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Synchronization Status">
          <ul className="space-y-2 text-sm text-slate-700">
            <li>Last Synchronization: <b>{lastSyncLabel}</b></li>
            <li>In-progress jobs: <b>{queue?.inProgress ?? "—"}</b></li>
            <li>Expected courses: <b>{provisionStatus?.expectedCourses ?? "—"}</b> · missing: <b>{provisionStatus?.missingCourses ?? "—"}</b></li>
            <li>Fully provisioned: <b>{provisionStatus?.fullyProvisioned ? "Yes ✅" : "No ⚠️"}</b></li>
          </ul>
        </Card>
        <Card title="Recent Errors">
          {queue?.recentErrors?.length ? (
            <ul className="max-h-48 space-y-2 overflow-auto text-xs">
              {queue.recentErrors.map((e) => (
                <li key={e._id} className="rounded border border-rose-100 bg-rose-50 p-2">
                  <b>{e.type}</b> (attempt {e.attempts}): {String(e.lastError).slice(0, 160)}
                  <span className="block text-slate-400">{new Date(e.updatedAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">No recent errors 🎉</p>}
        </Card>
      </div>

      {/* Course mappings */}
      {showMappings && (
        <Card title={`Course Mappings (${mappings.length})`}>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500">
                <tr><th className="p-2">Curriculum</th><th className="p-2">Grade</th><th className="p-2">Subject</th><th className="p-2">Moodle Course ID</th><th className="p-2">Category</th></tr>
              </thead>
              <tbody>
                {mappings.map((m) => (
                  <tr key={m._id} className="border-t border-slate-100">
                    <td className="p-2">{m.curriculum || "—"}</td>
                    <td className="p-2">{m.grade || "—"}</td>
                    <td className="p-2">{m.subjectName}</td>
                    <td className="p-2 font-mono">{m.targets?.[0]?.moodleCourseId ?? "—"}</td>
                    <td className="p-2 font-mono">{m.targets?.[0]?.categoryId ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
