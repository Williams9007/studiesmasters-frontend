// components/virtual/StudentVirtualClasses.jsx
//
// Student Virtual Classroom (Phase 6A). The Google Meet URL is NEVER rendered
// in lists — it is only obtained via the join endpoint, which the backend
// validates (enrollment + session state) before returning.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import apiClient from "@/utils/apiClient";

function fmtTime(date, time) {
  if (!date) return "—";
  const day = new Date(date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return `${day} · ${time || ""}`.trim();
}

function countdownTo(date, startTime) {
  if (!date || !startTime) return null;
  const [h, m] = String(startTime).split(":").map(Number);
  const target = new Date(new Date(date).setHours(h || 0, m || 0, 0, 0));
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return null;
  const mins = Math.floor(diff / 60000);
  return mins < 60 ? `in ${mins} min` : `in ${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export default function StudentVirtualClasses() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joiningId, setJoiningId] = useState(null);
  const [joinError, setJoinError] = useState("");
  const [joinedId, setJoinedId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/meet/student/sessions");
      setSessions(res.data?.sessions || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your virtual classes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const { live, upcoming, past } = useMemo(() => {
    const midnight = new Date(); midnight.setHours(0, 0, 0, 0);
    const b = { live: [], upcoming: [], past: [] };
    for (const s of sessions) {
      if (s.status === "live") b.live.push(s);
      else if (new Date(s.date) >= midnight) b.upcoming.push(s);
      else b.past.push(s);
    }
    return b;
  }, [sessions]);

  const joinClass = async (id) => {
    setJoiningId(id);
    setJoinError("");
    try {
      const res = await apiClient.post(`/meet/join/${id}`);
      const link = res.data?.meeting?.link || "";
      if (!link) {
        setJoinError(res.data?.meeting?.status === "pending"
          ? "The meeting link is still being generated. Try again shortly."
          : "Meeting link is not available yet.");
        return;
      }
      setJoinedId(id);
      window.open(link, "_blank", "noopener,noreferrer");
      load();
    } catch (err) {
      setJoinError(err.response?.data?.message || "Could not join this class");
    } finally {
      setJoiningId(null);
    }
  };

  const reportLeave = async (id) => {
    try {
      await apiClient.post(`/meet/leave/${id}`, { joinedAt: joinedId === id ? new Date().toISOString() : undefined });
      if (joinedId === id) setJoinedId(null);
    } catch { /* non-fatal */ }
  };
  const Card = ({ s }) => {
    const cd = countdownTo(s.date, s.startTime);
    const id = String(s.sessionId || s._id);
    const isJoined = joinedId === id;
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{s.subject || "Class"}</p>
            <p className="text-xs text-slate-500">{s.teacher || "Teacher TBA"} · {s.grade || ""}</p>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${s.status === "live" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
            {s.status === "live" ? "Live now" : s.status}
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-600">{fmtTime(s.date, s.startTime)} – {s.endTime}</p>
        {cd && <p className="text-xs font-semibold text-violet-600">Starts {cd}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={s.status !== "live" || joiningId === id} onClick={() => joinClass(id)} className="h-8 rounded-full">
            {joiningId === id ? "Joining…" : "Join Class"}
          </Button>
          {isJoined && (
            <Button size="sm" variant="outline" onClick={() => reportLeave(id)} className="h-8 rounded-full">
              I left the class
            </Button>
          )}
        </div>
      </div>
    );
  };

  const Section = ({ title, items, empty }) => (
    <section>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p>
      {items.length
        ? <div className="grid gap-3 sm:grid-cols-2">{items.map((s) => <Card key={String(s.sessionId || s._id)} s={s} />)}</div>
        : <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">{empty}</p>}
    </section>
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-900 sm:text-lg">Virtual Classroom</h3>
        <p className="text-xs text-slate-500 sm:text-sm">Join your live classes straight from StudiesMasters.</p>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</div>}
      {joinError && <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">{joinError}</div>}
      {loading && <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Loading your classes…</div>}

      {!loading && (
        <>
          <Section title="Live now" items={live} empty="No live classes right now." />
          <Section title="Upcoming" items={upcoming} empty="No upcoming classes." />
          <Section title="Previous" items={past} empty="No previous classes yet." />
        </>
      )}
    </div>
  );
}