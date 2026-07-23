<<<<<<< HEAD
// src/components/Admin/AlertCard.jsx
import { FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

export default function AlertCard({ type = "info", title, message }) {
  const styles = {
    warning: {
      bg: "bg-amber-50 border-amber-200 text-amber-900",
      iconBg: "bg-amber-100 text-amber-600",
      Icon: FaExclamationTriangle,
    },
    info: {
      bg: "bg-blue-50 border-blue-200 text-blue-900",
      iconBg: "bg-blue-100 text-blue-600",
      Icon: FaInfoCircle,
    },
    error: {
      bg: "bg-rose-50 border-rose-200 text-rose-900",
      iconBg: "bg-rose-100 text-rose-600",
      Icon: FaExclamationCircle,
    },
    success: {
      bg: "bg-emerald-50 border-emerald-200 text-emerald-900",
      iconBg: "bg-emerald-100 text-emerald-600",
      Icon: FaCheckCircle,
    },
  };

  const current = styles[type] || styles.info;
  const IconComponent = current.Icon;

  return (
    <div className={`flex items-start gap-3.5 rounded-xl border p-4 shadow-sm transition-all ${current.bg}`}>
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg ${current.iconBg}`}>
        <IconComponent />
      </div>
      <div>
        {title && <h3 className="font-semibold text-sm tracking-tight">{title}</h3>}
        <p className="text-sm font-medium opacity-90">{message}</p>
      </div>
    </div>
  );
}

=======
// src/components/admin/AlertCard.jsx
export default function AlertCard({ type, title, message }) {
  const colors = {
    warning: "bg-yellow-600",
    info: "bg-blue-600",
    error: "bg-red-600",
  };

  return (
    <div className={`p-4 rounded-lg ${colors[type] || "bg-gray-700"}`}>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm mt-1">{message}</p>
    </div>
  );
}
>>>>>>> 8ddc26ece182e2445f99f3923ba32f7dfd1086dc
