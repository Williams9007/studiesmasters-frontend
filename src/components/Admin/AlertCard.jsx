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
