// components/qao/TeacherAvailability.jsx
// Weekly availability editor for one teacher: add / edit / delete slots,
// plus copy a day schedule to another day. Backend validates time ranges
// and overlap; errors surface inline.
import { useCallback, useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import { Button } from "../ui/button";
import { X, Plus, Trash2, Copy, Save } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const inputClass = "rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs sm:text-sm";

export default function TeacherAvailability({ teacherId, teacherName, onClose, onChanged }) {
  const config = { headers: { Authorization: `Bearer ${localStorage.getItem("qaoToken")}` } };
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newSlot, setNewSlot] = useState({ day: "Monday", start: "08:00", end: "15:00" });
  const [editingId, setEditingId] = useState("");
  const [edit, setEdit] = useState({});
  const [copyFrom, setCopyFrom] = useState("");
  const [copyTo, setCopyTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/qao/teachers/${teacherId}/availability`, config);
      setSlots(res.data?.availability?.availability || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load availability.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId]);

  useEffect(() => {
    if (teacherId) load();
  }, [teacherId, load]);

  const add = async () => {
    try {
      await apiClient.post(`/qao/teachers/${teacherId}/availability`, newSlot, config);
      setNewSlot({ day: newSlot.day, start: "08:00", end: "15:00" });
      load();
      onChanged && onChanged();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add slot.");
    }
  };

  const saveSlot = async (slotId) => {
    try {
      await apiClient.patch(`/qao/teachers/${teacherId}/availability/${slotId}`, edit, config);
      setEditingId("");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update slot.");
    }
  };

  const remove = async (slotId) => {
    try {
      await apiClient.delete(`/qao/teachers/${teacherId}/availability/${slotId}`, config);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete slot.");
    }
  };

  const copyDay = async () => {
    if (!copyFrom || !copyTo || copyFrom === copyTo) return;
    const source = slots.filter((s) => s.day === copyFrom);
    if (!source.length) return setError(`No slots on ${copyFrom} to copy.`);
    try {
      for (const s of source) {
        await apiClient.post(`/qao/teachers/${teacherId}/availability`, { day: copyTo, start: s.start, end: s.end }, config);
      }
      setError("");
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Copy failed (slots may overlap).", );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 sm:text-lg">Weekly availability</h3>
            <p className="text-xs text-slate-500">{teacherName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>

        {error && <p className="mb-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 sm:text-sm">{error}</p>}

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading...</p>
        ) : (
          <>
            <div className="space-y-2">
              {DAYS.map((day) => {
                const daySlots = slots.filter((s) => s.day === day);
                if (!daySlots.length) return null;
                return (
                  <div key={day} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{day}</p>
                    <div className="mt-1.5 space-y-1.5">
                      {daySlots.map((slot) => (
                        <div key={slot._id} className="flex flex-wrap items-center gap-2">
                          {editingId === slot._id ? (
                            <>
                              <input type="time" value={edit.start ?? slot.start} onChange={(e) => setEdit((p) => ({ ...p, start: e.target.value }))} className={inputClass} />
                              <input type="time" value={edit.end ?? slot.end} onChange={(e) => setEdit((p) => ({ ...p, end: e.target.value }))} className={inputClass} />
                              <select value={edit.day ?? slot.day} onChange={(e) => setEdit((p) => ({ ...p, day: e.target.value }))} className={inputClass}>
                                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                              </select>
                              <Button size="sm" onClick={() => saveSlot(slot._id)} className="h-7 rounded-full bg-violet-600 px-2.5 text-[10px] font-semibold text-white hover:bg-violet-700"><Save className="h-3 w-3" /></Button>
                            </>
                          ) : (
                            <>
                              <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 ring-1 ring-slate-200">{slot.start} - {slot.end}</span>
                              <button type="button" onClick={() => { setEditingId(slot._id); setEdit({ day: slot.day, start: slot.start, end: slot.end }); }} className="text-[11px] font-semibold text-violet-600 hover:underline">Edit</button>
                              <button type="button" onClick={() => remove(slot._id)} className="text-[11px] font-semibold text-rose-600 hover:underline"><Trash2 className="inline h-3 w-3" /> Delete</button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {!slots.length && <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500">No availability configured — the teacher is treated as unrestricted for scheduling.</div>}
            </div>

            <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 p-3">
              <p className="text-xs font-bold text-violet-800">Add slot</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select value={newSlot.day} onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })} className={inputClass}>
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <input type="time" value={newSlot.start} onChange={(e) => setNewSlot({ ...newSlot, start: e.target.value })} className={inputClass} />
                <input type="time" value={newSlot.end} onChange={(e) => setNewSlot({ ...newSlot, end: e.target.value })} className={inputClass} />
                <Button size="sm" onClick={add} className="h-8 rounded-full bg-violet-600 px-3 text-[11px] font-semibold text-white hover:bg-violet-700"><Plus className="mr-1 h-3 w-3" /> Add</Button>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold text-slate-600"><Copy className="mr-1 inline h-3.5 w-3.5" /> Copy weekly schedule</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)} className={inputClass}>
                  <option value="">Copy from...</option>
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={copyTo} onChange={(e) => setCopyTo(e.target.value)} className={inputClass}>
                  <option value="">To...</option>
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <Button size="sm" variant="outline" onClick={copyDay} className="h-8 rounded-full px-3 text-[11px] font-semibold">Copy</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
