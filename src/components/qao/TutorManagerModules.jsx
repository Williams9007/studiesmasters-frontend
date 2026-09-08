// components/qao/TutorManagerModules.jsx
//
// Tutor Manager (QAO) dashboard modules. Mounted inside the existing
// qao-dashboard.jsx tab shell. All data comes from QAO-safe endpoints under
// /api/qao/* that strip student information server-side (studentCount only).
import { useCallback, useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import { Search, Save, Plus, Users, CalendarDays, RefreshCw } from "lucide-react";
import TeacherAvailability from "./TeacherAvailability.jsx";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm";

const CURRICULUMS = [
  {
    value: "GES",
    grades: ["Primary 1", "Primary 2", "Primary 3", "Primary 4", "Primary 5", "Primary 6", "JHS 1", "JHS 2", "JHS 3", "SHS 1", "SHS 2", "SHS 3"],
  },
  {
    value: "Cambridge",
    grades: ["Stage 4", "Stage 5", "Stage 6", "Stage 7", "Stage 8", "Stage 9", "Stage 10", "Stage 11", "Stage 12", "Stage 13"],
  },
];

function useQaoConfig() {
  const token = localStorage.getItem("qaoToken");
  return { headers: { Authorization: `Bearer ${token}` } };
}

const statusBadge = (status) => {
  const map = {
    active: "bg-emerald-100 text-emerald-700",
    on_leave: "bg-amber-100 text-amber-700",
    suspended: "bg-rose-100 text-rose-700",
    former: "bg-slate-200 text-slate-600",
    full: "bg-amber-100 text-amber-700",
    closed: "bg-slate-200 text-slate-600",
    Pending: "bg-amber-100 text-amber-700",
    Approved: "bg-emerald-100 text-emerald-700",
    Flagged: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold sm:px-2.5 sm:py-1 sm:text-[11px] ${map[status] || "bg-slate-100 text-slate-600"}`}>
      {String(status || "unknown").replace("_", " ")}
    </span>
  );
};

/* ============================ Teachers module ============================ */

export function TeachersModule() {
  const config = useQaoConfig();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState({}); // id -> { internalNotes, employmentStatus, qualifications }
  const [savingId, setSavingId] = useState("");
  const [availabilityTeacher, setAvailabilityTeacher] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/qao/teachers/all", config);
      setTeachers(Array.isArray(res.data?.teachers) ? res.data.teachers : []);
      setError("");
    } catch (err) {
      console.error("Teachers load error:", err);
      setError("Failed to load teachers.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = (t) =>
    setEditing((prev) => ({
      ...prev,
      [t._id]: {
        internalNotes: t.internalNotes || "",
        employmentStatus: t.employmentStatus || "active",
        qualifications: t.qualifications || "",
      },
    }));

  const saveTeacher = async (id) => {
    setSavingId(id);
    try {
      const res = await apiClient.patch(`/qao/teachers/${id}`, editing[id], config);
      setTeachers((prev) => prev.map((t) => (t._id === id ? res.data.teacher : t)));
      setEditing((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update teacher.");
    } finally {
      setSavingId("");
    }
  };

  if (loading) return <DashboardEmpty text="Loading teachers..." />;
  if (error) return <DashboardEmpty text={error} />;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm">{teachers.length} teachers</p>
        <Button variant="outline" size="sm" onClick={load} className="h-8 rounded-lg px-3 text-[11px] font-semibold sm:text-xs">
          <RefreshCw className="mr-1.5 h-3 w-3" /> Refresh
        </Button>
      </div>
      {availabilityTeacher && (
        <TeacherAvailability teacherId={availabilityTeacher._id} teacherName={availabilityTeacher.fullName || availabilityTeacher.name} onClose={() => setAvailabilityTeacher(null)} onChanged={load} />
      )}

      {teachers.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {teachers.map((t) => (
            <div key={t._id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-[1.5rem] sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold text-sm text-slate-900 sm:text-base">{t.fullName || t.name || "No name"}</p>
                  <p className="truncate text-xs text-slate-500">{t.email}</p>
                  <p className="text-[11px] text-slate-500">{t.phone || "No phone"} · {t.employeeRole || "tutor"}</p>
                </div>
                {statusBadge(t.employmentStatus)}
              </div>
              <div className="mt-2 space-y-1 text-[11px] text-slate-600 sm:text-xs">
                <p><span className="font-semibold">Subjects:</span> {(t.subjectsTeaching || []).map((s) => s.name).join(", ") || "N/A"}</p>
                <p><span className="font-semibold">Grades:</span> {[...new Set((t.subjectsTeaching || []).map((s) => s.grade).filter(Boolean))].join(", ") || "N/A"}</p>
                <p><span className="font-semibold">Curriculum:</span> {t.curriculum || "N/A"}</p>
                <p><span className="font-semibold">Experience:</span> {t.experience || "N/A"}</p>
                <p><span className="font-semibold">Qualifications:</span> {t.qualifications || "N/A"}</p>
              </div>
              {editing[t._id] ? (
                <div className="mt-2 space-y-2 border-t border-slate-100 pt-2">
                  <select value={editing[t._id].employmentStatus} onChange={(e) => setEditing((p) => ({ ...p, [t._id]: { ...p[t._id], employmentStatus: e.target.value } }))} className={inputClass}>
                    {["active", "on_leave", "suspended", "former"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                  <input value={editing[t._id].qualifications} placeholder="Qualifications" onChange={(e) => setEditing((p) => ({ ...p, [t._id]: { ...p[t._id], qualifications: e.target.value } }))} className={inputClass} />
                  <textarea rows={2} value={editing[t._id].internalNotes} placeholder="Internal notes (private)" onChange={(e) => setEditing((p) => ({ ...p, [t._id]: { ...p[t._id], internalNotes: e.target.value } }))} className={inputClass} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveTeacher(t._id)} disabled={savingId === t._id} className="h-8 flex-1 rounded-full bg-violet-600 text-[11px] font-semibold text-white hover:bg-violet-700">
                      <Save className="mr-1 h-3 w-3" /> {savingId === t._id ? "Saving..." : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing((p) => { const n = { ...p }; delete n[t._id]; return n; })} className="h-8 rounded-full px-3 text-[11px]">Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="mt-2 border-t border-slate-100 pt-2">
                  {t.internalNotes && <p className="mb-1.5 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800"><span className="font-semibold">Notes:</span> {t.internalNotes}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(t)} className="h-8 flex-1 rounded-full text-[11px] font-semibold">Manage teacher</Button>
                    <Button size="sm" onClick={() => setAvailabilityTeacher(t)} className="h-8 rounded-full bg-violet-600 px-3 text-[11px] font-semibold text-white hover:bg-violet-700">Availability</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <DashboardEmpty text="No teachers found." />
      )}
    </div>
  );
}

/* ========================== Class Groups module ========================== */

const EMPTY_FORM = { code: "", curriculum: "", grade: "", subject: "Maths", capacity: "5", teacher: "", day: "", startTime: "", endTime: "", meetingLink: "" };

export function ClassGroupsModule() {
  const config = useQaoConfig();
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [edit, setEdit] = useState({ teacher: "", day: "", startTime: "", endTime: "", meetingLink: "", status: "active" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, t] = await Promise.all([
        apiClient.get("/qao/class-groups/all", config),
        apiClient.get("/qao/teachers/all", config),
      ]);
      setGroups(Array.isArray(g.data?.groups) ? g.data.groups : []);
      setTeachers(Array.isArray(t.data?.teachers) ? t.data.teachers : []);
      setError("");
    } catch (err) {
      console.error("Groups load error:", err);
      setError("Failed to load class groups.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createGroup = async () => {
    try {
      await apiClient.post("/qao/class-groups", {
        code: form.code,
        curriculum: form.curriculum,
        grade: form.grade,
        subject: form.subject,
        capacity: Number(form.capacity),
        teacher: form.teacher || null,
        schedule: { day: form.day, startTime: form.startTime, endTime: form.endTime },
        meetingLink: form.meetingLink,
      }, config);
      setForm(EMPTY_FORM);
      setShowCreate(false);
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create class group.");
    }
  };

  const saveGroup = async (id) => {
    try {
      await apiClient.patch(`/qao/class-groups/${id}`, {
        teacher: edit.teacher || null,
        schedule: { day: edit.day, startTime: edit.startTime, endTime: edit.endTime },
        meetingLink: edit.meetingLink,
        status: edit.status,
      }, config);
      setEditingId("");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update class group.");
    }
  };

  if (loading) return <DashboardEmpty text="Loading class groups..." />;
  if (error) return <DashboardEmpty text={error} />;

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm">{groups.length} class groups</p>
        <Button size="sm" onClick={() => setShowCreate((v) => !v)} className="h-8 rounded-full bg-violet-600 px-3 text-[11px] font-semibold text-white hover:bg-violet-700 sm:text-xs">
          <Plus className="mr-1 h-3 w-3" /> {showCreate ? "Close" : "Create group"}
        </Button>
      </div>

      {showCreate && (
        <Card className="border border-violet-200 bg-white shadow-lg sm:shadow-xl">
          <CardHeader><CardTitle className="text-base text-slate-900 sm:text-lg">New class group</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Code (e.g. G-48210)" className={inputClass} />
            <select value={form.curriculum} onChange={(e) => setForm({ ...form, curriculum: e.target.value, grade: "" })} className={inputClass}>
              <option value="">Select curriculum</option>
              {CURRICULUMS.map((cv) => <option key={cv.value} value={cv.value}>{cv.value}</option>)}
            </select>
            <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className={inputClass} disabled={!form.curriculum}>
              <option value="">{form.curriculum ? "Select grade" : "Select curriculum first"}</option>
              {(CURRICULUMS.find((cv) => cv.value === form.curriculum)?.grades || []).map((gr) => <option key={gr} value={gr}>{gr}</option>)}
            </select>
            <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputClass}>
              {["Maths", "English", "Science"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className={inputClass}>
              {[1, 5, 10].map((c) => <option key={c} value={c}>Capacity: {c}</option>)}
            </select>
            <select value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} className={inputClass}>
              <option value="">Assign teacher later</option>
              {teachers.map((t) => <option key={t._id} value={t._id}>{t.fullName || t.name}</option>)}
            </select>
            <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className={inputClass}>
              <option value="">Day...</option>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className={inputClass} />
            <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className={inputClass} />
            <input value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} placeholder="Meeting link (optional)" className={`${inputClass} sm:col-span-3`} />
            <Button onClick={createGroup} className="h-10 rounded-full bg-violet-600 text-xs font-semibold text-white hover:bg-violet-700 sm:col-span-3">Create class group</Button>
          </CardContent>
        </Card>
      )}

      {groups.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {groups.map((g) => (
            <div key={g._id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-[1.5rem] sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-bold text-sm text-slate-900 sm:text-base"><Users className="mr-1.5 inline h-4 w-4 text-violet-600" />{g.code}</p>
                  <p className="text-[11px] text-slate-500 sm:text-xs">{g.curriculum} · Grade {g.grade} · {g.subject}</p>
                </div>
                {statusBadge(g.status)}
              </div>
              <div className="mt-2 space-y-0.5 text-[11px] text-slate-600 sm:text-xs">
                <p><span className="font-semibold">Members:</span> {g.studentCount} / {g.capacity}</p>
                <p><span className="font-semibold">Teacher:</span> {g.teacher?.fullName || "Unassigned"}</p>
                <p><span className="font-semibold">Schedule:</span> {g.schedule?.day ? `${g.schedule.day} ${g.schedule.startTime}-${g.schedule.endTime}` : "Not set"}</p>
                {g.meetingLink && <p className="truncate"><span className="font-semibold">Link:</span> <a href={g.meetingLink} target="_blank" rel="noreferrer" className="text-violet-600 underline">Open class</a></p>}
              </div>
              {editingId === g._id ? (
                <div className="mt-2 space-y-2 border-t border-slate-100 pt-2">
                  <select value={edit.teacher} onChange={(e) => setEdit({ ...edit, teacher: e.target.value })} className={inputClass}>
                    <option value="">Unassigned</option>
                    {teachers.map((t) => <option key={t._id} value={t._id}>{t.fullName || t.name}</option>)}
                  </select>
                  <div className="grid grid-cols-3 gap-2">
                    <select value={edit.day} onChange={(e) => setEdit({ ...edit, day: e.target.value })} className={inputClass}>
                      <option value="">Day...</option>
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input type="time" value={edit.startTime} onChange={(e) => setEdit({ ...edit, startTime: e.target.value })} className={inputClass} />
                    <input type="time" value={edit.endTime} onChange={(e) => setEdit({ ...edit, endTime: e.target.value })} className={inputClass} />
                  </div>
                  <input value={edit.meetingLink} onChange={(e) => setEdit({ ...edit, meetingLink: e.target.value })} placeholder="Meeting link" className={inputClass} />
                  <select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} className={inputClass}>
                    {["active", "full", "closed"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveGroup(g._id)} className="h-8 flex-1 rounded-full bg-violet-600 text-[11px] font-semibold text-white hover:bg-violet-700">Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId("")} className="h-8 rounded-full px-3 text-[11px]">Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => { setEditingId(g._id); setEdit({ teacher: g.teacher?._id || "", day: g.schedule?.day || "", startTime: g.schedule?.startTime || "", endTime: g.schedule?.endTime || "", meetingLink: g.meetingLink || "", status: g.status || "active" }); }} className="mt-2 h-8 w-full rounded-full border-t border-slate-100 pt-0 text-[11px] font-semibold">
                  <CalendarDays className="mr-1.5 h-3 w-3" /> Edit group / assign teacher
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <DashboardEmpty text="No class groups yet." />
      )}
    </div>
  );
}

/* ======================= Timetable approvals module ====================== */

export function TimetableApprovalsModule() {
  const config = useQaoConfig();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/qao/timetables", config);
      setItems(Array.isArray(res.data?.timetables) ? res.data.timetables : []);
    } catch (err) {
      console.error("Timetables load error:", err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (id, status) => {
    try {
      const res = await apiClient.patch(`/qao/timetables/${id}`, { status, feedback: feedback[id] || "" }, config);
      setItems((prev) => prev.map((t) => (t._id === id ? res.data.timetable : t)));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to review timetable.");
    }
  };

  if (loading) return <DashboardEmpty text="Loading timetable submissions..." />;

  return (
    <Card className="border border-slate-200 bg-white shadow-lg sm:shadow-2xl">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900 sm:text-xl">Timetable Approvals</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Teacher-uploaded timetables awaiting your review.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        {items.length ? (
          items.map((t) => (
            <div key={t._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 sm:rounded-[1.5rem] sm:p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-slate-900 sm:text-base">{t.subjectId?.name || "Timetable"}</p>
                  <p className="text-xs text-slate-500">By {t.teacherId?.fullName || "Unknown"} · {t.classLevel || ""}</p>
                  {t.feedback && <p className="text-[11px] text-slate-500">Feedback: {t.feedback}</p>}
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  {statusBadge(t.status)}
                  {t.fileUrl && <a href={t.fileUrl} target="_blank" rel="noreferrer" className="text-[11px] font-semibold text-violet-600 underline">View file</a>}
                </div>
              </div>
              {t.status !== "Approved" && (
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input value={feedback[t._id] || ""} onChange={(e) => setFeedback((p) => ({ ...p, [t._id]: e.target.value }))} placeholder="Feedback (optional)" className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs sm:flex-1 sm:rounded-lg sm:px-3 sm:text-sm" />
                  <div className="flex gap-1.5 sm:gap-2">
                    <Button size="sm" onClick={() => review(t._id, "Approved")} className="h-8 rounded-full bg-emerald-600 px-3 text-[11px] font-semibold text-white hover:bg-emerald-700">Approve</Button>
                    <Button size="sm" onClick={() => review(t._id, "Flagged")} className="h-8 rounded-full bg-rose-600 px-3 text-[11px] font-semibold text-white hover:bg-rose-700">Flag</Button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <DashboardEmpty text="No timetable submissions yet." />
        )}
      </CardContent>
    </Card>
  );
}

/* ============================ Search module ============================== */

export function SearchModule() {
  const config = useQaoConfig();
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSearch = async () => {
    if (q.trim().length < 2) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/qao/search?q=${encodeURIComponent(q.trim())}`, config);
      setResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border border-slate-200 bg-white shadow-lg sm:shadow-2xl">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900 sm:text-xl">Global Search</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Search teachers, class groups, and subjects. No student records are searchable.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} placeholder="Search teachers, groups, subjects..." className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs sm:rounded-xl sm:text-sm" />
          <Button onClick={runSearch} disabled={loading} className="h-10 rounded-full bg-violet-600 px-4 text-xs font-semibold text-white hover:bg-violet-700">
            <Search className="mr-1.5 h-3.5 w-3.5" /> {loading ? "..." : "Search"}
          </Button>
        </div>
        {results && (
          <div className="space-y-3">
            <SearchSection title={`Teachers (${results.teachers?.length || 0})`}>
              {(results.teachers || []).map((t) => (
                <p key={t._id} className="text-xs sm:text-sm"><span className="font-semibold text-slate-900">{t.fullName || t.name}</span> · {t.email} · {t.curriculum || "N/A"}</p>
              ))}
            </SearchSection>
            <SearchSection title={`Class Groups (${results.groups?.length || 0})`}>
              {(results.groups || []).map((g) => (
                <p key={g._id} className="text-xs sm:text-sm"><span className="font-semibold text-slate-900">{g.code}</span> · {g.curriculum} · Grade {g.grade} · {g.subject} · {g.studentCount}/{g.capacity} members · {g.teacher?.fullName || "Unassigned"}</p>
              ))}
            </SearchSection>
            <SearchSection title={`Subjects (${results.subjects?.length || 0})`}>
              {(results.subjects || []).map((s, i) => (
                <p key={s._id || i} className="text-xs sm:text-sm"><span className="font-semibold text-slate-900">{s.name}</span> · {s.curriculum || ""} · Grade {s.grade || ""} · {s.package || ""}</p>
              ))}
            </SearchSection>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SearchSection({ title, children }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
      <div className="space-y-1 rounded-xl bg-slate-50 p-3">{children}</div>
    </div>
  );
}

/* ============================ Settings module ============================ */

export function SettingsModule() {
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("qaoUser") || "{}"); } catch { return {}; }
  })();

  return (
    <Card className="border border-slate-200 bg-white shadow-lg sm:shadow-2xl">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900 sm:text-xl">Settings</CardTitle>
        <CardDescription className="text-xs sm:text-sm">Your Tutor Manager account and access scope.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Detail label="Name" value={user.name || "-"} />
        <Detail label="Email" value={user.email || "-"} />
        <Detail label="Staff ID" value={user.userId || "-"} />
        <Detail label="Role" value="Tutor Manager (QAO)" />
        <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Access scope</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-600 sm:text-sm">
            <li>Full access: teachers, class groups, timetables, broadcasts, scheduling.</li>
            <li>Class groups show member counts only — student records, names, and contact details are never exposed to this role.</li>
            <li>Teacher records exclude credentials (password, reset tokens).</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-bold text-slate-800">{value}</p>
    </div>
  );
}

function DashboardEmpty({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500 sm:rounded-[1.75rem] sm:p-10 sm:text-sm">{text}</div>
  );
}





