// components/qao/LeaveRequestsModule.jsx
// QAO leave workflow: review pending requests, approve/reject with notes,
// view the impact analysis (affected sessions + suggested substitutes) and
// confirm substitute assignments. Plus full leave history.
import { useCallback, useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { RefreshCw, CalendarOff, ArrowLeftRight, AlertTriangle } from "lucide-react";

const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("qaoToken")}` } });

const statusBadge = (status) => {
  const map = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
    cancelled: "bg-slate-200 text-slate-600",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold sm:text-[11px] ${map[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "-");

export default function LeaveRequestsModule() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [reviewingId, setReviewingId] = useState("");
  const [impact, setImpact] = useState(null); // { leave, impact }
  const [assigning, setAssigning] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/qao/leave-requests${filter ? `?status=${filter}` : ""}`, config());
      setRequests(Array.isArray(res.data?.requests) ? res.data.requests : []);
    } catch (err) {
      console.error("Leave load error:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (request, status) => {
    setReviewingId(request._id);
    try {
      const res = await apiClient.patch(`/qao/leave-requests/${request._id}`, { status, reviewNote: notes[request._id] || "" }, config());
      setImpact({ leave: res.data.leave, impact: res.data.impact });
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to review request.");
    } finally {
      setReviewingId("");
    }
  };

  const assignSubstitute = async (sessionId, teacherId, teacherName) => {
    setAssigning(sessionId);
    try {
      await apiClient.patch(`/qao/sessions/${sessionId}`, { substituteTeacher: teacherId }, config());
      setImpact((prev) => ({
        ...prev,
        impact: {
          ...prev.impact,
          affectedSessions: prev.impact.affectedSessions.filter((s) => s._id !== sessionId),
          affectedCount: Math.max(0, prev.impact.affectedCount - 1),
        },
      }));
      alert(`Substitute assigned: ${teacherName}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign substitute.");
    } finally {
      setAssigning("");
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {["", "pending", "approved", "rejected", "cancelled"].map((s) => (
            <button key={s || "all"} type="button" onClick={() => setFilter(s)} className={`rounded-full px-3 py-1.5 text-[11px] font-semibold sm:text-xs ${filter === s ? "bg-violet-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
              {s || "All"}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={load} className="h-8 rounded-lg px-3 text-[11px] font-semibold sm:text-xs"><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh</Button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">Loading leave requests...</div>
      ) : requests.length ? (
        requests.map((r) => (
          <Card key={r._id} className="border border-slate-200 bg-white shadow-lg sm:shadow-xl">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm text-slate-900 sm:text-base"><CalendarOff className="mr-1.5 inline h-4 w-4 text-amber-600" />{r.teacher?.fullName || "Teacher"}</p>
                  <p className="text-xs text-slate-500 sm:text-sm">{r.leaveType} · {fmtDate(r.startDate)} → {fmtDate(r.endDate)}</p>
                  {r.reason && <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">Reason: {r.reason}</p>}
                  {r.reviewNote && <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">Review note: {r.reviewNote}</p>}
                </div>
                {statusBadge(r.status)}
              </div>
              {r.status === "pending" && (
                <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row">
                  <input value={notes[r._id] || ""} onChange={(e) => setNotes((p) => ({ ...p, [r._id]: e.target.value }))} placeholder="Review note (optional)" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:flex-1 sm:text-sm" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => review(r, "approved")} disabled={reviewingId === r._id} className="h-9 rounded-full bg-emerald-600 px-4 text-[11px] font-semibold text-white hover:bg-emerald-700">Approve</Button>
                    <Button size="sm" onClick={() => review(r, "rejected")} disabled={reviewingId === r._id} className="h-9 rounded-full bg-rose-600 px-4 text-[11px] font-semibold text-white hover:bg-rose-700">Reject</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">No {filter || ""} leave requests.</div>
      )}

      {impact && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={() => setImpact(null)}>
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 sm:text-lg">Leave impact — {impact.leave.teacher?.fullName}</h3>
              <button type="button" onClick={() => setImpact(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">✕</button>
            </div>
            <div className="mb-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 sm:text-sm">
              <AlertTriangle className="mr-1.5 inline h-4 w-4" />
              <b>{impact.impact.affectedCount}</b> session(s) affected · <b>{impact.impact.affectedHours}</b> teaching hours need coverage.
            </div>
            {impact.impact.affectedSessions.length ? (
              impact.impact.affectedSessions.map((s) => (
                <div key={s._id} className="mb-3 rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-bold text-slate-900">{new Date(s.date).toLocaleDateString()} · {s.startTime}-{s.endTime} · {[s.classGroup?.curriculum, s.classGroup?.grade, s.classGroup?.subject].filter(Boolean).join(" ")}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><ArrowLeftRight className="h-3.5 w-3.5" /> Suggested substitutes (confirm to assign):</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(s.suggestedSubstitutes || []).map((sug) => (
                      <button key={sug.teacher._id} type="button" disabled={assigning === s._id} onClick={() => assignSubstitute(s._id, sug.teacher._id, sug.teacher.fullName || sug.teacher.name)} className="rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-100 disabled:opacity-50">
                        {sug.teacher.fullName || sug.teacher.name} · {sug.score}% match
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">All sessions during this leave already have substitutes — nothing to cover.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
