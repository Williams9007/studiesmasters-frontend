// components/qao/PerformanceModule.jsx
// Phase 4 — Teacher Performance Intelligence.
// Sources of truth: ClassSession, Teacher, LeaveRequest, Availability.
// All responses are QAO-safe (no student PII). Values are computed, not stored.
import { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import apiClient from "../../utils/apiClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { RefreshCw, FileClock, Download } from "lucide-react";

const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("qaoToken")}` } });
const LEVEL_COLORS = { underloaded: "#0ea5e9", balanced: "#059669", heavy: "#f59e0b", overloaded: "#e11d48" };

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function PerformanceModule() {
  const [month, setMonth] = useState(currentMonth());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiClient.get(`/qao/performance?month=${month}`, config());
      setStats(r.data?.rows ? { rows: r.data.rows, totals: r.data.totals, month: r.data.month } : null);
    } catch (err) {
      console.error("Performance load error:", err);
      setNotice("Could not load performance data.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  const generateSnapshot = async () => {
    setGenerating(true);
    setNotice("");
    try {
      const r = await apiClient.post(`/qao/performance/generate?month=${month}`, {}, config());
      setNotice(`Snapshot generated for ${month} — ${r.data?.results?.length || 0} teachers.`);
      await load();
    } catch (err) {
      console.error("Generate snapshot error:", err);
      setNotice("Snapshot generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadExport = async (format) => {
    try {
      const res = await fetch(
        `${(import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "")}/api/qao/export/performance?month=${month}&format=${format}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("qaoToken")}` } }
      );
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `performance-${month}.${format === "pdf" ? "html" : "csv"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      setNotice("Export failed.");
    }
  };

  if (loading || !stats) {
    return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">Loading performance intelligence...</div>;
  }

  const hoursData = stats.rows.map((r) => ({ name: r.name, hours: r.teachingHours }));
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm">Teacher performance</p>
        <div className="flex items-center gap-2">
          <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono" />
          <Button variant="outline" size="sm" onClick={load} className="h-8 rounded-lg px-2.5 text-[11px] sm:text-xs">
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={generateSnapshot} disabled={generating} className="h-8 rounded-lg bg-violet-600 px-2.5 text-[11px] font-semibold text-white hover:bg-violet-700 sm:text-xs">
            <FileClock className="mr-1 h-3.5 w-3.5" /> {generating ? "Saving..." : "Generate snapshot"}
          </Button>
        </div>
      </div>
      {notice && <p className="text-xs text-violet-700">{notice}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <MiniBox label="Completed" value={stats.totals.completed} color="text-emerald-700" />
        <MiniBox label="Cancelled" value={stats.totals.cancelled} color="text-rose-600" />
        <MiniBox label="Substituted" value={stats.totals.substituted} color="text-amber-600" />
        <MiniBox label="Teaching hours" value={stats.totals.hours} color="text-violet-700" />
      </div>

      <Card className="border border-slate-200 bg-white shadow-lg sm:shadow-xl">
        <CardHeader>
          <CardTitle className="text-base text-slate-900 sm:text-lg">Teaching Hours per Teacher</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{month} — completed & held sessions only.</CardDescription>
        </CardHeader>
        <CardContent className="h-56">
          {hoursData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hoursData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-16} textAnchor="end" height={48} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals />
                <Tooltip wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="hours" fill="#7c3aed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart text="No completed sessions this month." />}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => downloadExport("csv")} className="h-8 rounded-lg px-3 text-[11px] sm:text-xs">
          <Download className="mr-1 h-3.5 w-3.5" /> CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadExport("pdf")} className="h-8 rounded-lg px-3 text-[11px] sm:text-xs">
          <Download className="mr-1 h-3.5 w-3.5" /> Print / PDF
        </Button>
      </div>

      <Card className="border border-slate-200 bg-white shadow-lg sm:shadow-xl">
        <CardHeader>
          <CardTitle className="text-base text-slate-900 sm:text-lg">Teacher Leaderboard — {month}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Workload, outcomes, and cancellation rate. No student data shown.</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.rows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400 sm:text-[11px]">
                    <th className="py-2 pr-3">Teacher</th>
                    <th className="py-2 pr-3">Curriculum</th>
                    <th className="py-2 pr-3">Completed</th>
                    <th className="py-2 pr-3">Cancelled</th>
                    <th className="py-2 pr-3">Substituted</th>
                    <th className="py-2 pr-3">Hours</th>
                    <th className="py-2 pr-3">Cancel rate</th>
                    <th className="py-2">Workload</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.rows.map((r) => (
                    <tr key={r.teacherId || r.name} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-3 font-semibold text-slate-900">{r.name}</td>
                      <td className="py-2 pr-3 text-slate-600">{r.curriculum || "—"}</td>
                      <td className="py-2 pr-3 text-emerald-700">{r.completedClasses}</td>
                      <td className="py-2 pr-3 text-rose-600">{r.cancelledClasses}</td>
                      <td className="py-2 pr-3 text-amber-600">{r.substitutedClasses}</td>
                      <td className="py-2 pr-3 font-semibold text-violet-700">{r.teachingHours}h</td>
                      <td className="py-2 pr-3 text-slate-600">{r.cancellationRate}%</td>
                      <td className="py-2"><span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: LEVEL_COLORS[r.workloadLevel] + "1a", color: LEVEL_COLORS[r.workloadLevel] }}>{r.workloadLevel}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">No performance data for this month.</div>}
        </CardContent>
      </Card>
    </div>
  );
}

function MiniBox({ label, value, color }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function EmptyChart({ text }) {
  return <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500 sm:text-sm">{text}</div>;
}