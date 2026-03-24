"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "@/utils/apiClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input"; // optional, only if needed
import { User, BookOpen, Bell, Upload } from "lucide-react";
import { io } from "socket.io-client";

export function StudentDashboard() {
  const [studentData, setStudentData] = useState(null);
  const [broadcasts, setBroadcasts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [typedAnswers, setTypedAnswers] = useState({});
  const [fileAnswers, setFileAnswers] = useState({});

  const navigate = useNavigate();
  const socketRef = useRef(null);

  const addNotification = (broadcast) => {
    const note = {
      id: broadcast._id || Date.now(),
      subjectName: broadcast.subjectName || "General",
      message: broadcast.message,
      sender: broadcast.sender || { fullName: "Admin" },
      createdAt: broadcast.createdAt || new Date(),
      open: false,
    };

    setNotifications((prev) => [note, ...prev]);
    setBroadcasts((prev) => [note, ...prev]);
  };

  // ================= FETCH STUDENT DATA =================
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return navigate("/login");

        // fetch student info
        const { data } = await apiClient.get("/students/me");
        const student = data.user || data;
        setStudentData(student);

        // fetch broadcasts
        const broadcastsRes = await apiClient.get(`/students/broadcasts/${student._id}`);
        const fetchedBroadcasts = broadcastsRes.data.broadcasts.map((b) => ({ ...b, open: false }));
        setBroadcasts(fetchedBroadcasts);
        fetchedBroadcasts.forEach((b) => addNotification(b));

        // fetch assignments
        const assignmentRes = await apiClient.get(`/students/assignments/${student._id}`);
        setAssignments(Array.isArray(assignmentRes.data) ? assignmentRes.data : []);

        // fetch subjects
        const subjectRes = await apiClient.get(`/students/subjects/${student._id}`);
        setSubjects(Array.isArray(subjectRes.data) ? subjectRes.data : subjectRes.data.subjects || []);

        // fetch payments
        const paymentRes = await apiClient.get(`/students/payments/${student._id}`);
        setPayments(Array.isArray(paymentRes.data) ? paymentRes.data : []);

        // welcome notification
        addNotification({
          subjectName: "Welcome",
          message: `Welcome back, ${student.fullName || "Student"}! 👋`,
        });

        setLoading(false);
      } catch (err) {
        console.error("❌ Error fetching student data:", err);
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [navigate]);

  // ================= SOCKET.IO =================
  useEffect(() => {
    if (!studentData?._id) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const socket = io(
      import.meta.env.VITE_API_URL || "https://studiesmasters-backend.onrender.com",
      {
        auth: { token, role: "student" },
        transports: ["websocket"],
      }
    );
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🟢 Student connected:", socket.id);
    });

    socket.on("broadcast:new", (data) => {
      console.log("📢 New broadcast received:", data);
      addNotification(data);
    });

    return () => socket.disconnect();
  }, [studentData?._id]);

  // ================= HANDLE ASSIGNMENT SUBMISSION =================
  const handleSubmitAssignment = async (assignmentId) => {
    try {
      const formData = new FormData();
      if (typedAnswers[assignmentId]) formData.append("typedAnswer", typedAnswers[assignmentId]);
      if (fileAnswers[assignmentId]) formData.append("file", fileAnswers[assignmentId]);

      const res = await apiClient.post(`/students/assignments/submit/${assignmentId}`, formData);
      alert(res.data.message || "Assignment submitted!");
      // Clear local state
      setTypedAnswers((prev) => ({ ...prev, [assignmentId]: "" }));
      setFileAnswers((prev) => ({ ...prev, [assignmentId]: null }));
    } catch (err) {
      console.error(err);
      alert("Failed to submit assignment");
    }
  };

  if (loading) return <p className="text-center mt-10">Loading dashboard...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 relative">
      {/* HEADER */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                EduConnect
              </h1>
              <p className="text-sm text-gray-600">Student Portal</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative">
                <Bell className="h-6 w-6 text-gray-700" />
                {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white shadow-md rounded-lg border border-gray-100 z-50">
                  {notifications.length ? (
                    notifications.slice(0, 5).map((note) => (
                      <div
                        key={note.id}
                        className="p-3 border-b border-gray-100 text-sm text-gray-700 cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setShowNotifications(false);
                          document.querySelector('[data-value="broadcasts"]')?.click();
                          setBroadcasts((prev) =>
                            prev.map((b) => (b.id === note.id ? { ...b, open: true } : b))
                          );
                        }}
                      >
                        <p className="font-semibold">{note.subjectName}</p>
                        <p>{note.message}</p>
                        <p className="text-xs text-gray-400">{new Date(note.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="p-3 text-sm text-gray-500 text-center">No notifications</p>
                  )}
                </div>
              )}
            </div>

            <div className="text-center sm:text-right">
              <p className="font-semibold text-gray-900">{studentData.fullName || "Student"}</p>
              <p className="text-sm text-gray-600 truncate max-w-[150px] sm:max-w-full">{studentData.email}</p>
            </div>

            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <User className="h-6 w-6 text-white" />
            </div>

            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/");
              }}
              className="hover:bg-red-50 hover:text-red-600"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* TABS */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 gap-1 bg-white rounded-lg shadow-sm overflow-x-auto whitespace-nowrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="broadcasts">Inbox</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <Card className="shadow-md p-4 sm:p-6">
              <CardHeader>
                <CardTitle>Welcome, {studentData.fullName || "Student"}!</CardTitle>
                <CardDescription>Your personalized EduConnect dashboard.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                  Curriculum: {studentData.curriculum || "N/A"} <br />
                  Grade: {studentData.grade || "N/A"} <br />
                  Duration: {studentData.studyDuration || "N/A"} <br />
                  Package: {studentData.package || "N/A"}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subjects */}
          <TabsContent value="subjects">
            <Card className="shadow-md p-4 sm:p-6">
              <CardHeader>
                <CardTitle>Your Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                {subjects.length ? (
                  <ul className="list-disc pl-4 space-y-2 text-sm sm:text-base">
                    {subjects.map((s) => (
                      <li key={s._id}>
                        {s.name} - <span className="font-semibold text-blue-700">₵{s.price}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm sm:text-base">No subjects assigned.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Broadcasts */}
          <TabsContent value="broadcasts">
            <Card className="shadow-md p-4 sm:p-6">
              <CardHeader>
                <CardTitle>📥 Inbox</CardTitle>
                <CardDescription>Click to expand messages</CardDescription>
              </CardHeader>
              <CardContent>
                {broadcasts.length ? (
                  <ul className="space-y-3">
                    {broadcasts.map((b) => (
                      <li key={b.id} className="border rounded-lg p-3 hover:bg-gray-50">
                        <div
                          className="flex justify-between items-center cursor-pointer"
                          onClick={() =>
                            setBroadcasts((prev) =>
                              prev.map((item) => (item.id === b.id ? { ...item, open: !item.open } : item))
                            )
                          }
                        >
                          <div>
                            <p className="font-semibold">{b.subjectName}</p>
                            <p className="text-xs text-gray-500">
                              From: {b.sender?.fullName || "Admin"} | {new Date(b.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span className="text-gray-400">{b.open ? "−" : "+"}</span>
                        </div>
                        {b.open && <div className="mt-2 text-sm text-gray-700">{b.message}</div>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No messages available.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments">
            <Card className="shadow-md p-4 sm:p-6">
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {assignments.length ? (
                  assignments.map((a) => (
                    <Card key={a._id} className="p-3 border rounded-md shadow-sm">
                      <p className="font-semibold">{a.title}</p>
                      <p className="text-sm text-gray-600">{a.description}</p>
                      <Textarea
                        placeholder="Type your answer here..."
                        value={typedAnswers[a._id] || ""}
                        onChange={(e) =>
                          setTypedAnswers((prev) => ({ ...prev, [a._id]: e.target.value }))
                        }
                        className="mt-2 w-full"
                      />
                      <input
                        type="file"
                        onChange={(e) =>
                          setFileAnswers((prev) => ({ ...prev, [a._id]: e.target.files[0] }))
                        }
                        className="mt-2"
                      />
                      <Button
                        onClick={() => handleSubmitAssignment(a._id)}
                        className="mt-2"
                      >
                        Submit Assignment
                      </Button>
                    </Card>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No assignments assigned.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments">
            <Card className="shadow-md p-4 sm:p-6">
              <CardHeader>
                <CardTitle>Payments</CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length ? (
                  <ul className="list-disc pl-4 space-y-2 text-sm sm:text-base">
                    {payments.map((p) => (
                      <li key={p._id}>
                        Amount: ₵{p.amount} | Package: {p.package} | Status:{" "}
                        <span
                          className={`font-semibold ${
                            p.status === "approved"
                              ? "text-green-600"
                              : p.status === "pending"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-sm">No payments recorded.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default StudentDashboard;
