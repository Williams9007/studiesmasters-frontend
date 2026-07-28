"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import apiClient from "../../utils/apiClient";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function BroadcastTab() {
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [tutorManagers, setTutorManagers] = useState([]);
  const [recipientType, setRecipientType] = useState("all");
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState(null);
  const [logs, setLogs] = useState([]);
  const socketRef = useRef(null);

  // ================= FETCH USERS =================
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const [studentsRes, teachersRes, managersRes] = await Promise.all([
          apiClient.get("/admin/students/list"),
          apiClient.get("/admin/teachers/list"),
          apiClient.get("/admin/qao-users"),
        ]);

        const studentArray = (studentsRes.data.students || []).sort((a, b) =>
          a.fullName.localeCompare(b.fullName)
        );
        const teacherArray = (teachersRes.data.teachers || []).sort((a, b) =>
          a.fullName.localeCompare(b.fullName)
        );
        const managerArray = (managersRes.data.qaoUsers || []).sort((a, b) =>
          a.fullName.localeCompare(b.fullName)
        );

        setStudents(studentArray);
        setTeachers(teacherArray);
        setTutorManagers(managerArray);
      } catch (err) {
        console.error("❌ Error fetching users:", err);
      }
    };

    fetchUsers();
  }, []);

  // ================= SOCKET =================
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    const socket = io(BASE_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("new-broadcast", (data) =>
      setLogs((prev) => [data, ...prev])
    );

    return () => socket.disconnect();
  }, []);

  // ================= SEND =================
  const handleSend = async () => {
    if (!subject || !message)
      return alert("Subject and message are required.");

    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("message", message);
      formData.append("link", link);
      formData.append("recipientType", recipientType);
      if (file) formData.append("attachment", file);

      if (selectedRecipientId) {
        formData.append("recipientId", selectedRecipientId);
      }

      await apiClient.post("/admin/broadcasts/send", formData);

      alert("Broadcast sent successfully ✅");

      setSubject("");
      setMessage("");
      setLink("");
      setFile(null);
      setSelectedRecipientId("");

    } catch (err) {
      console.error("❌ Failed to send broadcast:", err);
      alert(err.response?.data?.message || "Failed to send broadcast");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">

      <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
        ✉️ Compose Broadcast
      </h2>

      {/* Receiver Type */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">
          Send To
        </label>
        <select
          value={recipientType}
          onChange={(e) => {
            setRecipientType(e.target.value);
            setSelectedRecipientId("");
          }}
          className="w-full border p-2 rounded-md text-black"
        >
          <option value="all">All Users</option>
          <option value="students">All Students</option>
          <option value="teachers">All Teachers</option>
          <option value="tutormanagers">All Tutor Managers</option>
          <option value="single">Specific User</option>
        </select>
      </div>

      {/* Specific User Selector */}
      {recipientType === "single" && (
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Select User
          </label>
          <select
            value={selectedRecipientId}
            onChange={(e) => setSelectedRecipientId(e.target.value)}
            className="w-full border p-2 rounded-md text-black"
          >
            <option value="">-- Select a user --</option>
            <optgroup label="Students">
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.fullName} ({s.email})
                </option>
              ))}
            </optgroup>
            <optgroup label="Teachers">
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.fullName} ({t.email})
                </option>
              ))}
            </optgroup>
            <optgroup label="Tutor Managers">
              {tutorManagers.map((tm) => (
                <option key={tm._id} value={tm._id}>
                  {tm.fullName || tm.name} ({tm.email})
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      )}

      {/* Subject */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">
          Subject
        </label>
        <input
          type="text"
          placeholder="Enter subject..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border p-2 rounded-md text-black"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">
          Message
        </label>
        <textarea
          rows={6}
          placeholder="Write your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full border p-3 rounded-md text-black"
        />
      </div>

      {/* Link */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">
          Optional Link
        </label>
        <input
          type="text"
          placeholder="https://example.com"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full border p-2 rounded-md text-black"
        />
      </div>

      {/* Attachment */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">
          Attachment (Image / PDF)
        </label>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="w-full text-black"
        />
        {file && (
          <p className="text-sm text-gray-500 mt-1">
            Attached: {file.name}
          </p>
        )}
      </div>

      {/* Send Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSend}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Send Broadcast
        </button>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold text-gray-700 mb-2">
            Recent Broadcasts
          </h3>

          {logs.map((log, i) => (
            <div
              key={i}
              className="border p-3 rounded-md mb-2 bg-gray-50"
            >
              <p className="font-bold text-gray-800">
                {log.subject}
              </p>
              <p className="text-gray-700">{log.message}</p>

              {log.link && (
                <a
                  href={log.link}
                  target="_blank"
                  className="text-blue-600 underline text-sm"
                >
                  Open Link
                </a>
              )}

              <small className="block text-gray-400 mt-2">
                {new Date(log.createdAt).toLocaleString()}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}