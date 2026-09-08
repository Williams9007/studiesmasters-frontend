// components/qao/SessionModal.jsx
// Create / edit a ClassSession. Includes the substitute-teacher workflow and
// surfaces backend conflict errors (teacher overlap, duplicate, availability).
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import { Button } from "../ui/button";
import { X, Save, AlertTriangle, Trash2, Repeat } from "lucide-react";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 sm:rounded-xl sm:px-3 sm:py-2.5 sm:text-sm";

export default function SessionModal({ open, mode, session, defaults = {}, teachers = [], groups = [], onClose, onSaved }) {
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem("qaoToken")}` } };
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (mode === "edit" && session) {
      setForm({
        classGroupId: session.classGroup?._id || "",
        teacher: session.teacher?._id || "",
        date: (session.date || "").slice(0, 10),
        startTime: session.startTime || "",
        endTime: session.endTime || "",
        meetingLink: session.meetingLink || "",
        status: session.status || "scheduled",
        substituteTeacher: session.substituteTeacher?._id || "",
        notes: session.notes || "",
      });
    } else {
      setForm({
        classGroupId: defaults.classGroupId || "",
        teacher: defaults.teacher || "",
        date: defaults.date || "",
        startTime: defaults.startTime || "",
        endTime: defaults.endTime || "",
        meetingLink: "",
        status: "scheduled",
        substituteTeacher: "",
        notes: "",
      });
    }
  }, [open, mode, session, defaults]);

  // Smart teacher matching: suggestions when a class group is chosen (create)
  useEffect(() => {
    if (!open || mode !== "create" || !form.classGroupId) { setSuggestions([]); return; }
    (async () => {
      try {
        const res = await apiClient.get(`/qao/class-groups/${form.classGroupId}/teacher-suggestions?date=${form.date || ""}&startTime=${form.startTime || ""}&endTime=${form.endTime || ""}`, config);
        setSuggestions(res.data?.suggestions || []);
      } catch { setSuggestions([]); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, form.classGroupId, form.date, form.startTime, form.endTime]);

  // Substitute suggestions when editing an existing session
  useEffect(() => {
    if (!open || mode !== "edit" || !session?._id) { setSuggestions([]); return; }
    (async () => {
      try {
        const res = await apiClient.get(`/qao/sessions/${session._id}/substitute-suggestions`, config);
        setSuggestions(res.data?.suggestions || []);
      } catch { setSuggestions([]); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, session]);

  if (!open) return null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const payload = {
        classGroup: form.classGroupId,
        teacher: form.teacher,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        meetingLink: form.meetingLink,
        status: form.status,
        substituteTeacher: form.substituteTeacher || null,
        notes: form.notes,
      };
      if (mode === "edit" && session?._id) {
        await apiClient.patch(`/qao/sessions/${session._id}`, payload, config);
      } else {
        await apiClient.post("/qao/sessions", payload, config);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save session.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this session?")) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/qao/sessions/${session._id}`, config);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete session.");
    } finally {
      setDeleting(false);
    }
  };

  const original = mode === "edit" ? session?.teacher?.fullName || "-" : "";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 sm:text-lg">{mode === "edit" ? "Edit session" : "Schedule a class"}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>

        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 sm:text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 sm:text-sm">Class Group</label>
            <select value={form.classGroupId || ""} onChange={set("classGroupId")} disabled={mode === "edit"} className={`${inputClass} disabled:bg-slate-100`}>
              <option value="">Select class group</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>{g.code} — {g.curriculum} {g.grade} {g.subject}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 sm:text-sm">Teacher</label>
            <select value={form.teacher || ""} onChange={set("teacher")} className={inputClass}>
              <option value="">Select teacher</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.fullName || t.name}</option>
              ))}
            </select>
          </div>
        {mode !== "edit" && suggestions.length > 0 && (
              <>
                <p className="mt-1.5 text-[11px] font-semibold text-slate-500">Suggested teachers — click to select:</p>
                <div className="mt-1 mb-1 flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button key={s.teacher._id} type="button" onClick={() => setForm((f) => ({ ...f, teacher: s.teacher._id }))} className="rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-100 sm:text-[11px]">
                      {s.teacher.fullName || s.teacher.name} · {s.score}%
                    </button>
                  ))}
                </div>
              </>
            )}
          <div>
            <label className="text-xs font-semibold text-slate-700 sm:text-sm">Date</label>
            <input type="date" value={form.date || ""} onChange={set("date")} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 sm:text-sm">Status</label>
            <select value={form.status || "scheduled"} onChange={set("status")} className={inputClass}>
              {["scheduled", "live", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 sm:text-sm">Start Time</label>
            <input type="time" value={form.startTime || ""} onChange={set("startTime")} className={inputClass} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 sm:text-sm">End Time</label>
            <input type="time" value={form.endTime || ""} onChange={set("endTime")} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 sm:text-sm">Meeting Link</label>
            <input value={form.meetingLink || ""} onChange={set("meetingLink")} placeholder="https://..." className={inputClass} />
          </div>

          {mode === "edit" && (
            <>
              <div className="sm:col-span-2 rounded-xl bg-amber-50 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800 sm:text-sm"><Repeat className="h-4 w-4" /> Substitute teacher (this session only)</p>
                <p className="mt-1 text-[11px] text-amber-700">Original teacher: <span className="font-semibold">{original}</span> — the class group assignment is never changed.</p>
                <select value={form.substituteTeacher || ""} onChange={set("substituteTeacher")} className={`${inputClass} mt-2`}>
                  <option value="">No substitute</option>
                  {teachers.filter((t) => t._id !== form.teacher).map((t) => (
                    <option key={t._id} value={t._id}>{t.fullName || t.name}</option>
                  ))}
                </select>
                {suggestions.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {suggestions.map((s) => (
                      <button key={s.teacher._id} type="button" onClick={() => setForm((f) => ({ ...f, substituteTeacher: s.teacher._id }))} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-50 sm:text-[11px]">
                        {s.teacher.fullName || s.teacher.name} · {s.score}% match
                      </button>
                    ))}
                  </div>
                )}
                <input value={form.notes || ""} onChange={set("notes")} placeholder="Reason (e.g. teacher unavailable)" className={`${inputClass} mt-2`} />
              </div>
              <div className="sm:col-span-2">
                <Button type="button" variant="outline" onClick={remove} disabled={deleting} className="h-9 w-full rounded-full border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 sm:text-sm">
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> {deleting ? "Deleting..." : "Delete session"}
                </Button>
              </div>
            </>
          )}
        </div>

        <Button onClick={save} disabled={saving} className="mt-4 h-10 w-full rounded-full bg-violet-600 text-xs font-semibold text-white hover:bg-violet-700 sm:text-sm">
          <Save className="mr-1.5 h-3.5 w-3.5" /> {saving ? "Saving..." : mode === "edit" ? "Save changes" : "Schedule class"}
        </Button>
      </div>
    </div>
  );
}



