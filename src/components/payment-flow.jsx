<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, LockKeyhole, WalletCards } from "lucide-react";

const BASE_URL = (import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? "http://localhost:5000" : "https://studiesmasters-backend.onrender.com")).replace(/\/$/, "");
const money = (amount) => `GH¢ ${Number(amount || 0).toLocaleString()}`;

const loadPaystack = () => new Promise((resolve, reject) => {
  if (window.PaystackPop) return resolve();
  const script = document.createElement("script");
  script.src = "https://js.paystack.co/v1/inline.js";
  script.onload = resolve;
  script.onerror = () => reject(new Error("Unable to load Paystack checkout."));
  document.body.appendChild(script);
});

export default function PaymentFlow() {
  const location = useLocation();
  const navigate = useNavigate();
  const paymentData = location.state || JSON.parse(localStorage.getItem("paymentData") || "{}");
  const user = paymentData.user || paymentData.student || paymentData;
  const [receipt, setReceipt] = useState(null);
  const [plans, setPlans] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(paymentData.package || paymentData.plan || "");
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [purpose, setPurpose] = useState(() => (paymentData.payments || []).some((payment) => payment.status === "confirmed") ? "renewal" : "new");
  const [method, setMethod] = useState("mobile_money");
  const [momoNumber, setMomoNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const studentId = user?._id || user?.id || "";
  const studentUserId = receipt?.userId || user?.userId || "";
  const curriculum = receipt?.curriculum || paymentData.curriculum || user?.curriculum || "";
  const grade = receipt?.grade || paymentData.grade || user?.grade || "";
  const email = receipt?.email || user?.email || "";
  const studentName = receipt?.fullName || user?.fullName || "";
  const phone = receipt?.phone || user?.phone || "";
  const subjects = useMemo(() => (receipt?.subjects || paymentData.subjects || user?.subjectNames || []).map((item) => typeof item === "string" ? item : item.name || item.subjectName).filter(Boolean), [receipt, paymentData.subjects, user?.subjectNames]);
  const confirmedPayment = (paymentData.payments || []).find((payment) => payment.status === "confirmed");
  const plan = plans.find((item) => item.name === selectedPlan);
  const upgradeTotal = (plan?.price || 0) + selectedAddOns.reduce((total, name) => total + (addOns.find((item) => item.name === name)?.price || 0), 0);
  const displayedTotal = purpose === "renewal" ? Number(confirmedPayment?.amount || 0) : upgradeTotal;

  useEffect(() => { localStorage.setItem("paymentData", JSON.stringify(paymentData)); }, [paymentData]);
  useEffect(() => {
    if (!studentId) return;
    fetch(`${BASE_URL}/api/students/${studentId}/payment-summary`).then((response) => response.ok ? response.json() : null).then((data) => data?.student && setReceipt(data.student)).catch(() => {});
  }, [studentId]);
  useEffect(() => {
    if (!curriculum) return;
    fetch(`${BASE_URL}/api/payments/plans/${encodeURIComponent(curriculum)}`).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => {
      setPlans(data.plans || []); setAddOns(data.addOns || []); setSelectedPlan((value) => value || data.plans?.[0]?.name || "");
    }).catch(() => setMessage("Unable to load your curriculum's plans."));
  }, [curriculum]);

  const verify = async (reference) => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/payments/paystack/verify/${encodeURIComponent(reference)}`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Payment verification failed.");
      setMessage("Payment confirmed. Your learning plan is active.");
      setTimeout(() => navigate("/student/dashboard", { replace: true }), 1200);
    } catch (error) { setMessage(error.message); } finally { setLoading(false); }
  };
  useEffect(() => { const reference = new URLSearchParams(location.search).get("reference"); if (reference) verify(reference); }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  const pay = async () => {
    if (!studentId || !studentName || !email || !selectedPlan || !subjects.length) return setMessage("Your student details are incomplete.");
    if (purpose === "renewal" && !confirmedPayment) return setMessage("No confirmed prior payment is available to renew.");
    if (method === "mobile_money" && momoNumber.replace(/\D/g, "").length < 10) return setMessage("Enter a valid mobile-money number.");
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`${BASE_URL}/api/payments/paystack/initialize`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        studentId, studentName, email, phone, curriculum, grade, package: selectedPlan, subjects, paymentPurpose: purpose,
        addOns: purpose === "upgrade" ? selectedAddOns : [], paymentMethod: method, channels: method === "card" ? ["card"] : ["mobile_money"],
        callbackUrl: `${window.location.origin}/payment`, metadata: { mobileMoneyNumber: momoNumber.replace(/\D/g, "") },
      }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to start Paystack checkout.");
      await loadPaystack();
      window.PaystackPop.setup({ key: result.publicKey, email, amount: Math.round(Number(result.amount) * 100), currency: "GHS", ref: result.reference, channels: method === "card" ? ["card"] : ["mobile_money"], callback: ({ reference }) => verify(reference), onClose: () => { setLoading(false); setMessage("Payment window closed. No payment was taken."); } }).openIframe();
    } catch (error) { setMessage(error.message); setLoading(false); }
  };
  const toggleAddOn = (name) => setSelectedAddOns((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);

  return <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900"><section className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-white shadow-xl"><header className="bg-gradient-to-r from-slate-950 to-blue-700 px-6 py-8 text-white"><button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-2 text-sm text-blue-100"><ArrowLeft size={16} />Back</button><h1 className="text-3xl font-bold">Manage your learning plan</h1><p className="mt-2 text-blue-100">Renew at your saved price or upgrade with curriculum-specific add-ons.</p></header><div className="grid gap-7 p-6 md:grid-cols-2"><section><h2 className="text-lg font-bold">Choose an action</h2><div className="mt-3 grid gap-2"><button onClick={() => { setPurpose("renewal"); setSelectedAddOns([]); }} className={`rounded-xl border p-4 text-left ${purpose === "renewal" ? "border-blue-600 bg-blue-50" : "border-slate-200"}`}><b>Renew current plan</b><span className="mt-1 block text-sm text-slate-500">Your most recent confirmed price remains {money(confirmedPayment?.amount)}.</span></button><button onClick={() => setPurpose("upgrade")} className={`rounded-xl border p-4 text-left ${purpose === "upgrade" ? "border-blue-600 bg-blue-50" : "border-slate-200"}`}><b>Upgrade plan</b><span className="mt-1 block text-sm text-slate-500">Select a new plan and optional add-ons.</span></button></div><h2 className="mt-6 text-lg font-bold">Plans for {curriculum || "your curriculum"}</h2><div className="mt-3 space-y-2">{plans.map((item) => <label key={item.name} className={`flex justify-between rounded-xl border p-4 ${selectedPlan === item.name ? "border-blue-600 bg-blue-50" : "border-slate-200"}`}><span><input disabled={purpose === "renewal"} className="mr-2 accent-blue-600" type="radio" checked={selectedPlan === item.name} onChange={() => setSelectedPlan(item.name)} />{item.name}<small className="ml-2 text-slate-500">{item.duration}</small></span><b>{money(item.price)}</b></label>)}</div>{purpose === "upgrade" && <><h2 className="mt-6 text-lg font-bold">Optional add-ons</h2><div className="mt-3 space-y-2">{addOns.map((item) => <label key={item.name} className="flex justify-between rounded-xl border border-slate-200 p-3 text-sm"><span><input className="mr-2 accent-blue-600" type="checkbox" checked={selectedAddOns.includes(item.name)} onChange={() => toggleAddOn(item.name)} />{item.name}</span><b>{money(item.price)}</b></label>)}</div></>}</section><section className="h-fit rounded-2xl bg-slate-50 p-5"><h2 className="text-lg font-bold">Secure Paystack checkout</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-slate-500">Student</dt><dd className="font-semibold">{studentName || "Loading..."}</dd></div>{studentUserId && <div><dt className="text-slate-500">Student ID</dt><dd className="font-semibold">{studentUserId}</dd></div>}<div><dt className="text-slate-500">Plan</dt><dd className="font-semibold">{purpose === "renewal" ? confirmedPayment?.package || selectedPlan : selectedPlan}</dd></div><div><dt className="text-slate-500">Total due</dt><dd className="text-3xl font-bold">{money(displayedTotal)}</dd></div></dl><label className="mt-6 block text-sm font-semibold">Payment method<select value={method} onChange={(event) => setMethod(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2"><option value="mobile_money">Mobile Money</option><option value="card">Debit / Credit Card</option></select></label>{method === "mobile_money" && <label className="mt-3 block text-sm font-semibold">Mobile-money number<input value={momoNumber} onChange={(event) => setMomoNumber(event.target.value.replace(/\D/g, "").slice(0, 15))} inputMode="numeric" placeholder="0551234567" className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" /></label>}<button onClick={pay} disabled={loading || !displayedTotal} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-bold text-white disabled:opacity-50"><WalletCards size={19} />{loading ? "Preparing payment..." : `Pay ${money(displayedTotal)} with Paystack`}</button><p className="mt-4 flex gap-2 text-xs text-slate-500"><LockKeyhole size={16} />The final amount is calculated and verified by the server.</p></section></div>{message && <p className="mx-6 mb-6 rounded-xl bg-blue-50 p-4 text-center text-sm text-blue-900">{message}</p>}</section></main>;
}
=======
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
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
