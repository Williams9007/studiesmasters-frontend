import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const BASE_URL = "https://studiesmasters-backend.onrender.com";

const PaymentFlow = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Get payment data from state or localStorage fallback
  const paymentData =
    location.state || JSON.parse(localStorage.getItem("paymentData")) || {};

  const {
    user = {},
    curriculum = "",
    grade = "",
    package: packageName = "",
    totalAmount = 0,
    subjects = [],
    duration = "",
  } = paymentData;

  const { _id: studentId = "", fullName = "", email = "", phone = "" } = user;

  // Convert subjects array to display names
  const subjectList = Array.isArray(subjects)
    ? subjects.map((s) => (typeof s === "string" ? s : s.name || s.subjectName || ""))
    : [];

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Persist data in case of page refresh
    localStorage.setItem("paymentData", JSON.stringify(paymentData));
  }, [paymentData]);

  // File selection handler
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) setPreview(URL.createObjectURL(selectedFile));
  };

  // Submit payment to backend
  const handleFileUpload = async () => {
    if (!file) {
      setUploadMessage("⚠️ Please upload your payment screenshot first.");
      return;
    }

    setLoading(true);
    setUploadMessage("⏳ Uploading payment proof...");

    try {
      const formData = new FormData();
     formData.append("studentId", studentId);
formData.append("studentName", fullName);
formData.append("curriculum", curriculum);
formData.append("package", packageName); // keep this name as "package"
formData.append("grade", grade);
formData.append("subjects", subjectList.join(",")); // must not be empty
formData.append("amount", totalAmount || 0); // ensure non-empty
formData.append("duration", duration || "3 months"); // ensure non-empty
formData.append("referenceName", `${fullName}-${Date.now()}`);
formData.append("transactionDate", new Date().toISOString());
formData.append("screenshot", file); // file uploade

      const res = await fetch(`${BASE_URL}/api/payments/submit`, {
        method: "POST",
        body: formData,
      });

      // Parse response safely
      const result = await res.json().catch(() => {
        throw new Error("Unexpected server response. Please try again.");
      });

      if (!res.ok) throw new Error(result.message || "Payment submission failed");

      setUploadMessage("✅ Payment submitted successfully!");
      localStorage.setItem("lastPayment", JSON.stringify(result.payment));

      setTimeout(() => {
        navigate("/student/dashboard", { state: { user } });
      }, 1500);
    } catch (err) {
      console.error("Payment submission error:", err);
      setUploadMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-4 sm:p-6 bg-white shadow-md rounded-lg mt-6 sm:mt-10">
      <h2 className="text-xl sm:text-2xl font-bold mb-5 text-center text-blue-700">
        Complete Your Payment
      </h2>

      {/* Student Details */}
      <div className="bg-gray-100 p-3 sm:p-4 rounded-lg mb-5">
        <h3 className="font-semibold text-base sm:text-lg mb-2 border-b pb-1">
          Student Details
        </h3>
        <div className="space-y-1 text-sm sm:text-base">
          <p><strong>Full Name:</strong> {fullName}</p>
          <p><strong>Phone:</strong> {phone}</p>
          <p><strong>Email:</strong> {email}</p>
          <p><strong>Curriculum:</strong> {curriculum}</p>
          <p><strong>Grade:</strong> {grade}</p>
          <p><strong>Package:</strong> {packageName}</p>
          <p><strong>Subjects:</strong> {subjectList.join(", ")}</p>
          <p className="text-base sm:text-lg font-bold mt-2 text-green-700">
            Total Amount: GH₵ {totalAmount}
          </p>
        </div>
      </div>

      {/* MOMO Instructions */}
      <div className="bg-yellow-100 border border-yellow-400 p-3 sm:p-4 rounded mb-5">
        <h3 className="font-bold text-base sm:text-lg mb-2">MOMO PAYMENT INSTRUCTIONS</h3>
        <div className="text-sm sm:text-base space-y-1">
          <p><strong>Number:</strong> 0591586781</p>
          <p><strong>Name:</strong> DANIEL MENSAH WILLIAMS</p>
          <p><strong>Reference:</strong> Student’s Full Name</p>
          <p className="mt-2 italic text-gray-600">After payment, upload your screenshot below ↓</p>
        </div>
      </div>

      {/* File Upload */}
      <div className="mb-3">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="w-full border p-2 rounded text-sm sm:text-base"
        />
      </div>

      {/* Preview */}
      {preview && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Preview:</p>
          <img
            src={preview}
            alt="Payment proof preview"
            className="w-full h-56 object-cover rounded-md border"
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleFileUpload}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm sm:text-base font-medium"
      >
        {loading ? "Uploading..." : "Upload & Continue"}
      </button>

      {/* Upload Message */}
      {uploadMessage && (
        <p className="text-center mt-3 font-semibold text-sm text-gray-700">{uploadMessage}</p>
      )}
    </div>
  );
};

export default PaymentFlow;
