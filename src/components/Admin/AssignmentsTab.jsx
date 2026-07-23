import { useState, useEffect } from "react";
import { FaFileAlt, FaPlus, FaCheck, FaClock, FaTimes } from "react-icons/fa";
import apiClient from "../../utils/apiClient";

const controlClass = "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

export default function AssignmentsTab() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ groupId: "", title: "", description: "", subject: "", dueDate: "" });

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true); setError("");
    try {
      const res = await apiClient.get("/admin/class-groups");
      setGroups(res.data.groups || []);
    } catch (err) { setError(err.response?.data?.message || "Unable to load class groups."); }
    finally { setLoading(false); }
  };

  const submit = async (e) => {
    e.preventDefault(); setError(""); setNotice("");
    if (!form.groupId || !form.title || !form.description || !form.subject || !form.dueDate) return setError("All fields are required");
    setSaving(true);
    try {
      await apiClient.post("/teachers/assignments/class-group", { ...form, teacherId: "" }); setNotice("Assignment created"); setForm({ groupId: "", title: "", description: "", subject: "", dueDate: "" });
    } catch (err) { setError(err.response?.data?.message || "Unable to create assignment."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-6 text-sm text-slate-500">Loading assignments...</div>;
  return <section className="p-5 sm:p-6">
    <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Class Group Assignments</p><h2 className="mt-1 text-xl font-bold">Assignments</h2></div>
    {error && <p className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}{notice && <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
    <form onSubmit={submit} className="mb-6 rounded-lg border border-slate-200 p-4"><h3 className="mb-3 font-bold">Create Assignment</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">Class Group</span><select required className={controlClass} value={form.groupId} onChange={(e) => setForm((c) => ({ ...c, groupId: e.target.value }))}><option value="">Select group</option>{groups.map((g) => <option key={g._id} value={g._id}>{g.code} - {g.subject}</option>)}</select></label>
        <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">Title</span><input required className={controlClass} value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} /></label>
        <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">Subject</span><input required className={controlClass} value={form.subject} onChange={(e) => setForm((c) => ({ ...c, subject: e.target.value }))} /></label>
        <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">Due Date</span><input required type="date" className={controlClass} value={form.dueDate} onChange={(e) => setForm((c) => ({ ...c, dueDate: e.target.value }))} /></label>
        <label className="block text-sm font-semibold text-slate-700 md:col-span-2"><span className="mb-1.5 block">Description</span><textarea required className={controlClass} value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} /></label>
      </div>
      <button disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"><FaPlus />{saving ? "Saving..." : "Create Assignment"}</button>
    </form>
  </section>;
}