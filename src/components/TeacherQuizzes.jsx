import { useState, useEffect } from "react";
import { FaClipboardCheck, FaPlus, FaClock, FaListAlt } from "react-icons/fa";
import apiClient from "../utils/apiClient";

const controlClass = "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

export default function TeacherQuizzes({ teacherId, token }) {
  const [groups, setGroups] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [form, setForm] = useState({ groupId: "", title: "", description: "", dueDate: "", timeLimit: "30" });
  const [questions, setQuestions] = useState([{ questionText: "", options: ["", "", "", ""], correctAnswer: "", points: 1 }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!teacherId || !token) return;
    Promise.all([
      apiClient.get(`/teachers/${teacherId}/class-groups`).catch(() => ({ data: { groups: [] } })),
      apiClient.get(`/teachers/${teacherId}/quizzes`).catch(() => ({ data: [] }))
    ]).then(([g, q]) => { setGroups(g.data.groups || []); setQuizzes(q.data || []); });
  }, [teacherId, token]);

  const addQuestion = () => setQuestions((q) => [...q, { questionText: "", options: ["", "", "", ""], correctAnswer: "", points: 1 }]);
  const updateQuestion = (index, field, value) => setQuestions((q) => q.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const updateOption = (qIndex, oIndex, value) => setQuestions((q) => q.map((item, i) => i === qIndex ? { ...item, options: item.options.map((opt, j) => j === oIndex ? value : opt) } : item));

  const submit = async (e) => {
    e.preventDefault(); setError(""); setNotice("");
    if (!form.groupId || !form.title || !form.dueDate || !questions.length) return setError("Group, title, due date and at least one question are required");
    setSaving(true);
    try {
      await apiClient.post("/teachers/quizzes/class-group", { ...form, teacherId, questions });
      setNotice("Quiz created for class group");
      setForm({ groupId: "", title: "", description: "", dueDate: "", timeLimit: "30" });
      setQuestions([{ questionText: "", options: ["", "", "", ""], correctAnswer: "", points: 1 }]);
      const { data } = await apiClient.get(`/teachers/${teacherId}/quizzes`);
      setQuizzes(data || []);
    } catch (err) { setError(err.response?.data?.message || "Unable to create quiz"); }
    finally { setSaving(false); }
  };

  return <section className="p-5 sm:p-6">
    <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Quizzes</p><h2 className="mt-1 text-xl font-bold">Class Group Quizzes</h2></div>
    {error && <p className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}{notice && <p className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>}
    <form onSubmit={submit} className="mb-8 rounded-lg border border-slate-200 p-4 space-y-4">
      <h3 className="font-bold">Create quiz</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">Class Group</span><select required className={controlClass} value={form.groupId} onChange={(e) => setForm((c) => ({ ...c, groupId: e.target.value }))}><option value="">Select group</option>{groups.map((g) => <option key={g._id} value={g._id}>{g.code} · {g.subject}</option>)}</select></label>
        <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">Title</span><input required className={controlClass} value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} /></label>
        <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">Due Date</span><input required type="date" className={controlClass} value={form.dueDate} onChange={(e) => setForm((c) => ({ ...c, dueDate: e.target.value }))} /></label>
        <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">Time Limit (min)</span><input required type="number" min={5} className={controlClass} value={form.timeLimit} onChange={(e) => setForm((c) => ({ ...c, timeLimit: e.target.value }))} /></label>
        <label className="block text-sm font-semibold text-slate-700 md:col-span-2"><span className="mb-1.5 block">Description</span><textarea className={controlClass} value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} /></label>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between"><p className="text-sm font-bold">Questions</p><button type="button" onClick={addQuestion} className="text-sm font-semibold text-blue-700">Add question</button></div>
        {questions.map((q, qIndex) => <div key={qIndex} className="rounded-xl border border-slate-200 p-4 space-y-3">
          <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">Question {qIndex + 1}</span><textarea required className={controlClass} value={q.questionText} onChange={(e) => updateQuestion(qIndex, "questionText", e.target.value)} /></label>
          <div className="grid gap-2 md:grid-cols-2">
            {q.options.map((opt, oIndex) => <input key={oIndex} required className={controlClass} placeholder={`Option ${oIndex + 1}`} value={opt} onChange={(e) => updateOption(qIndex, oIndex, e.target.value)} />)}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">Correct answer</span><input required className={controlClass} value={q.correctAnswer} onChange={(e) => updateQuestion(qIndex, "correctAnswer", e.target.value)} /></label>
            <label className="block text-sm font-semibold text-slate-700"><span className="mb-1.5 block">Points</span><input required type="number" min={1} className={controlClass} value={q.points} onChange={(e) => updateQuestion(qIndex, "points", Number(e.target.value))} /></label>
          </div>
        </div>)}
      </div>
      <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300"><FaPlus />{saving ? "Saving..." : "Create quiz"}</button>
    </form>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {quizzes.map((quiz) => <div key={quiz._id} className="rounded-xl border border-slate-200 p-4">
        <div className="flex items-start justify-between gap-2"><div><p className="font-bold">{quiz.title}</p><p className="text-xs text-slate-500">{quiz.subject}</p></div><span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold"><FaClock /> {quiz.dueDate ? new Date(quiz.dueDate).toLocaleDateString() : "-"}</span></div>
        <p className="mt-2 text-sm text-slate-600 line-clamp-3">{quiz.description}</p>
      </div>)}
      {!quizzes.length && <p className="text-sm text-slate-500">No quizzes yet.</p>}
    </div>
  </section>;
}