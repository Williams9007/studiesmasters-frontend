// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import apiClient from "./utils/apiClient"; // ✅ default import

// Pages
import LandingPage from "./components/landing-page.jsx";
import LoginPage from "./components/LoginPage.jsx";
import FreeTrialClass from "./components/FreeTrialClass.jsx";
import { StudentDashboard } from "./components/student-dashboard.jsx";
import { StudentRegistrationForm } from "./components/auth-form-updated.jsx";
import PaymentPage from "./components/payment-flow.jsx";
import { AccountSettings } from "./components/AccountSettings.jsx";
import ForgetPasswordPage from "./components/ForgetPasswordPage.jsx";
import ResetPasswordPage from "./components/ResetPasswordPage.jsx";
import ErrorBoundary from "./components/error-boundary.jsx";
import PolicyPage from "./components/PolicyPage.jsx";
import TutorManagerDashboard from "./components/qao-dashboard.jsx";
import TutorManagerAccess from "./components/qao-access.jsx";
import { TeacherDashboard } from "./components/teacher-dashboard.jsx";
import AdminDashboard from "./components/admin-dashboard.jsx";
import AdminLogin from "./components/admin-login.jsx";
import AdminVerifyOtp from "./components/AdminVerifyOtp.jsx";
import PrivateAdminRoute from "./utils/PrivateAdminRoute.jsx";

function App() {
  // Signup using apiClient
  const handleSignup = async (data) => {
    try {
      const res = await apiClient.post("/auth/register", data); // relative path only
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user._id);
      return res.data;
    } catch (err) {
      console.error("❌ Backend signup error:", err.response?.data || err.message);
      throw err.response ? new Error(err.response.data.message) : err;
    }
  };

  // Login using apiClient
  const handleLogin = async (data) => {
    try {
      const res = await apiClient.post("/auth/login", data);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.user._id);
      return res.data;
    } catch (err) {
      console.error("❌ Backend login error:", err.response?.data || err.message);
      throw err.response ? new Error(err.response.data.message) : err;
    }
  };

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<StudentRegistrationForm />} />
        <Route path="/register-course/:role" element={<Navigate to="/register" replace />} />
        <Route path="/auth-form/:role" element={<Navigate to="/register" replace />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/forget-password" element={<ForgetPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/qao/dashboard" element={<TutorManagerDashboard />} />
        <Route path="/qao/access" element={<TutorManagerAccess />} />

        {/* Admin login & OTP */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin/verify-otp" element={<AdminVerifyOtp />} />

        {/* Protected routes */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/teacher/dashboard/:id" element={<TeacherDashboard />} />
        <Route path="/account-settings" element={<AccountSettings />} />

        {/* Admin protected dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <PrivateAdminRoute>
              <AdminDashboard />
            </PrivateAdminRoute>
          }
        />

        <Route path="/policies" element={<PolicyPage />} />
        <Route path="/free-trial" element={<FreeTrialClass />} />

        {/* Convenience redirect */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Fallback */}
        <Route path="*" element={<div className="p-6">Page Not Found</div>} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
