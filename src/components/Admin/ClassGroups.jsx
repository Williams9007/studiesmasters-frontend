import { useEffect, useMemo, useState } from "react";
import { FaLayerGroup, FaPlus, FaSyncAlt, FaUserTie, FaTimes, FaUserPlus } from "react-icons/fa";
import apiClient from "../../utils/apiClient";

const CLASS_GROUP_SUBJECTS = ["English", "Maths", "Science"];
const initialForm = { curriculum: "", grade: "", subject: "", capacity: "5", codePrefix: "" };
const controlClass = "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

export default function ClassGroups() {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [addingToGroup, setAddingToGroup] = useState(null);
  const [addSelectedIds, setAddSelectedIds] = useState([]);
  const [busyAdding, setBusyAdding] = useState(false);
  const [removingGroupId, setRemovingGroupId] = useState(null);
  const [removingStudentId, setRemovingStudentId] = useState(null);

  const loadData = async () => {
    setLoading(true); setError("");
    try {
      const [options, savedGroups] = await Promise.all([apiClient.get("/admin/class-groups/options"), apiClient.get("/admin/class-groups")]);
      setStudents(options.data.students || []); setTeachers(options.data.teachers || []); setGroups(savedGroups.data.groups || []);
    } catch (err) { setError(err.response?.data?.message || "Unable to load class groups."); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);
  const curricula = useMemo(() => [...new Set(students.map((s) => s.curriculum).filter(Boolean))], [students]);
  const grades = useMemo(() => [...new Set(students.filter((s) => s.curriculum === form.curriculum).map((s) => s.grade).filter(Boolean))], [students, form.curriculum]);
  const subjects = useMemo(() => (form.curriculum && form.grade ? CLASS_GROUP_SUBJECTS : []), [form.curriculum, form.grade]);
  const available = useMemo(() => {
    const groupedStudentIds = new Set(
      groups
        .filter((group) => group.curriculum === form.curriculum && group.grade === form.grade && group.subject === form.subject)
        .flatMap((group) => group.students || [])
        .map((student) => String(student._id || student))
    );
    return students.filter((student) =>
      student.curriculum === form.curriculum &&
      student.grade === form.grade &&
      (!student.subjectNames?.length || student.subjectNames.includes(form.subject)) &&
      !groupedStudentIds.has(String(student._id))
    );
  }, [students, groups, form]);
  const change = (field, value) => { setForm((current) => ({ ...current, [field]: value, ...(field === "curriculum" ? { grade: "", subject: "" } : {}), ...(field === "grade" ? { subject: "" } : {}) })); if (["curriculum", "grade", "subject"].includes(field)) setSelectedIds([]); };

  // Students that can be added to a specific group (same curriculum/grade/subject, not already in any group)
  const addableStudents = (group) => {
    const groupedStudentIds = new Set(
      groups
        .filter((g) => g.curriculum === group.curriculum && g.grade === group.grade && g.subject === group.subject)
        .flatMap((g) => g.students || [])
        .map((student) => String(student._id || student))
    );
    return students.filter((student) =>
      student.curriculum === group.curriculum &&
      student.grade === group.grade &&
      (!student.subjectNames?.length || student.subjectNames.includes(group.subject)) &&
      !groupedStudentIds.has(String(student._id))
    );
  };

  const generate = async (event) => {
    event.preventDefault(); setError(""); setNotice("");
    if (!selectedIds.length) return setError("Select at least one student.");
    setSaving(true);
    try {
      const result = await apiClient.post("/admin/class-groups/generate", { ...form, capacity: Number(form.capacity), studentIds: selectedIds });
      setNotice(result.data.message); setSelectedIds([]); setForm(initialForm); await loadData();
    } catch (err) { setError(err.response?.data?.message || "Unable to generate groups."); }
    finally { setSaving(false); }
  };

  const assignTeacher = async (groupId, teacherId) => {
    if (!teacherId) return;
    try {
      const result = await apiClient.put(`/admin/class-groups/${groupId}/teacher`, { teacherId });
      setGroups((current) => current.map((group) => group._id === groupId ? { ...group, teacher: result.data.group.teacher } : group));
    } catch (err) { setError(err.response?.data?.message || "Unable to assign the teacher."); }
  };

  const openAddModal = (group) => {
    setAddingToGroup(group._id);
    setAddSelectedIds([]);
    setError("");
    setNotice("");
  };

  const closeAddModal = () => {
    setAddingToGroup(null);
    setAddSelectedIds([]);
  };

  const addStudents = async () => {
    if (!addingToGroup || !addSelectedIds.length) return;
    setBusyAdding(true); setError(""); setNotice("");
    try {
      const result = await apiClient.post(`/admin/class-groups/${addingToGroup}/students`, { studentIds: addSelectedIds });
      setNotice(result.data.message || "Students added.");
      setGroups((current) => current.map((group) => group._id === addingToGroup ? result.data.group : group));
      closeAddModal();
      await loadData();
    } catch (err) { setError(err.response?.data?.message || "Unable to add students to the group."); }
    finally { setBusyAdding(false); }
  };

  const removeStudent = async (groupId, studentId, studentName) => {
    if (!window.confirm(`Remove ${studentName || "this student"} from the group?`)) return;
    setRemovingGroupId(groupId); setRemovingStudentId(studentId); setError(""); setNotice("");
    try {
      const result = await apiClient.delete(`/admin/class-groups/${groupId}/students/${studentId}`);
      setNotice(result.message || "Student removed from the group.");
      setGroups((current) => current.map((group) => group._id === groupId ? result.data.group : group));
    } catch (err) { setError(err.response?.data?.message || "Unable to remove the student from the group."); }
    finally { setRemovingGroupId(null); setRemovingStudentId(null); }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading class groups...</div>;

  const addModalGroup = addingToGroup ? groups.find((g) => g._id === addingToGroup) : null;
  const addableForModal = addModalGroup ? addableStudents(addModalGroup) : [];
  const remainingSlots = addModalGroup ? Math.max(0, addModalGroup.capacity - (addModalGroup.students?.length || 0)) : 0;

  return (
    <section className="p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Teaching groups</p><h2 className="mt-1 text-xl font-bold">Class Groups</h2><p className="mt-1 text-sm text-slate-500">Create groups of five or ten students within the same curriculum and grade.</p></div><button onClick={loadData} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:bg-slate-50"><FaSyncAlt /> Refresh</button></div>
      {error && <p className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
      {notice && <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
      <div className="mb-6 rounded-lg border border-slate-200 bg-white"><div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><h3 className="font-bold text-slate-900">All Registered Students</h3><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{students.length} total</span></div>{students.length ? <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">{students.map((student, index) => <div key={student._id} className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[3rem_1.4fr_1fr_1fr]"><span className="font-semibold text-slate-400">#{index + 1}</span><span><b className="block text-slate-800">{student.fullName}</b><span className="text-xs text-slate-500">{student.email}</span></span><span className="text-slate-600">{student.phone || "No phone number"}</span><span className="text-slate-600">{student.curriculum || "No curriculum"} · {student.grade || "No grade"}<span className="block text-xs text-slate-500">{student.subjectNames?.join(", ") || "Subjects not set"}</span></span></div>)}</div> : <p className="px-4 py-5 text-sm text-slate-500">No registered students were returned. Use Refresh after confirming the backend is running.</p>}</div>
      <form onSubmit={generate} className="border-b border-slate-200 pb-6"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Curriculum"><select required className={controlClass} value={form.curriculum} onChange={(e) => change("curriculum", e.target.value)}><option value="">Select curriculum</option>{curricula.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Grade"><select required disabled={!form.curriculum} className={controlClass} value={form.grade} onChange={(e) => change("grade", e.target.value)}><option value="">Select grade</option>{grades.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Subject"><select required disabled={!form.grade} className={controlClass} value={form.subject} onChange={(e) => change("subject", e.target.value)}><option value="">Select subject</option>{subjects.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Class size"><select className={controlClass} value={form.capacity} onChange={(e) => change("capacity", e.target.value)}><option value="1">1-on-1 private</option><option value="5">5 students</option><option value="10">10 students</option></select></Field>
        <Field label="Class prefix"><input required className={controlClass} placeholder="e.g. GES10A" value={form.codePrefix} onChange={(e) => change("codePrefix", e.target.value)} /></Field>
      </div><div className="mt-5 rounded-lg border border-slate-200"><div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><span className="text-sm font-semibold">Students ({selectedIds.length} selected)</span><button type="button" onClick={() => setSelectedIds(available.map((s) => s._id))} className="text-sm font-semibold text-blue-700">Select all</button></div>{form.subject ? <div className="max-h-56 overflow-y-auto">{available.length ? available.map((student) => <label key={student._id} className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 hover:bg-slate-50"><input type="checkbox" className="h-4 w-4 accent-blue-600" checked={selectedIds.includes(student._id)} onChange={() => setSelectedIds((current) => current.includes(student._id) ? current.filter((id) => id !== student._id) : [...current, student._id])} /><span><b className="block text-sm">{student.fullName}</b><span className="text-xs text-slate-500">{student.email}{student.phone ? ` · ${student.phone}` : ""}</span></span></label>) : <p className="px-4 py-5 text-sm text-slate-500">No ungrouped students match this curriculum, grade, and subject.</p>}</div> : <p className="px-4 py-5 text-sm text-slate-500">Select a curriculum, grade, and subject to choose students.</p>}</div><button disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"><FaPlus />{saving ? "Generating..." : "Generate groups"}</button></form>
      <div className="pt-6"><h3 className="text-base font-bold">Existing Groups</h3>{groups.length ? <div className="mt-4 grid gap-4 xl:grid-cols-2">{groups.map((group) => <article key={group._id} className="border border-slate-200 p-4"><div className="flex justify-between gap-3"><div><p className="flex items-center gap-2 font-bold"><FaLayerGroup className="text-blue-600" />{group.code}</p><p className="mt-1 text-sm text-slate-500">{group.curriculum} · Grade {group.grade}</p></div><span className="h-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">{group.studentCount ?? group.students?.length ?? 0} / {group.capacity}</span></div><label className="mt-4 block text-xs font-bold uppercase tracking-wide text-slate-500"><span className="mb-1.5 flex items-center gap-2"><FaUserTie />Teacher</span><select className={controlClass} value={group.teacher?._id || ""} onChange={(e) => assignTeacher(group._id, e.target.value)}><option value="">Assign a teacher</option>{teachers.filter((teacher) => !teacher.curriculum || teacher.curriculum === group.curriculum).map((teacher) => <option key={teacher._id} value={teacher._id}>{teacher.fullName}</option>)}</select></label><div className="mt-4 border-t border-slate-100 pt-3 text-sm text-slate-600"><div className="mb-2 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Students</span>{(group.students?.length || 0) < group.capacity && <button onClick={() => openAddModal(group)} className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"><FaUserPlus /> Add</button>}</div>{group.students?.length ? <ul className="space-y-2">{group.students.map((student) => <li key={student._id} className="flex items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2"><span className="min-w-0"><b className="block truncate text-sm text-slate-800">{student.fullName}</b><span className="block truncate text-xs text-slate-500">{student.phone || student.email}</span></span><button type="button" onClick={() => removeStudent(group._id, student._id, student.fullName)} disabled={removingGroupId === group._id && removingStudentId === student._id} className="inline-flex shrink-0 items-center gap-1 rounded-md border border-rose-200 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"><FaTimes />{removingGroupId === group._id && removingStudentId === student._id ? "Removing..." : "Remove"}</button></li>)}</ul> : <p className="text-slate-500">No students assigned</p>}</div></article>)}</div> : <p className="mt-4 border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">No class groups have been created yet.</p>}</div>
      {addingToGroup && addModalGroup && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeAddModal}><div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h3 className="font-bold text-slate-900">Add students to {addModalGroup.code}</h3><button onClick={closeAddModal} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><FaTimes /></button></div><div className="max-h-[50vh] overflow-y-auto px-5 py-4">{addableForModal.length ? <><p className="mb-3 text-xs text-slate-500">{remainingSlots} slot(s) available in this group.</p>{addableForModal.map((student) => <label key={student._id} className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-2 py-3 last:border-0 hover:bg-slate-50"><input type="checkbox" className="h-4 w-4 accent-blue-600" checked={addSelectedIds.includes(student._id)} onChange={() => setAddSelectedIds((current) => current.includes(student._id) ? current.filter((id) => id !== student._id) : [...current, student._id])} /><span><b className="block text-sm">{student.fullName}</b><span className="text-xs text-slate-500">{student.email}{student.phone ? ` · ${student.phone}` : ""}</span></span></label>)}</> : <p className="py-5 text-center text-sm text-slate-500"><b>No ungrouped students match this group's curriculum, grade, and subject.</b>{remainingSlots ? " You may need more students in this category." : " The class is already full."}</p>}</div><div className="flex items-center justify-between border-t border-slate-200 px-5 py-4"><span className="text-sm text-slate-500">{addSelectedIds.length} selected</span><div className="flex gap-2"><button onClick={closeAddModal} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Cancel</button><button onClick={addStudents} disabled={!addSelectedIds.length || busyAdding} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"><FaUserPlus />{busyAdding ? "Adding..." : `Add (${addSelectedIds.length})`}</button></div></div></div></div>}
    </section>
  );
}

function Field({ label, children }) {
  return <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">{label}</span>{children}</label>;
}