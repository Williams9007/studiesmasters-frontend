// components/qao/WorkloadModule.jsx
// Teacher workload balance: weekly hours per teacher with configurable
// status categories (underloaded / balanced / heavy / overloaded).
import { useCallback, useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import apiClient from "../../utils/apiClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { RefreshCw } from "lucide-react";

const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("qaoToken")}` } });

const STATUS_STYLES = {
  underloaded: "bg-sky-100 text-sky-700",
  balanced: "bg-emerald-100 text-emerald-700",
  heavy: "bg-amber-100 text-amber-700",
  overloaded: "bg-rose-100 text-rose-700",
};
const BAR_COLORS = { underloaded: "#0ea5e9", balanced: "#059669", heavy: "#f59e0b", overloaded: "#e11d48" };

export default function WorkloadModule() {
  const [workload, setWorkload] = useState([]);
  const [thresholds, setThresholds] = useState({ underloaded: 10, balanced: 20, heavy: 30 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/qao/workload", config());
      setWorkload(Array.isArray(res.data?.workload) ? res.data.workload : []);
      if (res.data?.thresholds) setThresholds(res.data.thresholds);
    } catch (err) {
      console.error("Workload load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sorted = [...workload].sort((a, b) => b.hours - a.hours);
  const chartData = sorted.map((w) => ({ name: w.name, hours: w.hours, status: w.status }));
  const counts = {
    underloaded: workload.filter((w) => w.status === "underloaded").length,
    balanced: workload.filter((w) => w.status === "balanced").length,
    heavy: workload.filter((w) => w.status === "heavy").length,
    overloaded: workload.filter((w) => w.status === "overloaded").length,
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm">Weekly hours per teacher</p>
        <Button variant="outline" size="sm" onClick={load} className="h-8 rounded-lg px-3 text-[11px] font-semibold sm:text-xs"><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(counts).map(([status, count]) => (
          <div key={status} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 sm:rounded-[1.25rem] sm:p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{status}</p>
            <p className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">{count}</p>
          </div>
        ))}
      </div>

      <Card className="border border-slate-200 bg-white shadow-lg sm:shadow-2xl">
        <CardHeader>
          <CardTitle className="text-base text-slate-900 sm:text-lg">Hours per teacher</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Thresholds: underloaded &lt;{thresholds.underloaded}h · balanced {thresholds.underloaded}-{thresholds.balanced}h · heavy {thresholds.balanced}-{thresholds.heavy}h · overloaded ≥{thresholds.heavy}h (configurable via WORKLOAD_* env vars).</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          {chartData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 24 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={52} />
                <YAxis tick={{ fontSize: 10 }} label={{ value: "h/week", angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
                <Tooltip wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={thresholds.heavy} stroke="#e11d48" strokeDasharray="4 4" />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => <Bar key={entry.name} fill={BAR_COLORS[entry.status]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">No workload data.</div>
          )}
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-lg sm:shadow-2xl">
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400 sm:text-[11px]">
                  <th className="py-2 pr-3">Teacher</th>
                  <th className="py-2 pr-3">Subjects</th>
                  <th className="py-2 pr-3">Sessions</th>
                  <th className="py-2 pr-3">Hours/week</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((w) => (
                  <tr key={w.teacherId} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-3 font-semibold text-slate-900">{w.name}</td>
                    <td className="py-2 pr-3 text-slate-500">{(w.subjects || []).join(", ") || "N/A"}</td>
                    <td className="py-2 pr-3 text-slate-600">{w.sessions}</td>
                    <td className="py-2 pr-3 font-semibold text-violet-700">{w.hours}h</td>
                    <td className="py-2"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold sm:text-[11px] ${STATUS_STYLES[w.status]}`}>{w.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
