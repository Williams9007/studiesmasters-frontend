import { useState, useEffect } from "react";
import { FaFileAlt, FaPlus, FaCheck, FaClock, FaListAlt } from "react-icons/fa";
import apiClient from "../utils/apiClient";

const controlClass = "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

export default function TeacherAssignments({ teacherId, token }) {
  const [groups, setGroups] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({ groupId: "", title: "", description: "", subject: "", dueDate: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!teacherId || !token) return;
    Promise.all([
      apiClient.get(`/teachers/${teacherId}/class-groups`).catch(() => ({ data: { groups: [] } })),
      apiClient.get(`/teachers/${teacherId}/assignments`).catch(() => ({ data: [] }))
    ]).then(([g, a]) => { setGroups(g.data.groups || []); setAssignments(a.data || []); });
  }, [teacherId, token]);

  const submit = async (e) => {
    e.preventDefault(); setError(""); setNotice("");
    if (!form.groupId || !form.title || !form.description || !form.subject || !form.dueDate) return setError("All fields are required");
    setSaving(true);
    try {
      const res = await apiClient.post("/teachers/assignments/class-group", { ...form, teacherId });
      setNotice("Assignment posted to class group");
      setForm({ groupId: "", title: "", description: "", subject: "", dueDate: "" });
      const { data } = await apiClient.get(`/teachers/${teacherId}/assignments`);
      setAssignments(data || []);
    } catch (err) { setError(err.response?.data?.message || "Unable to post assignment"); }
    finally { setSaving(false); }
  };

  return <section className="p-5 sm:p-6">
    <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Assignments</p><h2 className="mt-1 text-xl font-bold">Class Group Assignments</h2></div>
    {error && <p className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}{notice && <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
    <form onSubmit={submit} className="mb-8 rounded-lg border border-slate-200 p-4"><h3 className="mb-3 font-bold">Post assignment</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">Class Group</span><select required className={controlClass} value={form.groupId} onChange={(e) => setForm((c) => ({ ...c, groupId: e.target.value }))}><option value="">Select group</option>{groups.map((g) => <option key={g._id} value={g._id}>{g.code} · {g.subject}</option>)}</select></label>
        <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">Title</span><input required className={controlClass} value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} /></label>
        <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">Subject</span><input required className={controlClass} value={form.subject} onChange={(e) => setForm((c) => ({ ...c, subject: e.target.value }))} /></label>
        <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">Due Date</span><input required type="date" className={controlClass} value={form.dueDate} onChange={(e) => setForm((c) => ({ ...c, dueDate: e.target.value }))} /></label>
        <label className="block text-sm font-semibold text-slate-700 md:col-span-2"><span className="mb-1.5 block">Description</span><textarea required className={controlClass} value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} /></label>
      </div>
      <button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"><FaPlus />{saving ? "Saving..." : "Post assignment"}</button>
    </form>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {assignments.map((a) => (
        <div key={a._id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-2"><div><p className="font-bold">{a.title}</p><p className="text-xs text-slate-500">{a.subject?.join?.(", ") || a.subject}</p></div><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold"><FaClock /> {a.dueDate ? new Date(a.dueDate).toLocaleDateString() : "-"}</span></div>
          <p className="mt-2 text-sm text-slate-600 line-clamp-3">{a.description}</p>
        </div>
      ))}
      {!assignments.length && <p className="text-sm text-slate-500">No assignments yet.</p>}
    </div>
  </section>;
}