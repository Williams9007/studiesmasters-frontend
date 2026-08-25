import { useEffect, useState } from "react";
import { FaBook, FaSave } from "react-icons/fa";
import apiClient from "../../utils/apiClient";

const controlClass =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

export default function SubjectsTab() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // subject _id being edited
  const [draft, setDraft] = useState("");       // moodle course id draft
  const [saving, setSaving] = useState(false);

  const loadSubjects = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/admin/subjects");
      setSubjects(res.data.subjects || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load subjects.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const startEdit = (subject) => {
    setEditing(subject._id);
    setDraft(subject.moodleCourseId != null ? String(subject.moodleCourseId) : "");
  };

  const save = async (subject) => {
    setSaving(true);
    try {
      await apiClient.put(`/admin/subjects/${subject._id}/moodle-course`, {
        moodleCourseId: draft,
      });
      setEditing(null);
      await loadSubjects();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save the Moodle course id.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <FaBook className="text-blue-600" /> Subjects &amp; Moodle courses
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Assign each subject's Moodle course id so the &quot;Open class&quot; SSO button sends students
            straight into the correct Moodle course. Leave 0 to send them to the Moodle dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSubjects}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-500">Loading subjects…</div>
      ) : subjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          No subjects found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Package</th>
                <th className="px-4 py-3 font-semibold">Grade</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Moodle course ID</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((subject) => (
                <tr key={subject._id} className="align-middle">
                  <td className="px-4 py-3 font-semibold text-slate-800">{subject.name}</td>
                  <td className="px-4 py-3 text-slate-600">{subject.package}</td>
                  <td className="px-4 py-3 text-slate-600">{subject.grade}</td>
                  <td className="px-4 py-3 text-slate-600">GH₵ {subject.price}</td>
                  <td className="px-4 py-3">
                    {editing === subject._id ? (
                      <input
                        type="number"
                        min="0"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        placeholder="0"
                        className={controlClass}
                      />
                    ) : (
                      <span className="font-mono text-slate-800">
                        {subject.moodleCourseId != null ? subject.moodleCourseId : <span className="text-slate-400">Not set</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editing === subject._id ? (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => save(subject)}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                      >
                        <FaSave /> {saving ? "Saving…" : "Save"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(subject)}
                        className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

