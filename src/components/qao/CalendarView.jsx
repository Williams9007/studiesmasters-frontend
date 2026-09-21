// components/qao/CalendarView.jsx
// Weekly / monthly / daily agenda calendar over ClassSessions + the
// Classes-Today widget. Displays subject/grade/curriculum/teacher/time/status
// only — student information is not present in QAO session payloads.
import { useCallback, useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import apiClient from "../../utils/apiClient";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Plus, RefreshCw, Clock } from "lucide-react";
import ScheduleFilters, { EMPTY_FILTERS } from "./ScheduleFilters";
import SessionModal from "./SessionModal";

const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("qaoToken")}` } });

const STATUS_COLORS = {
  scheduled: "#7c3aed",
  live: "#e11d48",
  completed: "#059669",
  cancelled: "#94a3b8",
};

// Sessions are stored with `date` = UTC midnight of the INTENDED calendar day
// (see services/moodle/syncClass.js#toEpochSeconds). Reading that instant with
// local getters shifts every class a day backwards for any viewer behind UTC
// (e.g. UTC-7 rendered "Sep 19" as "Sep 18"), which is why classes looked
// missing from the calendar and from "Classes Today".
function sessionDayParts(s) {
  const src = new Date(s.date);
  return [src.getUTCFullYear(), src.getUTCMonth(), src.getUTCDate()];
}

function sessionStart(s) {
  const [y, mo, da] = sessionDayParts(s);
  const [h, m] = String(s.startTime || "00:00").split(":").map(Number);
  return new Date(y, mo, da, h || 0, m || 0, 0, 0);
}

function sessionEnd(s) {
  const [y, mo, da] = sessionDayParts(s);
  const [h, m] = String(s.endTime || s.startTime || "00:00").split(":").map(Number);
  return new Date(y, mo, da, h || 0, m || 0, 0, 0);
}

/** Local YYYY-MM-DD for an instant (never toISOString — it shifts by a day). */
function localYmd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CalendarView() {
  const [sessions, setSessions] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: "create", session: null, defaults: {} });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, t, g] = await Promise.all([
        apiClient.get("/qao/sessions", config()),
        apiClient.get("/qao/teachers/all", config()),
        apiClient.get("/qao/class-groups/all", config()),
      ]);
      setSessions(Array.isArray(s.data?.sessions) ? s.data.sessions : []);
      setTeachers(Array.isArray(t.data?.teachers) ? t.data.teachers : []);
      setGroups(Array.isArray(g.data?.groups) ? g.data.groups : []);
    } catch (err) {
      console.error("Calendar load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
// Live refresh: the dashboard emits "sm:calendar-refresh" whenever a class is
  // created / updated / cancelled or a timetable is published, so this calendar
  // is never stale (previously it only loaded once on mount).
  useEffect(() => {
    const onRefresh = () => load();
    window.addEventListener("sm:calendar-refresh", onRefresh);
    return () => window.removeEventListener("sm:calendar-refresh", onRefresh);
  }, [load]);

  const filtered = useMemo(
    () =>
      sessions.filter((s) => {
        const g = s.classGroup || {};
        if (filters.curriculum && String(g.curriculum || "").toLowerCase() !== filters.curriculum.toLowerCase()) return false;
        if (filters.grade && !String(g.grade || "").toLowerCase().includes(filters.grade.toLowerCase())) return false;
        if (filters.subject && !String(g.subject || "").toLowerCase().includes(filters.subject.toLowerCase())) return false;
        if (filters.teacher && s.teacher?._id !== filters.teacher && s.substituteTeacher?._id !== filters.teacher) return false;
        if (filters.status && s.status !== filters.status) return false;
        return true;
      }),
    [sessions, filters]
  );

  const events = useMemo(
    () =>
      filtered.map((s) => {
        const g = s.classGroup || {};
        const teacherName = s.substituteTeacher?.fullName ? `${s.teacher?.fullName || "TBD"} → ${s.substituteTeacher.fullName}` : s.teacher?.fullName || "Unassigned";
        return {
          id: s._id,
          title: `${g.curriculum || ""} ${g.grade || ""} ${g.subject || ""} · ${teacherName}`.trim(),
          start: sessionStart(s),
          end: sessionEnd(s),
          backgroundColor: STATUS_COLORS[s.status] || STATUS_COLORS.scheduled,
          borderColor: "transparent",
          extendedProps: { session: s },
        };
      }),
    [filtered]
  );

  const today = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const list = filtered.filter((s) => {
      // Compare the session's UTC calendar day against today's LOCAL calendar
      // day so "Classes Today" matches what the calendar grid shows.
      const d = new Date(s.date);
      return d.getUTCFullYear() === start.getFullYear()
        && d.getUTCMonth() === start.getMonth()
        && d.getUTCDate() === start.getDate();
    });
    const upcoming = list.filter((s) => s.status === "scheduled");
    const active = list.filter((s) => s.status === "live");
    const completed = list.filter((s) => s.status === "completed");
    const cancelled = list.filter((s) => s.status === "cancelled");
    return { upcoming, active, completed, cancelled, all: list };
  }, [filtered]);

  const openCreate = (arg) => {
    const start = arg?.start || new Date();
    const end = arg?.end || new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    // localYmd (not toISOString) — the calendar selection is a LOCAL instant, so
    // toISOString would silently move the date by a day for UTC+ viewers.
    setModal({ open: true, mode: "create", session: null, defaults: { date: localYmd(start), startTime: fmt(start), endTime: fmt(end) } });
  };

  const openEdit = (info) => setModal({ open: true, mode: "edit", session: info.event.extendedProps.session, defaults: {} });

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Today's Classes widget */}
      <Card className="border border-slate-200 bg-white shadow-lg sm:shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900 sm:text-xl"><Clock className="h-5 w-5 text-violet-600" /> Classes Today</CardTitle>
          <CardDescription className="text-xs sm:text-sm">{today.all.length} session{today.all.length === 1 ? "" : "s"} · {today.active.length} live · {today.completed.length} completed</CardDescription>
        </CardHeader>
        <CardContent>
          {today.all.length ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {today.all.map((s) => {
                const g = s.classGroup || {};
                return (
                  <button key={s._id} type="button" onClick={() => setModal({ open: true, mode: "edit", session: s, defaults: {} })} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-violet-300 hover:bg-violet-50">
                    <p className="text-xs font-bold text-violet-700 sm:text-sm">{s.startTime} - {s.endTime}</p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-900 sm:text-sm">{[g.curriculum, g.grade, g.subject].filter(Boolean).join(" ") || "Session"}</p>
                    <p className="text-[11px] text-slate-500">Teacher: {s.substituteTeacher?.fullName ? `${s.substituteTeacher.fullName} (sub)` : s.teacher?.fullName || "Unassigned"}</p>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${s.status === "live" ? "bg-rose-100 text-rose-700" : s.status === "completed" ? "bg-emerald-100 text-emerald-700" : s.status === "cancelled" ? "bg-slate-200 text-slate-600" : "bg-violet-100 text-violet-700"}`}>{s.status}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-500 sm:text-sm">No classes scheduled for today.</div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <ScheduleFilters filters={filters} onChange={setFilters} teachers={teachers} onClear={() => setFilters(EMPTY_FILTERS)} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} className="h-9 rounded-lg px-3 text-[11px] font-semibold sm:text-xs">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => openCreate()} className="h-9 rounded-full bg-violet-600 px-4 text-[11px] font-semibold text-white hover:bg-violet-700 sm:text-xs">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Schedule class
          </Button>
        </div>
      </div>

      <Card className="border border-slate-200 bg-white p-1 shadow-lg sm:p-2 sm:shadow-2xl">
        {loading ? (
          <div className="p-10 text-center text-sm text-slate-500">Loading calendar...</div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{ left: "prev,next today", center: "title", right: "timeGridWeek,timeGridDay,dayGridMonth,listWeek" }}
            buttonText={{ today: "Today", dayGridMonth: "Month", timeGridWeek: "Week", timeGridDay: "Day", listWeek: "Agenda" }}
            events={events}
            eventClick={openEdit}
            select={openCreate}
            selectable
            selectMirror
            height="auto"
            nowIndicator
            allDaySlot={false}
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            eventTimeFormat={{ hour: "numeric", minute: "2-digit", meridiem: "short" }}
            eventContent={(arg) => (
              <div className="overflow-hidden px-1 text-[10px] leading-tight sm:text-[11px]">
                <p className="truncate font-bold">{arg.event.extendedProps.session?.classGroup?.subject || arg.event.title}</p>
                <p className="truncate opacity-80">{arg.event.extendedProps.session?.teacher?.fullName || ""}</p>
              </div>
            )}
          />
        )}
      </Card>

      <SessionModal
        open={modal.open}
        mode={modal.mode}
        session={modal.session}
        defaults={modal.defaults}
        teachers={teachers}
        groups={groups}
        onClose={() => setModal((m) => ({ ...m, open: false }))}
        onSaved={load}
      />
    </div>
  );
}
