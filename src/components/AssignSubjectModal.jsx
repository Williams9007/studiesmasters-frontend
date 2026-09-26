import { useState } from "react";
import apiClient from "@/utils/apiClient";

export default function AssignSubjectModal({ users, subjects, isOpen, onClose }) {
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!teacherId || !subjectId) {
      alert("Please select both a teacher and a subject.");
      return;
    }

    setLoading(true);
    try {
      // apiClient is axios, so the payload lives on res.data. Reading res.message
      // (always undefined) hid the real backend result — including Moodle sync
      // warnings — from the admin.
      const res = await apiClient.post("/admin/assign-subject", {
        teacherId,
        subjectId,
      });

      const data = res.data || {};
      const moodleNote = data.moodle?.ok === false
        ? `\n\nNote: the subject was saved, but the Moodle sync reported: ${data.moodle.error || "unknown error"}`
        : data.moodle?.ok
          ? "\n\nMoodle: account and course access updated."
          : "";

      alert(`${data.message || "Subject assigned successfully!"}${moodleNote}`);
      setTeacherId("");
      setSubjectId("");
      onClose();
    } catch (err) {
      console.error("Error assigning subject:", err);
      alert(err.response?.data?.message || "Failed to assign subject.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-96 shadow-lg">
        <h2 className="text-xl font-semibold mb-4">Assign Subject to Teacher</h2>

        <select
          className="w-full border p-2 rounded mb-3"
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
        >
          <option value="">Select Teacher</option>
          {users
            .filter((u) => u.role === "teacher")
            .map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
        </select>

        <select
          className="w-full border p-2 rounded mb-4"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
        >
          <option value="">Select Subject</option>
          {subjects.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            onClick={handleAssign}
            disabled={loading}
          >
            {loading ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}
