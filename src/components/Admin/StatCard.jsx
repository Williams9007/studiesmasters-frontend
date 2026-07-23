// src/components/Admin/StatCard.jsx
import { FaGraduationCap, FaChalkboardTeacher, FaUserShield, FaCoins } from "react-icons/fa";

export default function StatCard({ title, value, icon: CustomIcon, subtext }) {
  const getIcon = () => {
    if (CustomIcon) return <CustomIcon className="text-xl" />;
    const lower = (title || "").toLowerCase();
    if (lower.includes("student")) return <FaGraduationCap className="text-xl" />;
    if (lower.includes("teacher")) return <FaChalkboardTeacher className="text-xl" />;
    if (lower.includes("manager") || lower.includes("qao")) return <FaUserShield className="text-xl" />;
    if (lower.includes("payment") || lower.includes("ghs")) return <FaCoins className="text-xl" />;
    return <FaGraduationCap className="text-xl" />;
  };

  const getGradient = () => {
    const lower = (title || "").toLowerCase();
    if (lower.includes("student")) return "from-blue-500 to-cyan-500 text-white shadow-blue-500/20";
    if (lower.includes("teacher")) return "from-emerald-500 to-teal-500 text-white shadow-emerald-500/20";
    if (lower.includes("manager") || lower.includes("qao")) return "from-purple-500 to-indigo-500 text-white shadow-purple-500/20";
    if (lower.includes("payment") || lower.includes("ghs")) return "from-amber-500 to-orange-500 text-white shadow-amber-500/20";
    return "from-slate-700 to-slate-900 text-white shadow-slate-900/20";
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            {typeof value === "number" && (title || "").toLowerCase().includes("ghs")
              ? `₵${value.toLocaleString()}`
              : value}
          </p>
          {subtext && <p className="mt-1 text-xs text-slate-400">{subtext}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${getGradient()} shadow-lg`}>
          {getIcon()}
        </div>
      </div>
    </div>
  );
}

