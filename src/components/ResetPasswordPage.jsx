import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import apiClient from "../utils/apiClient";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const roleParam = searchParams.get("role");
  const roleFromLink = roleParam === "teacher" ? "teacher" : roleParam === "student" ? "student" : "student";
  const [role, setRole] = useState(roleFromLink);
  const roleLocked = roleParam !== null;
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      alert("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        role === "teacher"
          ? `/teachers/reset-password/${token}`
          : `/students/reset-password/${token}`;

      const response = await apiClient.post(endpoint, { newPassword });

      if (response.status === 200) {
        alert(response.data.message || "âœ… Password reset successful! You can now log in.");
        navigate("/login");
      } else {
        alert(response.data.message || "âŒ Reset failed, please try again.");
      }
    } catch (err) {
      console.error("Reset password error:", err.response?.data || err.message || err);
      alert(err.response?.data?.message || "Something went wrong. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-4 py-14">
      <motion.div
        className="pointer-events-none absolute left-[-80px] top-20 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute right-[-80px] top-36 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl"
        animate={{ x: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-10 mx-auto h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative mx-auto w-full max-w-lg overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl"
      >
        <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 px-8 py-7 text-white">
          <div className="flex items-center gap-4">
            <motion.div
              className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/15 text-3xl shadow-lg shadow-slate-950/30"
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              ðŸ”
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-semibold text-white">Reset your password</CardTitle>
              <p className="mt-2 text-sm text-slate-100 max-w-xl">
                Use the secure link from your reset email to update your password for your StudiesMasters account.
              </p>
            </div>
          </div>
        </div>

        <CardContent className="px-8 py-8">
          <form onSubmit={handleResetPassword} className="space-y-6">
            <motion.div
              className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl shadow-slate-950/20"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <label className="block text-sm font-semibold text-slate-200 mb-3">
                Reset password as
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                disabled={roleLocked}
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              {roleLocked && (
                <p className="mt-2 text-xs text-slate-500">
                  This role was selected from your reset link.
                </p>
              )}
            </motion.div>

            <motion.div
              className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl shadow-slate-950/20"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <label className="block text-sm font-semibold text-slate-200 mb-3">
                New Password
              </label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
              />
            </motion.div>

            <motion.div
              className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 shadow-xl shadow-slate-950/20"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <label className="block text-sm font-semibold text-slate-200 mb-3">
                Confirm Password
              </label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
              />
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Button
                type="submit"
                className="w-full rounded-3xl bg-gradient-to-r from-sky-500 via-indigo-600 to-violet-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-slate-950/30 transition duration-200 hover:brightness-110"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </motion.div>
    </div>
  );
}
