<<<<<<< HEAD
=======
// src/components/Admin/BroadcastTab.jsx
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import apiClient from "../../utils/apiClient";

<<<<<<< HEAD
const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
=======
const BASE_URL = "https://studiesmasters-backend.onrender.com";
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc

export default function BroadcastTab() {
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [file, setFile] = useState(null);
  const [logs, setLogs] = useState([]);
  const socketRef = useRef(null);

  // ================= FETCH STUDENTS =================
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await apiClient.get("/admin/students/list");
        const studentArray = res.data.students || [];
<<<<<<< HEAD
        studentArray.sort((a, b) =>
          a.fullName.localeCompare(b.fullName)
        );
=======
        studentArray.sort((a, b) => a.fullName.localeCompare(b.fullName));
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
        setStudents(studentArray);
      } catch (err) {
        console.error("❌ Error fetching students:", err);
      }
    };
<<<<<<< HEAD

=======
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
    fetchStudents();
  }, []);

  // ================= SOCKET =================
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    const socket = io(BASE_URL, { auth: { token } });
    socketRef.current = socket;

<<<<<<< HEAD
    socket.on("new-broadcast", (data) =>
      setLogs((prev) => [data, ...prev])
    );
=======
    socket.on("new-broadcast", (data) => setLogs((prev) => [data, ...prev]));
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc

    return () => socket.disconnect();
  }, []);

  // ================= SEND =================
  const handleSend = async () => {
<<<<<<< HEAD
    if (!subject || !message)
      return alert("Subject and message are required.");
=======
    if (!subject || !message) return alert("Subject and message are required.");
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc

    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("message", message);
      formData.append("link", link);
      if (file) formData.append("attachment", file);

      if (studentId) {
        formData.append("studentId", studentId);
        await apiClient.post("/admin/broadcast/student", formData);
      } else {
        await apiClient.post("/admin/broadcast/all", formData);
      }

      alert("Broadcast sent successfully ✅");

      setSubject("");
      setMessage("");
      setLink("");
      setFile(null);
<<<<<<< HEAD

=======
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
    } catch (err) {
      console.error("❌ Failed to send broadcast:", err);
      alert("Failed to send broadcast");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
<<<<<<< HEAD

      <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
        ✉ Compose Broadcast
      </h2>

      {/* Receiver */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">
          To
        </label>
=======
      <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">✉ Compose Broadcast</h2>

      {/* Receiver */}
      <div>
        <label className="block text-sm font-semibold text-gray-600 mb-1">To</label>
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="w-full border p-2 rounded-md text-black"
        >
          <option value="">All Students</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>
              {s.fullName} | {s.grade}
            </option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div>
<<<<<<< HEAD
        <label className="block text-sm font-semibold text-gray-600 mb-1">
          Subject
        </label>
=======
        <label className="block text-sm font-semibold text-gray-600 mb-1">Subject</label>
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
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
<<<<<<< HEAD
        <label className="block text-sm font-semibold text-gray-600 mb-1">
          Message
        </label>
=======
        <label className="block text-sm font-semibold text-gray-600 mb-1">Message</label>
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
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
<<<<<<< HEAD
        <label className="block text-sm font-semibold text-gray-600 mb-1">
          Optional Link
        </label>
=======
        <label className="block text-sm font-semibold text-gray-600 mb-1">Optional Link</label>
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
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
<<<<<<< HEAD
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
=======
        <label className="block text-sm font-semibold text-gray-600 mb-1">Attachment (Image / PDF)</label>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} className="w-full text-black" />
        {file && <p className="text-sm text-gray-500 mt-1">Attached: {file.name}</p>}
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
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
<<<<<<< HEAD
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

=======
          <h3 className="font-semibold text-gray-700 mb-2">Recent Broadcasts</h3>
          {logs.map((log, i) => (
            <div key={i} className="border p-3 rounded-md mb-2 bg-gray-50">
              <p className="font-bold text-gray-800">{log.subject}</p>
              <p className="text-gray-700">{log.message}</p>
              {log.link && (
                <a href={log.link} target="_blank" className="text-blue-600 underline text-sm">
                  Open Link
                </a>
              )}
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
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
