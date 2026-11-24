// src/page/parent/ParentHome.jsx
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router";
import {
  getAttendanceForParent,
  getNotesForParent,
  getSchedule,
} from "../../services/api";
import ChildSwitcher from "../../components/parent/ChildSwitcher";
import { useParentChild } from "../../context/ParentChildContext";
import { getInitials } from "../../utils/initials";
import {
  ATTENDANCE_STATUS as STATUS,
  NOTE_LABELS,
  formatUpdateTime,
} from "../../utils/childUpdates";
import {
  formatTime,
  getLocalDate,
  getStatus,
  getTodayKey,
  useNowMinutes,
} from "../../utils/time";
import Announcements from "../../components/shared/Announcements";

// ---------------------------------------------------------------
// Today's note from the teacher
// ---------------------------------------------------------------
function TodayNote({ note, childName }) {
  if (!note) {
    return (
      <p className="text-sm leading-snug text-[#555c57]">
        No update from the teacher yet today. It will appear here as soon as{" "}
        {childName}'s teacher adds it.
      </p>
    );
  }

  const chips = [
    NOTE_LABELS.mood[note.mood],
    NOTE_LABELS.meal[note.meal],
    NOTE_LABELS.nap[note.nap],
  ].filter(Boolean);

  const time = formatUpdateTime(note.updatedAt);

  return (
    <div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-[#e3f2ea] px-3 py-1.5 text-sm font-semibold text-brand"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {note.text && (
        <p className="mt-3 text-[15px] leading-snug text-[#262723]">{note.text}</p>
      )}

      {time && <p className="mt-3 text-xs text-[#777871]">Updated at {time}</p>}
    </div>
  );
}

// ---------------------------------------------------------------
// Now / Next from today's schedule
// ---------------------------------------------------------------
function NowNextCard({ slots }) {
  const nowMin = useNowMinutes();

  if (slots.length === 0) return null;

  const current = slots.find((slot) => getStatus(slot, nowMin) === "active");
  const next = slots.find((slot) => getStatus(slot, nowMin) === "upcoming");

  if (!current && !next) {
    return (
      <p className="text-sm font-medium text-brand">
        The nursery day is over. See you tomorrow! 👋
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl bg-[#fff0dc] p-3">
        <p className="text-[11px] font-semibold text-[#cd6700]">NOW</p>
        {current ? (
          <>
            <p className="mt-1 text-sm leading-snug font-bold text-[#262723]">
              {current.activity}
            </p>
            <p className="mt-1 text-xs text-[#555c57]">
              until {formatTime(current.endTime)}
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-[#555c57]">Not started yet</p>
        )}
      </div>

      <div className="rounded-xl bg-[#e3f2ea] p-3">
        <p className="text-[11px] font-semibold text-brand">NEXT</p>
        {next ? (
          <>
            <p className="mt-1 text-sm leading-snug font-bold text-[#262723]">
              {next.activity}
            </p>
            <p className="mt-1 text-xs text-[#555c57]">at {formatTime(next.startTime)}</p>
          </>
        ) : (
          <p className="mt-1 text-sm text-[#555c57]">Last activity of the day</p>
        )}
      </div>
    </div>
  );
}

function Card({ title, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-brand">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------
export default function ParentHome() {
  const user = useSelector((state) => state.auth.user);
  const today = getLocalDate();

  const {
    selectedChild: child,
    loading: childrenLoading,
    error: childrenError,
  } = useParentChild();

  const [attendance, setAttendance] = useState([]);
  const [notes, setNotes] = useState([]);
  const [slots, setSlots] = useState([]);

  const [loading, setLoading] = useState(true);
  const [partial, setPartial] = useState(false);

  // Today's attendance and notes for ALL of the parent's children, loaded once.
  // Switching between siblings is then instant.
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setPartial(false);

      const [att, nts] = await Promise.allSettled([
        getAttendanceForParent(user.uid, today),
        getNotesForParent(user.uid, today),
      ]);

      if (cancelled) return;

      setAttendance(att.status === "fulfilled" ? att.value : []);
      setNotes(nts.status === "fulfilled" ? nts.value : []);
      setPartial(att.status === "rejected" || nts.status === "rejected");
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, today]);

  const classId = child?.classId;
  const nurseryId = child?.nurseryId ?? user?.nurseryId;

  // Today's schedule of the selected child's class
  useEffect(() => {
    if (!classId || !nurseryId) {
      setSlots([]);
      return;
    }

    let cancelled = false;

    getSchedule(classId, nurseryId, getTodayKey())
      .then((result) => {
        if (!cancelled) setSlots(result);
      })
      .catch(() => {
        if (!cancelled) setSlots([]); // the schedule is optional on this page
      });

    return () => {
      cancelled = true;
    };
  }, [classId, nurseryId]);

  const wrapper = "mx-auto w-full max-w-md px-4 pt-4 pb-6 text-[#262723]";

  const firstName = user?.name?.split(" ")[0] ?? "";
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // ----- Loading -----
  if (childrenLoading || loading) {
    return (
      <main className={wrapper}>
        <div className="animate-pulse space-y-3" aria-label="Loading">
          <div className="h-8 w-48 rounded-lg bg-[#ece6dd]" />
          <div className="h-24 rounded-2xl bg-[#ece6dd]" />
          <div className="h-32 rounded-2xl bg-[#ece6dd]" />
          <div className="h-24 rounded-2xl bg-[#ece6dd]" />
        </div>
      </main>
    );
  }

  // ----- Error -----
  if (childrenError) {
    return (
      <main className={wrapper}>
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {childrenError}
        </p>
      </main>
    );
  }

  // ----- No children linked -----
  if (!child) {
    return (
      <main className={wrapper}>
        <h1 className="text-2xl font-bold tracking-tight text-brand">
          Hello{firstName && `, ${firstName}`} 👋
        </h1>
        <p className="mt-4 rounded-2xl bg-white p-6 text-center text-sm text-[#555c57] shadow-sm">
          No children are linked to your account yet. Please contact your nursery.
        </p>
      </main>
    );
  }

  const record = attendance.find((r) => String(r.childId) === String(child.id));
  const note = notes.find((n) => String(n.childId) === String(child.id));
  const status = STATUS[record?.status] ?? STATUS.none;
  const childFirstName = child.name.split(" ")[0];

  return (
    <main className={wrapper}>
      <h1 className="text-2xl font-bold tracking-tight text-brand">
        Hello{firstName && `, ${firstName}`} 👋
      </h1>
      <p className="mt-1 text-sm text-[#555c57]">{dateLabel}</p>

      <ChildSwitcher />

      {partial && (
        <p
          role="status"
          className="mt-3 rounded-xl bg-[#fff0dc] p-3 text-sm text-[#8a4a00]"
        >
          Some of today's information couldn't be loaded. Pull down to try again later.
        </p>
      )}

      {/* Child + attendance */}
      <section className="mt-4 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
        <span
          className="grid h-16 w-16 flex-none place-items-center rounded-full bg-[#e3f2ea] text-xl font-bold text-brand"
          aria-hidden="true"
        >
          {getInitials(child.name)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold text-brand">{child.name}</h2>
          <span
            className={`mt-1.5 inline-block rounded-full px-2.5 py-1 text-xs leading-none font-semibold ${status.chip}`}
          >
            {status.label}
          </span>
          <p className="mt-1.5 text-sm text-[#555c57]">
            {childFirstName} {status.message}.
          </p>
        </div>
      </section>

      {/* Today's note */}
      <Card
        title={`How was ${childFirstName}'s day?`}
        className="mt-3"
        action={
          <Link to="/parent/updates" className="text-xs font-medium text-[#555c57]">
            All updates →
          </Link>
        }
      >
        <TodayNote note={note} childName={childFirstName} />
      </Card>

      {/* Now & Next (not useful when the child is absent) */}
      {record?.status !== "absent" && slots.length > 0 && (
        <Card
          title="Today at nursery"
          className="mt-3"
          action={
            <Link to="/parent/schedule" className="text-xs font-medium text-[#555c57]">
              Full schedule →
            </Link>
          }
        >
          <NowNextCard slots={slots} />
        </Card>
      )}
      <Announcements audience="parents" className="mt-3" />
    </main>
  );
}
