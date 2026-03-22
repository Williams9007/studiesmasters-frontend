"use client";
import { useEffect, useState } from "react";
import apiClient from "../../utils/apiClient";

export default function PaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await apiClient.get("/admin/payments");
      setPayments(res.data.payments || []);
    } catch (err) {
      console.error("Error fetching payments", err);
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (id) => {
    try {
      await apiClient.put(`/admin/payments/${id}/confirm`);
      fetchPayments();
    } catch (err) {
      console.error("Error confirming payment", err);
    }
  };

  const rejectPayment = async (id) => {
    try {
      await apiClient.put(`/admin/payments/${id}/reject`);
      fetchPayments();
    } catch (err) {
      console.error("Error rejecting payment", err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        💳 Payment Records
      </h2>

      {loading ? (
        <p className="text-gray-500">Loading payments...</p>
      ) : payments.length === 0 ? (
        <p className="text-gray-500">No payments found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-left">
                <th className="p-3">Student</th>
                <th className="p-3">Curriculum</th>
                <th className="p-3">Package</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-3 font-medium text-gray-800">
                    {p.studentId?.fullName || "Unknown"}
                  </td>

                  <td className="p-3">{p.curriculum}</td>
                  <td className="p-3">{p.package}</td>

                  <td className="p-3 font-semibold text-blue-600">
                    ₵{p.amount}
                  </td>

                  <td className="p-3">
                    {p.transactionDate
                      ? new Date(p.transactionDate).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="p-3">
                    {p.status === "pending" && (
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                        Pending
                      </span>
                    )}
                    {p.status === "confirmed" && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        Confirmed
                      </span>
                    )}
                    {p.status === "rejected" && (
                      <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                        Rejected
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    {p.status === "pending" ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => confirmPayment(p._id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-xs transition"
                        >
                          Confirm
                        </button>

                        <button
                          onClick={() => rejectPayment(p._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs transition"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        No actions
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
