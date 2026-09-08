// components/qao/ReportsModule.jsx
// Operational reports for the Tutor Manager: teaching hours, completed vs
// cancelled classes, curriculum distribution, weekly activity, workload table.
// Data source: /qao/reports (ClassSession + ClassGroup aggregations, no student data).
import { useCallback, useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import apiClient from "../../utils/apiClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { RefreshCw, Download } from "lucide-react";

const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("qaoToken")}` } });
const PIE_COLORS = ["#7c3aed", "#f59e0b", "#0ea5e9", "#059669", "#e11d48"];

export default function ReportsModule() {
  const [reports, setReports] = useState(null);
  const [teacherNames, setTeacherNames] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, t] = await Promise.all([
        apiClient.get("/qao/reports", config()),
        apiClient.get("/qao/teachers/all", config()),
      ]);
      setReports(r.data?.reports || null);
      const names = {};
      (t.data?.teachers || []).forEach((x) => { names[x._id] = x.fullName || x.name || "Teacher"; });
      setTeacherNames(names);
    } catch (err) {
      console.error("Reports load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const downloadExport = async (kind, format) => {
    try {
      const base = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
      const path = kind === "sessions" ? `/api/qao/export/sessions?format=${format}` : `/api/qao/export/performance?format=${format}`;
      const res = await fetch(base + path, { headers: { Authorization: `Bearer ${localStorage.getItem("qaoToken")}` } });
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind}-report.${format === "pdf" ? "html" : "csv"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
    }
  };

  if (loading || !reports) {
    return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">Loading reports...</div>;
  }

  const hoursData = (reports.workload || []).map((w) => ({
    name: teacherNames[w.teacherId] || "Teacher",
    hours: w.teachingHours,
    sessions: w.totalSessions,
  }));

  const statusData = [
    { name: "Completed", value: reports.totals?.completed || 0 },
    { name: "Cancelled", value: reports.totals?.cancelled || 0 },
  ];

  const curriculumData = (reports.curriculumDistribution || []).map((c) => ({
    name: c._id || "Unspecified",
    value: c.groups,
  }));

  const weeklyData = (reports.weeklyActivity || []).map((w) => ({
    day: w._id,
    Completed: w.completed,
    Cancelled: w.cancelled,
    Scheduled: w.scheduled,
  }));

  const totalCurriculum = curriculumData.reduce((a, c) => a + c.value, 0) || 1;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm">Operational reports</p>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => downloadExport("sessions", "csv")} className="h-8 rounded-lg px-2.5 text-[11px] font-semibold sm:text-xs">
            <Download className="mr-1 h-3.5 w-3.5" /> Sessions
          </Button>
          <Button variant="outline" size="sm" onClick={() => downloadExport("performance", "csv")} className="h-8 rounded-lg px-2.5 text-[11px] font-semibold sm:text-xs">
            <Download className="mr-1 h-3.5 w-3.5" /> Performance
          </Button>
          <Button variant="outline" size="sm" onClick={load} className="h-8 rounded-lg px-2.5 text-[11px] font-semibold sm:text-xs">
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 sm:gap-4">
        <Card className="border border-slate-200 bg-white shadow-lg sm:shadow-xl">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 sm:text-lg">Weekly Teaching Hours</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Hours per teacher from completed & held sessions.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {hoursData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hoursData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-16} textAnchor="end" height={48} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="hours" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart text="No session data yet." />
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-lg sm:shadow-xl">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 sm:text-lg">Completed vs Cancelled</CardTitle>
            <CardDescription className="text-xs sm:text-sm">All-time session outcomes.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {statusData.some((s) => s.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={3}>
                    {statusData.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip wrapperStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart text="No completed or cancelled sessions yet." />
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-lg sm:shadow-xl">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 sm:text-lg">Curriculum Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Class groups by curriculum (GES vs Cambridge).</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {curriculumData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={curriculumData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={3}>
                    {curriculumData.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip wrapperStyle={{ fontSize: 11 }} formatter={(v) => [`${Math.round((v / totalCurriculum) * 100)}%`, "Share"]} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart text="No class groups yet." />
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-lg sm:shadow-xl">
          <CardHeader>
            <CardTitle className="text-base text-slate-900 sm:text-lg">Weekly Activity</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Session volume over the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {weeklyData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip wrapperStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Completed" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Cancelled" stackId="a" fill="#94a3b8" />
                  <Bar dataKey="Scheduled" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart text="No sessions in the last 7 days." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200 bg-white shadow-lg sm:shadow-2xl">
        <CardHeader>
          <CardTitle className="text-base text-slate-900 sm:text-lg">Classes Per Teacher</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Sessions, completed, cancelled, and teaching hours.</CardDescription>
        </CardHeader>
        <CardContent>
          {reports.workload?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400 sm:text-[11px]">
                    <th className="py-2 pr-3">Teacher</th>
                    <th className="py-2 pr-3">Sessions</th>
                    <th className="py-2 pr-3">Completed</th>
                    <th className="py-2 pr-3">Cancelled</th>
                    <th className="py-2">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.workload.map((w) => {
                    const byStatus = (s) => w.byStatus?.find((b) => b.status === s)?.sessions || 0;
                    return (
                      <tr key={w.teacherId} className="border-b border-slate-100 last:border-0">
                        <td className="py-2 pr-3 font-semibold text-slate-900">{teacherNames[w.teacherId] || w.teacherId}</td>
                        <td className="py-2 pr-3 text-slate-600">{w.totalSessions}</td>
                        <td className="py-2 pr-3 text-emerald-700">{byStatus("completed")}</td>
                        <td className="py-2 pr-3 text-rose-600">{byStatus("cancelled")}</td>
                        <td className="py-2 font-semibold text-violet-700">{w.teachingHours}h</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">No workload data yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart({ text }) {
  return <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-500 sm:text-sm">{text}</div>;
}
