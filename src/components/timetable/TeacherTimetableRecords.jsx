// components/timetable/TeacherTimetableRecords.jsx
//
// Read-only records of each teacher's timetable, grouped by teacher. Built for
// the Tutor Manager (QAO) dashboard so they can see every teacher's weekly
// slots and already-scheduled classes (dates/times, Google Meet links) while
// administration of the timetable itself lives in the Admin dashboard.
import { useEffect, useMemo, useState } from "react";
import apiClient from "../../utils/apiClient";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { RefreshCw, UserCheck, CalendarDays, Clock3, Link as LinkIcon, BookOpen } from "lucide-react";

const config = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("qaoToken")}` } });

function friendlyDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return String(iso).slice(0, 10);
  }
}

const meetingBadge = (status) => {
  const cls =
    status === "ready" ? "bg-emerald-100 text-emerald-700"
      : status === "pending" ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-600";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{status || "pending"}</span>;
};
export default function TeacherTimetableRecords() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [t, tc] = await Promise.all([
        apiClient.get("/qao/timetable", config()),
        apiClient.get("/qao/teachers/all", config()),
      ]);
      setClasses(Array.isArray(t.data?.timetable) ? t.data.timetable : []);
      setTeachers(Array.isArray(tc.data?.teachers) ? tc.data.teachers : []);
      setError("");
    } catch (err) {
      console.error("Teacher timetable records load error:", err);
      setError("Failed to load teacher timetable records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Group classes by their assigned teacher.
  const byTeacher = useMemo(
    () =>
      teachers
        .filter((t) => t._id)
        .map((teacher) => ({
          teacher,
          groups: classes.filter((g) => g.teacher && String(g.teacher._id) === String(teacher._id)),
        }))
        .filter((row) => row.groups.length),
    [classes, teachers]
  );

  const totalSessions = useMemo(
    () => classes.reduce((n, g) => n + (g.sessions?.length || 0), 0),
    [classes]
  );

  if (loading) {
    return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">Loading teacher timetable records...</div>;
  }

  if (error) {
    return <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-600">{error}</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm">
          {byTeacher.length} teachers with a timetable · {totalSessions} scheduled class(es)
        </p>
        <Button size="sm" variant="outline" onClick={load} className="h-8 rounded-full px-3 text-[11px] font-semibold sm:text-xs">
          <RefreshCw className="mr-1 h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {byTeacher.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          No teacher timetables found yet. Teachers are assigned classes from the Admin dashboard's Timetable tab.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {byTeacher.map(({ teacher, groups }) => (
            <Card key={teacher._id} className="border border-slate-200 bg-white shadow-lg sm:shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-violet-600" />
                  <CardTitle className="text-base text-slate-900">{teacher.fullName || teacher.name || "Teacher"}</CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm">{teacher.email || ""}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {groups.map((g) => (
                  <div key={g._id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                    <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                      <BookOpen className="h-3.5 w-3.5 text-violet-500" /> {g.code}
                      <span className="font-normal text-slate-500">· {g.subject} · {g.grade}</span>
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">{g.curriculum} · {g.studentCount || 0} student(s)</p>

                    {g.effectiveSlots?.length ? (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {g.effectiveSlots.map((s, i) => (
                          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-medium text-violet-700">
                            <Clock3 className="h-3 w-3" /> {s.day} {s.startTime}–{s.endTime}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1.5 text-xs text-slate-400">No weekly slots set yet.</p>
                    )}

                    {g.sessions?.length ? (
                      <div className="mt-2">
                        <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                          <CalendarDays className="h-3 w-3" /> Scheduled ({g.sessions.length})
                        </p>
                        <ul className="mt-1 space-y-1">
                          {g.sessions.map((s) => (
                            <li key={String(s._id)} className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-slate-700">
                                {friendlyDate(s.date)} · {s.startTime}–{s.endTime}
                              </span>
                              <span className="flex items-center gap-1.5">
                                {s.meetingLink ? (
                                  <a href={s.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-medium text-violet-700 hover:underline">
                                    <LinkIcon className="h-3 w-3" /> Join
                                  </a>
                                ) : <span className="text-slate-400">—</span>}
                                {meetingBadge(s.meetingStatus)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">No classes scheduled yet.</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
