"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { Textarea } from "./ui/textarea";
import { Menu } from "@headlessui/react";
import { BookOpen, User, CheckCircle, AlertCircle, Clock, Upload } from "lucide-react";
import { apiClient } from "../utils/api";
import { formatCurrency } from "./ui/formatCurrency";

export function StudentDashboard({ user, onLogout, onPayment }) {
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submissionText, setSubmissionText] = useState("");
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [avatarImage, setAvatarImage] = useState(null);

  // Fetch all dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, assignRes, payRes] = await Promise.all([
          apiClient.get("/student/subjects"),
          apiClient.get("/student/assignments"),
          apiClient.get("/student/payments"),
        ]);

        setSubjects(subRes.data);
        setAssignments(assignRes.data);
        setPayments(payRes.data);
      } catch (err) {
        console.error("Failed to load dashboard data", err.response?.data || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Submit assignment
  const handleSubmitAssignment = async (assignmentId) => {
    if (!submissionText.trim()) return alert("Please enter your assignment submission");

    setSubmittingAssignment(assignmentId);
    try {
      await apiClient.post("/student/assignments/submit", {
        assignmentId,
        submission: submissionText,
      });

      setSubmissionText("");
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignmentId ? { ...a, status: "submitted" } : a))
      );
      alert("Assignment submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit assignment. Try again.");
    } finally {
      setSubmittingAssignment(null);
    }
  };

  // Payment confirm
  const handleConfirmPayment = () => {
    if (!paymentScreenshot) return alert("Please upload a screenshot first!");
    alert("Payment confirmed! Receipt generated.");
    setPaymentScreenshot(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "submitted": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      default: return "bg-yellow-100 text-yellow-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "submitted": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "overdue": return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-soft border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">EduConnect</h1>
              <p className="text-sm text-gray-600">Student Portal</p>
            </div>
          </div>

          {/* Avatar menu */}
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              {avatarImage ? (
                <img src={avatarImage} alt="avatar" className="rounded-full w-full h-full object-cover"/>
              ) : (
                <User className="h-6 w-6 text-white" />
              )}
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-56 bg-white shadow-lg rounded-md p-2 z-50">
              <Menu.Item>
                {({ active }) => (
                  <label className={`cursor-pointer block px-2 py-1 rounded ${active ? "bg-gray-100" : ""}`}>
                    Upload Avatar
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setAvatarImage(URL.createObjectURL(e.target.files[0]))}
                    />
                  </label>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    className={`w-full text-left px-2 py-1 rounded ${active ? "bg-gray-100" : ""}`}
                    onClick={onLogout}
                  >
                    Logout
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-soft rounded-lg p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">My Subjects</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="shadow-medium">
                <CardHeader><CardTitle>Enrolled Subjects</CardTitle></CardHeader>
                <CardContent>{subjects.length}</CardContent>
              </Card>

              <Card className="shadow-medium">
                <CardHeader><CardTitle>Pending Assignments</CardTitle></CardHeader>
                <CardContent>{assignments.filter(a => a.status === "pending").length}</CardContent>
              </Card>

              <Card className="shadow-medium">
                <CardHeader><CardTitle>Payments Pending</CardTitle></CardHeader>
                <CardContent>{payments.filter(p => p.status === "pending").length}</CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* My Subjects */}
          <TabsContent value="subjects">
            <div className="grid gap-6">
              {subjects.slice(0,2).map((s) => (
                <Card key={s.id} className="shadow-medium">
                  <CardHeader>
                    <CardTitle>{s.name}</CardTitle>
                    <CardDescription>Teacher: {s.teacher}</CardDescription>
                    <CardDescription>Time: {s.time}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={s.progress} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Assignments */}
          <TabsContent value="assignments">
            <div className="space-y-6">
              {assignments.sort((a,b) => new Date(a.deadline) - new Date(b.deadline)).map((a) => (
                <Card key={a.id} className="shadow-medium">
                  <CardHeader>
                    <CardTitle>{a.title}</CardTitle>
                    <CardDescription>{a.subject}</CardDescription>
                    <CardDescription>Deadline: {a.deadline}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(a.status)}
                      <span className={getStatusColor(a.status)}>{a.status}</span>
                    </div>

                    {a.status === "pending" && (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          placeholder="Type your submission..."
                          value={submissionText}
                          onChange={(e) => setSubmissionText(e.target.value)}
                        />
                        <input type="file" accept="image/*" />
                        <input type="file" accept=".pdf,.doc,.docx" />
                        <Button
                          onClick={() => handleSubmitAssignment(a.id)}
                          disabled={submittingAssignment === a.id}
                        >
                          Submit
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments">
            <div className="space-y-4">
              <Card className="shadow-medium p-4">
                <h3 className="font-bold mb-2">MoMo Payment Instructions</h3>
                <p>Recipient Number: 0123456789</p>
                <p>Recipient Name: DANIEL MENSAH WILLIAMS</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPaymentScreenshot(e.target.files[0])}
                />
                <Button className="mt-2" onClick={handleConfirmPayment}>
                  Confirm Payment
                </Button>
              </Card>

              {payments.map((p, i) => (
                <Card key={i} className="shadow-medium">
                  <CardHeader>
                    <CardTitle>{p.subject}</CardTitle>
                    <CardDescription>{p.date}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <span className="font-bold">{formatCurrency(p.amount)}</span>
                    {p.status === "pending" ? (
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">Paid</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
