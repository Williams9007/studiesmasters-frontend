// components/qao/AuditLogsModule.jsx
// Phase 4 — Operational audit trail for Tutor Manager & admin actions.
// Data source: /qao/audit-logs (actorRole qao|admin). No student PII.
import { useCallback, useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { RefreshCw, ScrollText } from "lucide-react";

const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("qaoToken")}` } });

function fmtDate(value) {
  if (!value) return "—";
  try { return new Date(value).toLocaleString([], { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
  catch { return "—"; }
}

export default function AuditLogsModule() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [actions, setActions] = useState([]);
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiClient.get(`/qao/audit-logs?limit=200${action ? `&action=${encodeURIComponent(action)}` : ""}`, config());
      const list = Array.isArray(r.data?.logs) ? r.data.logs : [];
      setLogs(list);
      setTotal(r.data?.total || 0);
      setActions([...new Set(list.map((l) => l.action))].sort());
    } catch (err) {
      console.error("Audit log load error:", err);
    } finally {
      setLoading(false);
    }
  }, [action]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm">Audit logs · {total} records</p>
        <div className="flex items-center gap-2">
          <select value={action} onChange={(e) => setAction(e.target.value)} className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs">
            <option value="">All actions</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <Button variant="outline" size="sm" onClick={load} className="h-8 rounded-lg px-2.5 text-[11px] sm:text-xs">
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      <Card className="border border-slate-200 bg-white shadow-lg sm:shadow-xl">
        <CardHeader>
          <CardTitle className="text-base text-slate-900 sm:text-lg"><ScrollText className="mr-1.5 inline h-4 w-4" />Operational trail</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Tutor Manager and admin sensitive actions. Newest first.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">Loading audit logs...</div>
          ) : logs.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400 sm:text-[11px]">
                    <th className="py-2 pr-3">When</th>
                    <th className="py-2 pr-3">Role</th>
                    <th className="py-2 pr-3">Action</th>
                    <th className="py-2 pr-3">Resource</th>
                    <th className="py-2 pr-3">Details</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l._id} className="border-b border-slate-100 last:border-0 align-top">
                      <td className="py-2 pr-3 whitespace-nowrap text-slate-500">{fmtDate(l.createdAt)}</td>
                      <td className="py-2 pr-3"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">{l.actorRole || "qao"}</span></td>
                      <td className="py-2 pr-3 font-semibold text-violet-700">{l.action}</td>
                      <td className="py-2 pr-3 text-slate-600">{l.resource ? `${l.resource}${l.resourceId ? ` · ${String(l.resourceId).slice(-6)}` : ""}` : "—"}</td>
                      <td className="py-2 pr-3 text-slate-500">{typeof l.details === "object" && l.details ? JSON.stringify(l.details).slice(0, 80) : (l.details || "—")}</td>
                      <td className="py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${l.success === false ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{l.success === false ? "failed" : "ok"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">No audit records found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}