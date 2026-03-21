// src/components/admin/DashboardPayments.jsx
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient.js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

export default function DashboardPayments() {
  const [payments, setPayments] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/payments/admin/history");
      setPayments(res.data.payments || []);
      setTotalAmount(res.data.totalAmount || 0);
      setError(null);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError(err.response?.data?.message || "Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Prepare data for bar chart: sum payments per student
  const chartData = payments.reduce((acc, p) => {
    const student = p.studentId?.fullName || "Unknown";
    const existing = acc.find(a => a.name === student);
    if (existing) existing.amount += Number(p.amount || 0);
    else acc.push({ name: student, amount: Number(p.amount || 0) });
    return acc;
  }, []);

  if (loading) return <p className="text-center mt-10">Loading payments...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-6">
      {/* Total Payments Card */}
      <div className="bg-white p-6 rounded-2xl shadow text-center">
        <h2 className="text-gray-500 text-sm mb-2">Total Payments</h2>
        <p className="text-3xl font-bold">{totalAmount.toLocaleString()} GHS</p>
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-gray-500 text-sm mb-4">Payments by Student</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value) => `${value.toLocaleString()} GHS`} />
            <Bar dataKey="amount" fill="#4F46E5" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payments Table */}
      <div className="bg-white p-6 rounded-2xl shadow overflow-x-auto">
        <h2 className="text-gray-500 text-sm mb-4">Payment History</h2>
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-4 py-2 border">Student</th>
              <th className="px-4 py-2 border">Package</th>
              <th className="px-4 py-2 border">Amount (GHS)</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Transaction Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{p.studentId?.fullName}</td>
                <td className="px-4 py-2 border">{p.package}</td>
                <td className="px-4 py-2 border">{Number(p.amount).toLocaleString()}</td>
                <td className="px-4 py-2 border">{p.status}</td>
                <td className="px-4 py-2 border">{new Date(p.transactionDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
