// src/components/admin/StatCard.jsx
export default function StatCard({ title, value }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg text-center">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}
