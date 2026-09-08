// components/qao/ScheduleFilters.jsx
// Curriculum / Grade / Subject / Teacher / Status filters for the calendar.
// Teacher filter uses teacher _id; no student filters exist by design.
import { Filter, X } from "lucide-react";

const selectClass =
  "rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 sm:rounded-xl sm:px-3 sm:text-sm";

export const EMPTY_FILTERS = { curriculum: "", grade: "", subject: "", teacher: "", status: "" };

export default function ScheduleFilters({ filters, onChange, teachers = [], onClear }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });
  const active = Object.values(filters).some(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-[1.25rem] sm:p-4">
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:text-xs">
        <Filter className="h-3.5 w-3.5" /> Filters
      </span>
      <select value={filters.curriculum} onChange={set("curriculum")} className={selectClass} aria-label="Curriculum filter">
        <option value="">All curricula</option>
        <option value="GES">GES</option>
        <option value="Cambridge">Cambridge</option>
      </select>
      <select value={filters.grade} onChange={set("grade")} className={selectClass} aria-label="Grade filter">
        <option value="">All grades</option>
        <option value="Primary">Primary</option>
        <option value="JHS">JHS</option>
        <option value="SHS">SHS</option>
      </select>
      <select value={filters.subject} onChange={set("subject")} className={selectClass} aria-label="Subject filter">
        <option value="">All subjects</option>
        <option value="Mathematics">Mathematics</option>
        <option value="Maths">Maths</option>
        <option value="Science">Science</option>
        <option value="English">English</option>
      </select>
      <select value={filters.teacher} onChange={set("teacher")} className={selectClass} aria-label="Teacher filter">
        <option value="">All teachers</option>
        {teachers.map((t) => (
          <option key={t._id} value={t._id}>{t.fullName || t.name}</option>
        ))}
      </select>
      <select value={filters.status} onChange={set("status")} className={selectClass} aria-label="Status filter">
        <option value="">All statuses</option>
        <option value="scheduled">Scheduled</option>
        <option value="live">Live</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      {active && (
        <button type="button" onClick={onClear} className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 sm:text-xs">
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      )}
    </div>
  );
}
