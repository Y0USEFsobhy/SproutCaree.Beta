// src/page/parent/UpdatesPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import ChildSwitcher from "../../components/parent/ChildSwitcher";
import { useParentChild } from "../../context/ParentChildContext";

import {
  ATTENDANCE_STATUS,
  NOTE_LABELS,
  formatDayLabel,
  formatUpdateTime,
} from "../../utils/childUpdates";
import { getLocalDate } from "../../utils/time";
import {
  getAttendanceForChildAsParent,
  getNotesForChildAsParent,
} from "../../services/api";

const PAGE_SIZE = 10;

function DayCard({ day }) {
  const status = ATTENDANCE_STATUS[day.status];
  const note = day.note;

  const chips = note
    ? [
        NOTE_LABELS.mood[note.mood],
        NOTE_LABELS.meal[note.meal],
        NOTE_LABELS.nap[note.nap],
      ].filter(Boolean)
    : [];

  const time = note ? formatUpdateTime(note.updatedAt) : "";

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold text-[#262723]">
          {formatDayLabel(day.date)}
        </h3>
        {status && (
          <span
            className={`rounded-full px-2.5 py-1 text-xs leading-none font-semibold ${status.chip}`}
          >
            {status.label}
          </span>
        )}
      </div>

      {note ? (
        <>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-[#e3f2ea] px-2.5 py-1 text-xs font-semibold text-brand"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
          {note.text && (
            <p className="mt-2 text-sm leading-snug text-[#262723]">
              {note.text}
            </p>
          )}
          {time && (
            <p className="mt-2 text-xs text-[#777871]">Updated at {time}</p>
          )}
        </>
      ) : (
        <p className="text-sm text-[#777871]">
          No note from the teacher this day.
        </p>
      )}
    </article>
  );
}

export default function UpdatesPage() {
  const user = useSelector((state) => state.auth.user);
  const {
    selectedChild: child,
    loading: childLoading,
    error: childError,
  } = useParentChild();

  const [notes, setNotes] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const childId = child?.id;
  const uid = user?.uid;

  useEffect(() => {
    if (!childId || !uid) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setVisible(PAGE_SIZE);

      try {
        const [notesResult, attendanceResult] = await Promise.all([
          getNotesForChildAsParent(uid, childId),
          getAttendanceForChildAsParent(uid, childId),
        ]);

        if (!cancelled) {
          setNotes(notesResult);
          setAttendance(attendanceResult);
        }
      } catch {
        if (!cancelled)
          setError("Couldn't load the updates. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [childId, uid]);

  // One card per day: attendance status + the teacher's note, newest first
  const days = useMemo(() => {
    const byDate = new Map();

    attendance.forEach((record) => {
      byDate.set(record.date, {
        date: record.date,
        status: record.status,
        note: null,
      });
    });

    notes.forEach((note) => {
      const entry = byDate.get(note.date) ?? {
        date: note.date,
        status: null,
        note: null,
      };
      entry.note = note;
      byDate.set(note.date, entry);
    });

    return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, notes]);

  // This month's attendance numbers
  const monthSummary = useMemo(() => {
    const monthPrefix = getLocalDate().slice(0, 7);
    const counts = { present: 0, late: 0, absent: 0 };

    attendance.forEach((record) => {
      if (
        record.date.startsWith(monthPrefix) &&
        counts[record.status] !== undefined
      ) {
        counts[record.status] += 1;
      }
    });

    return counts;
  }, [attendance]);

  const monthName = new Date().toLocaleDateString("en-US", { month: "long" });
  const hasMonthData =
    monthSummary.present + monthSummary.late + monthSummary.absent > 0;

  const wrapper = "mx-auto w-full max-w-md px-4 pt-4 pb-6 text-[#262723]";
  const firstName = child?.name.split(" ")[0];

  if (childLoading) {
    return (
      <main className={wrapper}>
        <div className="animate-pulse space-y-3" aria-label="Loading">
          <div className="h-8 w-40 rounded-lg bg-[#ece6dd]" />
          <div className="h-24 rounded-2xl bg-[#ece6dd]" />
          <div className="h-24 rounded-2xl bg-[#ece6dd]" />
        </div>
      </main>
    );
  }

  if (childError) {
    return (
      <main className={wrapper}>
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {childError}
        </p>
      </main>
    );
  }

  if (!child) {
    return (
      <main className={wrapper}>
        <h1 className="text-2xl font-bold tracking-tight text-brand">
          Updates
        </h1>
        <p className="mt-4 rounded-2xl bg-white p-6 text-center text-sm text-[#555c57] shadow-sm">
          No children are linked to your account yet. Please contact your
          nursery.
        </p>
      </main>
    );
  }

  return (
    <main className={wrapper}>
      <h1 className="text-2xl font-bold tracking-tight text-brand">Updates</h1>
      <p className="mt-1 text-sm text-[#555c57]">
        {firstName}'s days at nursery, newest first
      </p>

      <ChildSwitcher />

      {/* Loading */}
      {loading && (
        <div
          className="mt-4 animate-pulse space-y-3"
          aria-label="Loading updates"
        >
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-2xl bg-[#ece6dd]" />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          {/* Month summary */}
          {hasMonthData && (
            <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-brand">
                {monthName} attendance
              </h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-[#e3f2ea] p-3">
                  <p className="text-2xl font-bold text-brand">
                    {monthSummary.present}
                  </p>
                  <p className="text-xs font-medium text-brand">Present</p>
                </div>
                <div className="rounded-xl bg-[#fff0dc] p-3">
                  <p className="text-2xl font-bold text-[#cd6700]">
                    {monthSummary.late}
                  </p>
                  <p className="text-xs font-medium text-[#cd6700]">Late</p>
                </div>
                <div className="rounded-xl bg-rose-50 p-3">
                  <p className="text-2xl font-bold text-rose-700">
                    {monthSummary.absent}
                  </p>
                  <p className="text-xs font-medium text-rose-700">Absent</p>
                </div>
              </div>
            </section>
          )}

          {/* Empty */}
          {days.length === 0 && (
            <p className="mt-4 rounded-2xl bg-white p-6 text-center text-sm text-[#555c57] shadow-sm">
              No updates yet. Attendance and notes will appear here day by day.
            </p>
          )}

          {/* Feed */}
          {days.length > 0 && (
            <div className="mt-4 space-y-3">
              {days.slice(0, visible).map((day) => (
                <DayCard key={day.date} day={day} />
              ))}

              {days.length > visible && (
                <button
                  type="button"
                  onClick={() => setVisible((count) => count + PAGE_SIZE)}
                  className="min-h-11 w-full rounded-full bg-[#e3f2ea] px-4 text-sm font-semibold text-brand transition hover:bg-[#d3ebdf]"
                >
                  Show older updates
                </button>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
