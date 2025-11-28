import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft, GraduationCap } from "lucide-react";

export function AuthForm() {
  const navigate = useNavigate();
  const location = useLocation();

  const role = location.state?.role || "student";
  const selectedCurriculum = (location.state?.curriculum || "GES").toUpperCase();
  const selectedPackage = (location.state?.packageName || "GES-EC").toUpperCase();

  // ===================== Backend URL =====================
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://studiesmasters-backend-2.onrender.com";

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    grade: "",
    subjects: [],
  });

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);

  const curriculumGrades = {
    GES: ["Basic 4","Basic 5","Basic 6","JHS 1","JHS 2","JHS 3","SHS 1","SHS 2","SHS 3"],
    CAMBRIDGE: ["Stage 4","Stage 5","Stage 6","Stage 7","Stage 8","Stage 9","Stage 10","Stage 11","Stage 12","Stage 13"],
  };

  const gradeOptionsByPackage = {
    "GES-EC": curriculumGrades.GES,
    "GES-WC": curriculumGrades.GES,
    "GES-EPC": ["BECE", "WASSCE", "NOVDEC"],
    "GES-VC": ["SHS 1","SHS 2","SHS 3"],
    "GES-SC": ["Basic 4","Basic 5","Basic 6","JHS 1","JHS 2","JHS 3"],
    "CAMBRIDGE-EC": curriculumGrades.CAMBRIDGE,
    "CAMBRIDGE-WC": curriculumGrades.CAMBRIDGE,
    "CAMBRIDGE-OC": curriculumGrades.CAMBRIDGE,
  };

  const gradesToShow = gradeOptionsByPackage[selectedPackage] || [];

  // ===================== Fetch subjects =====================
  useEffect(() => {
    if (!formData.grade) return;

    const fetchSubjects = async () => {
      setSubjectsLoading(true);
      setError("");

      try {
        const url = `${BACKEND_URL}/api/subjects/by-package/${selectedPackage}?grade=${encodeURIComponent(formData.grade)}`;
        const res = await fetch(url);

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text); // Try parsing JSON
        } catch {
          throw new Error("Backend did not return JSON. Check URL or server.");
        }

        if (!res.ok) throw new Error(data.message || "Failed to fetch subjects");
        setSubjects(data);
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setError(err.message);
        setSubjects([]);
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchSubjects();
  }, [formData.grade, selectedPackage, BACKEND_URL]);

  // ===================== Calculate total =====================
  useEffect(() => {
    const total = formData.subjects.reduce((sum, id) => {
      const s = subjects.find((x) => x._id === id);
      return sum + (s?.price || 0);
    }, 0);
    setTotalAmount(total);
  }, [formData.subjects, subjects]);

  // ===================== Handle submit =====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        curriculum: selectedCurriculum,
        package: selectedPackage,
        totalAmount,
      };

      const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Signup failed: Backend did not return JSON");
      }

      if (!res.ok) throw new Error(data.message || "Signup failed");

      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/payment", {
        state: {
          user: data.user,
          ...payload,
          subjects: subjects.filter((s) => formData.subjects.includes(s._id)),
        },
      });
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center relative">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="absolute left-4 top-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>

          <CardTitle className="text-2xl mt-4 capitalize">{role} Signup</CardTitle>
          <CardDescription>Create your account to get started</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && <p className="text-red-600 text-center text-sm">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField label="Full Name" value={formData.fullName} onChange={(v) => setFormData({ ...formData, fullName: v })} />
            <InputField label="Email" type="email" value={formData.email} onChange={(v) => setFormData({ ...formData, email: v })} />
            <InputField label="Phone" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} />
            <InputField label="Password" type="password" value={formData.password} onChange={(v) => setFormData({ ...formData, password: v })} />

            <div>
              <Label>Grade / Level</Label>
              <select
                required
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full border rounded-lg p-2"
              >
                <option value="">Select Grade</option>
                {gradesToShow.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Select Subjects (2–3)</Label>
              {subjectsLoading ? (
                <p className="text-sm">Loading subjects...</p>
              ) : (
                <select
                  multiple
                  required
                  className="w-full border rounded-lg p-2"
                  value={formData.subjects}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subjects: Array.from(e.target.selectedOptions, (o) => o.value),
                    })
                  }
                >
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} — ¢{s.price}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="text-lg font-semibold">Total Amount: ¢{totalAmount}</div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing up..." : "Sign Up"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text" }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={value} required onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
