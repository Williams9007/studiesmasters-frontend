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
  const selectedPackage = location.state?.packageName || "GES-EC";

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    grade: "",
    subjects: [],
  });

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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

  const packageKey = selectedPackage.toUpperCase().replace(/^CAM-/, "CAMBRIDGE-");

  // ===================== FETCH SUBJECTS =====================
  useEffect(() => {
    if (!formData.grade) {
      setSubjects([]);
      return;
    }

    const fetchSubjects = async () => {
      setSubjectsLoading(true);
      try {
        // Construct URL properly
        const gradeEncoded = encodeURIComponent(formData.grade);
        const packageEncoded = encodeURIComponent(packageKey);
        const url = `https://studiesmasters-backend-2.onrender.com/api/subjects/by-package/${packageEncoded}?grade=${gradeEncoded}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch subjects: ${res.status}`);

        const data = await res.json();
        setSubjects(data);
      } catch (err) {
        console.error("Error fetching subjects:", err);
        setError("Unable to fetch subjects. Try again later.");
        setSubjects([]);
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchSubjects();
  }, [formData.grade, packageKey]);

  // ===================== CALCULATE TOTAL =====================
  useEffect(() => {
    const total = formData.subjects.reduce((sum, sId) => {
      const s = subjects.find((x) => x._id === sId);
      return sum + (s?.price || 0);
    }, 0);
    setTotalAmount(total);
  }, [formData.subjects, subjects]);

  // ===================== HANDLE SUBMIT =====================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        curriculum: selectedCurriculum,
        package: packageKey,
        totalAmount,
      };

      const res = await fetch("https://studiesmasters-backend-2.onrender.com/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");

      localStorage.setItem("user", JSON.stringify(data.user));

      const selectedSubjectDetails = subjects.filter((s) => formData.subjects.includes(s._id));
      const paymentData = {
        user: data.user,
        role,
        curriculum: selectedCurriculum,
        package: packageKey,
        grade: formData.grade,
        subjects: selectedSubjectDetails,
        totalAmount,
        duration: location.state?.duration || "Not specified",
      };
      localStorage.setItem("paymentData", JSON.stringify(paymentData));
      navigate("/payment", { state: paymentData });

    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const gradesToShow = gradeOptionsByPackage[packageKey] || curriculumGrades[selectedCurriculum] || [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center relative">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="absolute left-4 top-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div className="mt-4">
            <CardTitle className="text-2xl capitalize">{role} Signup</CardTitle>
            <CardDescription>Create your account to get started</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <InputWrapper label="Full Name" val={formData.fullName} cb={(v) => setFormData({ ...formData, fullName: v })} />
            <InputWrapper label="Email" type="email" val={formData.email} cb={(v) => setFormData({ ...formData, email: v })} />
            <InputWrapper label="Phone" val={formData.phone} cb={(v) => setFormData({ ...formData, phone: v })} />
            <InputWrapper label="Password" type="password" val={formData.password} cb={(v) => setFormData({ ...formData, password: v })} />

            <div>
              <Label>Grade / Level</Label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg p-2"
              >
                <option value="">Select Grade</option>
                {gradesToShow.map((g, i) => (
                  <option key={`${g}-${i}`} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Select Subjects (2–3)</Label>
              {subjectsLoading ? (
                <p className="text-sm text-gray-500">Loading subjects...</p>
              ) : subjects.length < 1 ? (
                <p className="text-sm text-gray-500">No subjects found for this grade</p>
              ) : (
                <select
                  multiple
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: Array.from(e.target.selectedOptions, o => o.value) })}
                  required
                  className="w-full border rounded-lg p-2"
                >
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} — ¢{s.price}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Hold Ctrl (Windows) or Cmd (Mac) to select multiple.
              </p>
            </div>

            <div className="text-lg font-semibold mt-2">Total Amount: ¢{totalAmount}</div>

            <Button
              type="submit"
              className="w-full mt-2"
              disabled={loading || subjectsLoading || (role === "student" && (formData.subjects.length < 2 || formData.subjects.length > 3))}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function InputWrapper({ label, val, cb, type = "text" }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={val} type={type} onChange={(e) => cb(e.target.value)} required />
    </div>
  );
}
