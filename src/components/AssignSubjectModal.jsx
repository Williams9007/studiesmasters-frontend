import { useEffect, useMemo, useState } from "react";
import apiClient from "../utils/apiClient";

// Canonical multi-select subject editor for one teacher.
// Single source of truth: PUT /api/admin/teachers/:teacherId/subjects
// ({ subjects: [subjectIds] }). Replaces the whole assignment set, syncs the
// TeacherAssignment mirror rows + Moodle (best-effort) and writes the
// TEACHER_SUBJECTS_UPDATED audit log on the backend.
export default function AssignSubjectModal({ teacher, users, subjects: subjectsProp, isOpen, onClose, onSaved }) {
  // Backwards compat: older callers passed users[] + subjects[] and picked a
  // teacher inside the modal. New caller (Admin/Users.jsx) passes `teacher`.
  const [teacherId, setTeacherId] = useState("");
  const [singleSubjectId, setSingleSubjectId] = useState("");
  const [allSubjects, setAllSubjects] = useState(Array.isArray(subjectsProp) ? subjectsProp : []);
  const [selectedIds, setSelectedIds] = useState([]);
  const [initialIds, setInitialIds] = useState([]);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [curriculumFilter, setCurriculumFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const activeTeacher = teacher || null;
  const effectiveTeacherId = activeTeacher?._id || activeTeacher?.id || teacherId || "";
  const effectiveTeacherName =
    activeTeacher?.name || activeTeacher?.fullName ||
    users?.find((u) => String(u._id) === String(effectiveTeacherId))?.name || "Teacher";
  const legacyMode = !activeTeacher;

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSearch("");
    setGradeFilter("all");
    setCurriculumFilter("all");
    setSingleSubjectId("");
    if (activeTeacher) setTeacherId(String(activeTeacher._id || activeTeacher.id || ""));
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !effectiveTeacherId || legacyMode) return;
    loadCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, effectiveTeacherId]);

  const loadSubjects = async () => {
    // Public catalogue first (GET /api/subjects -> array), then admin shape.
    try {
      const res = await apiClient.get("/subjects");
      const list = Array.isArray(res.data) ? res.data : res.data?.subjects || [];
      if (list.length) {
        setAllSubjects(list);
        return;
      }
    } catch (e) { /* fall through to admin endpoint */ }
    try {
      if (!subjectsProp?.length) {
        const res = await apiClient.get("/admin/subjects");
        setAllSubjects(res.data?.subjects || []);
      }
    } catch (e) {
      console.error("Error loading subjects:", e);
      setError("Unable to load the subject catalogue.");
    }
  };

  const loadCurrent = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/teachers/${effectiveTeacherId}/subjects`);
      const ids = res.data?.subjectIds || (res.data?.subjects || []).map((s) => String(s._id));
      setSelectedIds(ids);
      setInitialIds(ids);
    } catch (e) {
      console.error("Error loading teacher subjects:", e);
      setError(e.response?.data?.message || "Unable to load this teacher's subjects.");
      setSelectedIds([]);
      setInitialIds([]);
    } finally {
      setLoading(false);
    }
  };

  const grades = useMemo(
    () => [...new Set((allSubjects || []).map((s) => s.grade).filter(Boolean))].sort(),
    [allSubjects]
  );
  const curricula = useMemo(
    () => [...new Set((allSubjects || []).map((s) => s.curriculum).filter(Boolean))].sort(),
    [allSubjects]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (allSubjects || []).filter((s) => {
      if (gradeFilter !== "all" && String(s.grade || "") !== gradeFilter) return false;
      if (curriculumFilter !== "all" && String(s.curriculum || "") !== curriculumFilter) return false;
      if (!q) return true;
      return (
        String(s.name || "").toLowerCase().includes(q) ||
        String(s.grade || "").toLowerCase().includes(q) ||
        String(s.curriculum || "").toLowerCase().includes(q) ||
        String(s.package || "").toLowerCase().includes(q)
      );
    });
  }, [allSubjects, search, gradeFilter, curriculumFilter]);

  const toggle = (id) => {
    const key = String(id);
    setSelectedIds((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  };

  const dirty = useMemo(() => {
    const a = [...selectedIds].sort().join(",");
    const b = [...initialIds].sort().join(",");
    return a !== b;
  }, [selectedIds, initialIds]);

  const handleSave = async () => {
    if (!effectiveTeacherId) {
      alert("Please select a teacher.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await apiClient.put(`/admin/teachers/${effectiveTeacherId}/subjects`, {
        subjects: selectedIds,
      });
      const data = res.data || {};
      const moodleNote =
        data.moodle?.ok === false
          ? `\n\nNote: saved, but Moodle sync reported: ${data.moodle?.error || data.moodle?.reason || "unknown error"}`
          : data.moodle?.ok
            ? "\n\nMoodle: account and course access updated."
            : "";
      alert(`${data.message || "Subjects updated successfully!"}${moodleNote}`);
      setInitialIds(selectedIds);
      onSaved?.(data);
      onClose();
    } catch (err) {
      console.error("Error saving teacher subjects:", err);
      setError(err.response?.data?.message || "Failed to save subjects.");
    } finally {
      setSaving(false);
    }
  };

  // Legacy single-assign path (kept so old callers don't break).
  const handleLegacyAssign = async () => {
    if (!teacherId || !singleSubjectId) {
      alert("Please select both a teacher and a subject.");
      return;
    }
    setSaving(true);
    try {
      const current = await apiClient.get(`/admin/teachers/${teacherId}/subjects`);
      const existing = current.data?.subjectIds || [];
      const merged = [...new Set([...existing.map(String), String(singleSubjectId)])];
      const res = await apiClient.put(`/admin/teachers/${teacherId}/subjects`, { subjects: merged });
      const data = res.data || {};
      alert(data.message || "Subject assigned successfully!");
      setTeacherId("");
      setSingleSubjectId("");
      onSaved?.(data);
      onClose();
    } catch (err) {
      console.error("Error assigning subject:", err);
      alert(err.response?.data?.message || "Failed to assign subject.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const legacyUsers = Array.isArray(users) ? users : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-1">Assign Subjects to Teacher</h2>
        <p className="text-sm text-slate-500 mb-4">
          {effectiveTeacherName} — tick every subject this teacher should teach, then save.
          Saving replaces the whole set.
        </p>

        {legacyMode ? (
          <>
            <select
              className="w-full border p-2 rounded mb-3"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
            >
              <option value="">Select Teacher</option>
              {legacyUsers
                .filter((u) => u.role === "teacher")
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
            </select>

            <select
              className="w-full border p-2 rounded mb-4"
              value={singleSubjectId}
              onChange={(e) => setSingleSubjectId(e.target.value)}
            >
              <option value="">Select Subject</option>
              {(allSubjects || []).map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}{s.grade ? ` · ${s.grade}` : ""}{s.curriculum ? ` · ${s.curriculum}` : ""}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                onClick={handleLegacyAssign}
                disabled={saving}
              >
                {saving ? "Assigning..." : "Assign"}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                placeholder="Search subjects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 border p-2 rounded text-sm"
              />
              <select value={curriculumFilter} onChange={(e) => setCurriculumFilter(e.target.value)} className="border p-2 rounded text-sm">
                <option value="all">All curricula</option>
                {curricula.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="border p-2 rounded text-sm">
                <option value="all">All grades</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="mb-3 text-sm text-rose-600">{error}</p>}
            {loading ? (
              <p className="py-6 text-center text-sm text-slate-500">Loading subjects…</p>
            ) : filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">No subjects match this filter.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto border rounded divide-y">
                {filtered.map((s) => {
                  const id = String(s._id);
                  const checked = selectedIds.includes(id);
                  return (
                    <label key={id} className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={() => toggle(id)} className="h-4 w-4" />
                      <span className="flex-1">
                        <span className="font-semibold">{s.name}</span>{" "}
                        <span className="text-slate-500">
                          {[s.curriculum, s.grade, s.package].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            <p className="mt-3 text-xs text-slate-500">
              {selectedIds.length} subject{selectedIds.length === 1 ? "" : "s"} selected{dirty ? " (unsaved changes)" : ""}.
            </p>

            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-50"
                onClick={handleSave}
                disabled={saving || loading || !dirty}
              >
                {saving ? "Saving..." : "Save subjects"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
