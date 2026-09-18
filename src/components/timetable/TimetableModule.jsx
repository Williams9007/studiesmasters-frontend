// components/timetable/TimetableModule.jsx
//
// Recurring Weekly Timetable screen: MANUALLY feed each class's weekly day/time
// slots, assign a teacher, then "Generate schedule" across a term date range.
// The backend expands the slots into per-date ClassSessions, each with a Google
// Calendar event + Meet link, grouped under its class.
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Plus, Save, CalendarDays, Trash2, Clock3, Link as LinkIcon, CloudUpload } from "lucide-react";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SUBJECTS = ["Maths", "English", "Science"];
const CURRICULUMS = [
  { value: "GES", grades: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", "JHS 1", "JHS 2", "JHS 3", "SHS 1", "SHS 2", "SHS 3"] },
  { value: "Cambridge", grades: ["Stage 4", "Stage 5", "Stage 6", "Stage 7", "Stage 8", "Stage 9", "Stage 10", "Stage 11", "Stage 12", "Stage 13"] },
];

function useConfig(tokenKey) {
  return { headers: { Authorization: `Bearer ${localStorage.getItem(tokenKey)}` } };
}

function friendlyDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toISOString ? d.toISOString().slice(0, 10) : String(iso).slice(0, 10);
  } catch {
    return String(iso).slice(0, 10);
  }
}


const meetingBadge = (status) => {
  const cls =
    status === "ready" ? "bg-emerald-100 text-emerald-700"
      : status === "pending" ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-600";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{status || "pending"}</span>;
};

export default function TimetableModule({
  tokenKey = "qaoToken",
  apiPrefix = "/qao",
  teacherEndpoint = "/qao/teachers/all",
  classGroupsEndpoint = null,   // optional: merge previously created class groups
  moodleSyncEndpoint = null,    // optional: bulk push sessions to Moodle calendar
} = {}) {
  const config = useConfig(tokenKey);
  const [timetable, setTimetable] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [notice, setNotice] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newClass, setNewClass] = useState({
    code: "", curriculum: "", grade: "", subject: "Maths", capacity: "5", teacher: "",
    slots: [{ day: "", startTime: "", endTime: "" }],
  });

  const [ranges, setRanges] = useState({});      // classGroupId -> { start, end }
  const [genBusy, setGenBusy] = useState("");    // classGroupId currently generating
  const [genResult, setGenResult] = useState({}); // classGroupId -> summary
  const [slotEditors, setSlotEditors] = useState({});  // id -> [{day,startTime,endTime}]
  const [teacherEdits, setTeacherEdits] = useState({}); // id -> teacherId
  const [moodleBusy, setMoodleBusy] = useState("");    // "all" | classGroupId
  const [moodleResult, setMoodleResult] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [t, tc] = await Promise.all([
        apiClient.get(`${apiPrefix}/timetable`, config),
        apiClient.get(teacherEndpoint, config),
      ]);
      let list = Array.isArray(t.data?.timetable) ? t.data.timetable : [];

      // Pull previously created class groups into the section so every existing
      // class (even without weekly slots yet) is manageable here.
      if (classGroupsEndpoint) {
        try {
          const cg = await apiClient.get(classGroupsEndpoint, config);
          const known = new Set(list.map((g) => String(g._id)));
          const legacy = (cg.data?.groups || [])
            .filter((g) => !known.has(String(g._id)))
            .map((g) => ({
              _id: g._id,
              code: g.code,
              subject: g.subject,
              grade: g.grade,
              curriculum: g.curriculum,
              capacity: g.capacity,
              studentCount:
                g.studentCount ?? (Array.isArray(g.students) ? g.students.length : 0),
              teacher: g.teacher && typeof g.teacher === "object" ? g.teacher : null,
              weeklySlots: g.weeklySlots || [],
              effectiveSlots: g.weeklySlots?.length
                ? g.weeklySlots
                : g.schedule?.day
                  ? [g.schedule]
                  : [],
              sessions: [],
            }));
          list = [...list, ...legacy];
        } catch (err) {
          console.warn("Class groups merge skipped:", err?.message || err);
        }
      }

      setTimetable(list);
      setTeachers(Array.isArray(tc.data?.teachers) ? tc.data.teachers : []);
      setError("");
    } catch (err) {
      console.error("Timetable load error:", err);
      setError("Failed to load the timetable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 6000);
  };

  const createClass = async () => {
    const payload = {
      code: newClass.code,
      curriculum: newClass.curriculum,
      grade: newClass.grade,
      subject: newClass.subject,
      capacity: Number(newClass.capacity),
      teacher: newClass.teacher || null,
      weeklySlots: newClass.slots.filter((s) => s.day && s.startTime && s.endTime),
    };
    try {
      await apiClient.post(`${apiPrefix}/class-groups`, payload, config);
      setNewClass({ ...newClass, code: "", grade: "", teacher: "", slots: [{ day: "", startTime: "", endTime: "" }] });
      setShowCreate(false);
      flash("Class created.");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create class.");
    }
  };

  const beginEdit = (id, slots, teacherId) => {
    setSlotEditors((p) => ({ ...p, [id]: (slots && slots.length ? slots : [{}]).map((s) => ({ day: s.day || "", startTime: s.startTime || "", endTime: s.endTime || "" })) }));
    setTeacherEdits((p) => ({ ...p, [id]: teacherId || "" }));
  };

  const saveSlots = async (id) => {
    setSavingId(id);
    try {
      await apiClient.patch(`${apiPrefix}/timetable/${id}/slots`, {
        slots: (slotEditors[id] || []).filter((s) => s.day && s.startTime && s.endTime),
        teacher: teacherEdits[id] || null,
      }, config);
      setSlotEditors((p) => { const n = { ...p }; delete n[id]; return n; });
      flash("Timetable saved.");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save timetable.");
    } finally {
      setSavingId("");
    }
  };

  const generate = async (id) => {
    const r = ranges[id] || {};
    if (!r.start || !r.end) { alert("Pick a start and end date for the term range first."); return; }
    setGenBusy(id);
    try {
      const res = await apiClient.post(`${apiPrefix}/timetable/${id}/generate`, { startDate: r.start, endDate: r.end }, config);
      setGenResult((p) => ({ ...p, [id]: res.data }));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate the schedule.");
    } finally {
      setGenBusy("");
    }
  };

  // Push this class's (or every class's) scheduled sessions to Moodle's calendar.
  const syncMoodle = async (classGroupId = null) => {
    if (!moodleSyncEndpoint) return;
    setMoodleBusy(classGroupId || "all");
    try {
      const res = await apiClient.post(moodleSyncEndpoint, classGroupId ? { classGroupId } : {}, config);
      setMoodleResult({ ...(res.data || {}), scope: classGroupId ? "class" : "all" });
      flash(`Moodle calendar sync — pushed ${res.data?.synced ?? 0}, ${res.data?.queued ?? 0} queued for retry.`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to sync to Moodle.");
    } finally {
      setMoodleBusy("");
    }
  };

  const setSlotField = (id, i, field, value) =>
    setSlotEditors((p) => ({ ...p, [id]: (p[id] || []).map((r, idx) => (idx === i ? { ...r, [field]: value } : r)) }));
  const addSlotRow = (id) => setSlotEditors((p) => ({ ...p, [id]: [...(p[id] || []), { day: "", startTime: "", endTime: "" }] }));
  const removeSlotRow = (id, i) => setSlotEditors((p) => ({ ...p, [id]: (p[id] || []).filter((__, idx) => idx !== i) }));
  const setNewSlotField = (i, field, value) =>
    setNewClass((c) => ({ ...c, slots: c.slots.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)) }));
  const setRange = (id, field, value) => setRanges((p) => ({ ...p, [id]: { ...(p[id] || {}), [field]: value } }));
const renderClassCard = (g) => {
    const editing = Boolean(slotEditors[g._id]);
    const slots = editing ? (slotEditors[g._id] || []) : (g.effectiveSlots && g.effectiveSlots.length ? g.effectiveSlots : []);
    const teacherVal = teacherEdits[g._id] !== undefined ? teacherEdits[g._id] : (g.teacher?._id || "");
    const result = genResult[g._id];
    const busy = genBusy === g._id;
    const r = ranges[g._id] || {};

    return (
      <Card key={g._id} className="border border-slate-200 bg-white shadow-lg sm:shadow-xl">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base text-slate-900 sm:text-lg">
                {g.code} <span className="font-normal text-slate-400">·</span> {g.subject} · {g.grade}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {g.curriculum} · Capacity {g.capacity} · {g.studentCount} student{g.studentCount === 1 ? "" : "s"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={teacherVal}
                onChange={(e) => setTeacherEdits((p) => ({ ...p, [g._id]: e.target.value }))}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                title="Assigned teacher"
              >
                <option value="">No teacher</option>
                {teachers.map((t) => <option key={t._id} value={t._id}>{t.fullName || t.name}</option>)}
              </select>
              {!editing ? (
                <Button size="sm" variant="outline" onClick={() => beginEdit(g._id, slots, teacherVal)} className="text-[11px]">
                  <Clock3 className="mr-1 h-3 w-3" /> Edit timetable
                </Button>
              ) : (
                <Button size="sm" onClick={() => saveSlots(g._id)} disabled={savingId === g._id} className="rounded-full bg-violet-600 text-[11px] text-white">
                  <Save className="mr-1 h-3 w-3" /> {savingId === g._id ? "Saving…" : "Save"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Weekly slots */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Weekly timetable slots</p>
            {slots.length === 0 ? (
              <p className="mt-1 text-xs text-slate-400">No slots yet — click “Edit timetable”.</p>
            ) : (
              <div className="mt-1.5 space-y-1.5">
                {slots.map((s, i) =>
                  editing ? (
                    <div key={i} className="grid grid-cols-1 gap-1.5 sm:grid-cols-[1fr_auto_auto_auto]">
                      <select value={s.day} onChange={(e) => setSlotField(g._id, i, "day", e.target.value)} className={inputClass}>
                        <option value="">Day…</option>
                        {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <input type="time" value={s.startTime} onChange={(e) => setSlotField(g._id, i, "startTime", e.target.value)} className={inputClass} />
                      <input type="time" value={s.endTime} onChange={(e) => setSlotField(g._id, i, "endTime", e.target.value)} className={inputClass} />
                      <Button size="sm" variant="ghost" onClick={() => removeSlotRow(g._id, i)}><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button>
                    </div>
                  ) : (
                    <div key={i} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                      {s.day} · {s.startTime}–{s.endTime}
                    </div>
                  )
                )}
                {editing && (
                  <Button size="sm" variant="outline" onClick={() => addSlotRow(g._id)} className="text-[11px] text-violet-700">
                    <Plus className="mr-1 h-3 w-3" /> Add slot
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Generate term schedule */}
          <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-violet-700">
              <CalendarDays className="h-3.5 w-3.5" /> Generate schedule for the term
            </p>
            <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-[1fr_1fr_auto_auto]">
              <input type="date" value={r.start || ""} onChange={(e) => setRange(g._id, "start", e.target.value)} className={inputClass} />
              <input type="date" value={r.end || ""} onChange={(e) => setRange(g._id, "end", e.target.value)} className={inputClass} />
              <Button size="sm" onClick={() => generate(g._id)} disabled={busy} className="rounded-full bg-violet-600 text-[11px] text-white">
                {busy ? "Generating…" : "Generate schedule"}
              </Button>
              {moodleSyncEndpoint && (
                <Button size="sm" variant="outline" onClick={() => syncMoodle(g._id)} disabled={moodleBusy === g._id} className="rounded-full text-[11px]">
                  <CloudUpload className="mr-1 h-3 w-3" /> {moodleBusy === g._id ? "Syncing…" : "Sync to Moodle"}
                </Button>
              )}
            </div>
            {result && (
              <p className="mt-2 text-xs font-medium text-violet-800">
                Created {result.created} session(s) · {result.existing} already existed · {result.failed ? `${result.failed.length} failed` : "all linked to Google Calendar + Meet"}
              </p>
            )}
          </div>
          {/* Grouped sessions for this class */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Scheduled classes ({g.sessions?.length || 0})</p>
            {!g.sessions || g.sessions.length === 0 ? (
              <p className="mt-1 text-xs text-slate-400">Nothing scheduled yet — pick the term dates above and generate.</p>
            ) : (
              <div className="mt-1.5 overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Date</th>
                      <th className="px-3 py-2 font-semibold">Time</th>
                      <th className="px-3 py-2 font-semibold">Teacher</th>
                      <th className="px-3 py-2 font-semibold">Meet</th>
                      <th className="px-3 py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.sessions.map((s) => (
                      <tr key={s._id} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-700">{friendlyDate(s.date)}</td>
                        <td className="px-3 py-2 text-slate-700">{s.startTime}–{s.endTime}</td>
                        <td className="px-3 py-2 text-slate-700">{s.teacher?.fullName || s.substituteTeacher?.fullName || "—"}</td>
                        <td className="px-3 py-2">
                          {s.meetingLink ? (
                            <a href={s.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-violet-700 hover:underline">
                              <LinkIcon className="h-3.5 w-3.5" /> Join
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          <span className="ml-1.5">{meetingBadge(s.meetingStatus)}</span>
                        </td>
                        <td className="px-3 py-2 capitalize text-slate-600">{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

return (
    <div className="space-y-4 sm:space-y-5">
      {notice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">{notice}</div>
      )}

      {/* Header + Add class */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm">
          {timetable.length} classes · feed each class's weekly timetable, assign a teacher, then generate the term schedule
        </p>
        <div className="flex items-center gap-2">
          {moodleSyncEndpoint && (
            <Button size="sm" variant="outline" onClick={() => syncMoodle(null)} disabled={moodleBusy === "all"} className="h-8 rounded-full px-3 text-[11px] font-semibold sm:text-xs">
              <CloudUpload className="mr-1 h-3 w-3" /> {moodleBusy === "all" ? "Syncing…" : "Sync all to Moodle"}
            </Button>
          )}
          <Button size="sm" onClick={() => setShowCreate((v) => !v)} className="h-8 rounded-full bg-violet-600 px-3 text-[11px] font-semibold text-white hover:bg-violet-700 sm:text-xs">
            <Plus className="mr-1 h-3 w-3" /> {showCreate ? "Close" : "Add class"}
          </Button>
        </div>
      </div>

      {moodleResult && (
        <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-medium text-sky-800">
          Moodle calendar sync ({moodleResult.scope === "class" ? "this class" : "all classes"}) — pushed {moodleResult.synced ?? 0} · queued {moodleResult.queued ?? 0} · failed {moodleResult.failed ?? 0} of {moodleResult.total ?? 0} scheduled session(s).
        </p>
      )}

      {showCreate && (
        <Card className="border border-violet-200 bg-white shadow-lg sm:shadow-xl">
          <CardHeader><CardTitle className="text-base text-slate-900 sm:text-lg">Add a class</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <input value={newClass.code} onChange={(e) => setNewClass({ ...newClass, code: e.target.value })} placeholder="Code (e.g. G-48210)" className={inputClass} />
            <select value={newClass.curriculum} onChange={(e) => setNewClass({ ...newClass, curriculum: e.target.value, grade: "" })} className={inputClass}>
              <option value="">Curriculum</option>
              {CURRICULUMS.map((c) => <option key={c.value} value={c.value}>{c.value}</option>)}
            </select>
            <select value={newClass.grade} onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })} className={inputClass} disabled={!newClass.curriculum}>
              <option value="">{newClass.curriculum ? "Grade" : "Select curriculum first"}</option>
              {(CURRICULUMS.find((c) => c.value === newClass.curriculum)?.grades || []).map((gr) => <option key={gr} value={gr}>{gr}</option>)}
            </select>
            <select value={newClass.subject} onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })} className={inputClass}>
              {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={newClass.capacity} onChange={(e) => setNewClass({ ...newClass, capacity: e.target.value })} className={inputClass}>
              {[1, 5, 10].map((c) => <option key={c} value={c}>Capacity: {c}</option>)}
            </select>
            <select value={newClass.teacher} onChange={(e) => setNewClass({ ...newClass, teacher: e.target.value })} className={inputClass}>
              <option value="">Assign teacher</option>
              {teachers.map((t) => <option key={t._id} value={t._id}>{t.fullName || t.name}</option>)}
            </select>
            <div className="sm:col-span-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"><Clock3 className="h-3.5 w-3.5" /> Weekly timetable (add several day/time slots)</p>
              {newClass.slots.map((s, i) => (
                <div key={i} className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-[1fr_auto_auto_auto]">
                  <select value={s.day} onChange={(e) => setNewSlotField(i, "day", e.target.value)} className={inputClass}>
                    <option value="">Day…</option>
                    {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input type="time" value={s.startTime} onChange={(e) => setNewSlotField(i, "startTime", e.target.value)} className={inputClass} />
                  <input type="time" value={s.endTime} onChange={(e) => setNewSlotField(i, "endTime", e.target.value)} className={inputClass} />
                  <Button size="sm" variant="ghost" onClick={() => setNewClass((c) => ({ ...c, slots: c.slots.filter((__, idx) => idx !== i) }))}>
                    <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                  </Button>
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={() => setNewClass((c) => ({ ...c, slots: [...c.slots, { day: "", startTime: "", endTime: "" }] }))} className="mt-2 text-[11px] text-violet-700">
                <Plus className="mr-1 h-3 w-3" /> Add slot
              </Button>
            </div>
            <Button onClick={createClass} className="h-10 rounded-full bg-violet-600 text-xs font-semibold text-white hover:bg-violet-700 sm:col-span-3">Create class</Button>
          </CardContent>
        </Card>
      )}

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-600">{error}</div>
      ) : timetable.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No classes yet. Add a class to start building the timetable.
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5">
          {timetable.map((g) => renderClassCard(g))}
        </div>
      )}
    </div>
  );
}
