import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useSelector } from "react-redux";
import MainInfo from "../../components/MainInfo";
import NowNext from "../../components/teacher/NowNext";
import { getAttendanceForDate, getChildrenForClass } from "../../services/api";
import SummaryNotes from "../../components/teacher/SummaryNotes";
import Announcements from "../../components/shared/Announcements"; 
import { getLocalDate } from "../../utils/time";

// const STATUS_STYLES = {
//   present: "bg-emerald-50 text-emerald-700",
//   absent: "bg-rose-50 text-rose-700",
//   late: "bg-amber-50 text-amber-700",
// };

export default function TeacherHome() {
  const [attendance, setAttendance] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = getLocalDate();
  const user = useSelector((state) => state.auth.user);

  const nurseryId = user?.nurseryId;
  const classId = user?.classId;

  useEffect(() => {
    let cancelled = false;

    async function load() {

      if (!nurseryId || !classId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");

      try {
        const [attendanceData, childrenData] = await Promise.all([
          getAttendanceForDate(nurseryId, today),
          getChildrenForClass(classId, nurseryId),
        ]);

        if (cancelled) return;
        setAttendance(attendanceData ?? []);
        setChildren((childrenData ?? []).filter((c) => c.active !== false));
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Could not load today's attendance.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [nurseryId, classId, today]);

  // Derive everything else from the fetched data
  const overview = useMemo(() => {
    const childIds = new Set(children.map((c) => String(c.id)));

    // only today's records for children in this class
    const records = attendance.filter((r) => childIds.has(String(r.childId)));

    const count = (status) => records.filter((r) => r.status === status).length;
    const presentCount = count("present");
    const absentCount = count("absent");
    const lateCount = count("late");
    const recorded = records.length;
    const missingCount = children.length - recorded;

    return {
      presentCount,
      absentCount,
      lateCount,
      recorded,
      missingCount,
    };
  }, [attendance, children]);

  const { presentCount, absentCount, lateCount, recorded, missingCount } =
    overview;

  const attendanceComplete = children.length > 0 && missingCount === 0;
  const needsAttention = children.length === 0 || missingCount > 0;

  const attentionMessage =
    children.length === 0
      ? "No children are assigned to your class yet."
      : missingCount > 0
        ? `${missingCount} ${missingCount === 1 ? "child still needs" : "children still need"} an attendance status.`
        : "Attendance is complete. Nothing needs your attention right now.";

  if (!user || !nurseryId || !classId) {
    return (
      <main className="mx-auto max-w-5xl p-5 sm:p-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
          Teacher information is not available. Check that the signed-in teacher
          has a nursery and class assigned.
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-5xl p-5 sm:p-8">
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
          {error}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-5 p-4 pb-8 sm:p-8">
      <MainInfo />

      <section
        aria-labelledby="attention-title"
        className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${
          !loading && needsAttention
            ? "border-amber-200 bg-amber-50"
            : "border-emerald-200 bg-emerald-50"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Today · What needs attention
            </p>
            <h2
              id="attention-title"
              className="mt-2 text-lg font-semibold text-slate-900"
            >
              {!loading && attentionMessage}
            </h2>
          </div>

          {!loading && missingCount > 0 && (
            <Link
              to="/teacher/attendance"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Complete attendance
            </Link>
          )}

          {!loading && missingCount === 0 && (
            <Link
              to="/teacher/attendance"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Review attendance
            </Link>
          )}
        </div>
      </section>

      <section
        aria-labelledby="attendance-summary-title"
        className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2
              id="attendance-summary-title"
              className="font-semibold text-slate-900"
            >
              Class check-in
            </h2>
            {!loading && (
              <p className="mt-1 text-sm text-slate-500">
                {attendanceComplete
                  ? `All ${children.length} children have a status.`
                  : `${recorded} of ${children.length} children recorded`}
              </p>
            )}
          </div>

          {!loading && attendanceComplete && (
            <Link
              to="/teacher/attendance"
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-800"
            >
              View attendance
            </Link>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryTile
            loading={loading}
            label="Present"
            value={presentCount}
            tone="emerald"
          />
          <SummaryTile
            loading={loading}
            label="Absent"
            value={absentCount}
            tone="rose"
          />
          <SummaryTile
            loading={loading}
            label="Late"
            value={lateCount}
            tone="amber"
          />
          <SummaryTile
            loading={loading}
            label="Not recorded"
            value={missingCount}
            tone="slate"
          />
        </div>
      </section>

      <NowNext />
      <Announcements audience="teachers" /> 
      <SummaryNotes/>
    </main>
  );
}

function SummaryTile({ label, value, tone, loading }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-800",
    rose: "bg-rose-50 text-rose-800",
    amber: "bg-amber-50 text-amber-800",
    slate: "bg-slate-100 text-slate-700",
  };

  if (loading)
    return (
      <div
        className={`rounded-xl p-4 min-h-23 animate-pulse ${tones[tone]}`}
      ></div>
    );

  return (
    <div className={`rounded-xl p-4 ${tones[tone]}`}>
      <p className="text-2xl font-bold ">{value}</p>
      <p className="mt-1 text-sm font-medium">{label}</p>
    </div>
  );
}
