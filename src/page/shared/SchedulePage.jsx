import { useEffect, useState } from "react";
import { getSchedule } from "../../services/api";
import {
  formatTime,
  getStatus,
  getTodayKey,
  useNowMinutes,
} from "../../utils/time";
import ChildSwitcher from "../../components/parent/ChildSwitcher";

const DAY_TABS = [
  { key: "sunday", label: "Sun" },
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
];

const TYPE_ICONS = {
  play: "🧩",
  meal: "🍽️",
  routine: "🎵",
  learning: "📚",
  rest: "🌙",
};

const STATUS_STYLES = {
  done: {
    dot: "bg-[#18794e] text-white",
    card: "bg-[#fbf5ed]",
    time: "text-[#777871]",
    title: "text-[#777871]",
    badge: "rounded-full bg-[#f0ede7] px-2.5 py-1 text-[#777871]",
    label: "Done",
  },
  active: {
    dot: "bg-[#f3a000] text-[#2e2b1e]",
    card: "bg-white shadow-md ring-2 ring-[#f3a000]/40",
    time: "font-bold text-[#bd6000]",
    title: "text-[#262723]",
    badge: "rounded-full bg-[#fff0dc] px-2.5 py-1 font-semibold text-[#cd6700]",
    label: "Now",
  },
  upcoming: {
    dot: "bg-[#eeece7] text-[#4b514d]",
    card: "bg-white shadow-sm",
    time: "text-[#555c57]",
    title: "text-[#262723]",
    badge: "px-1 py-1 font-semibold text-[#285b4a]",
    label: "Upcoming",
  },
  plain: {
    dot: "bg-[#eeece7] text-[#4b514d]",
    card: "bg-white shadow-sm",
    time: "text-[#555c57]",
    title: "text-[#262723]",
    badge: "",
    label: "",
  },
};

function EventCard({ slot, status, isNext }) {
  const [description, setDescription] = useState(false);
  const style = STATUS_STYLES[status];
  const label = status === "upcoming" && isNext ? "Next" : style.label;

  return (
    <div className="relative z-10 grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[2.75rem_minmax(0,1fr)] sm:gap-3">
      <span
        className={`mt-3 ml-1 grid h-8 w-8 place-items-center rounded-full text-sm font-bold ${style.dot}`}
        aria-hidden="true"
      >
        {status === "done" ? (
          <img src="/check.svg" width={20} alt="check" />
        ) : (
          (TYPE_ICONS[slot.type] ?? "•")
        )}
      </span>

      <article
        aria-current={status === "active" ? "true" : undefined}
        className={`min-w-0 cursor-pointer rounded-2xl px-3 py-3 sm:px-4 ${style.card}`}
        onClick={() => setDescription((open) => !open)}
      >
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <span className={`min-w-0 text-xs tabular-nums ${style.time}`}>
            {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
          </span>
          {label && (
            <span
              className={`shrink-0 text-[11px] leading-none ${style.badge}`}
            >
              {label}
            </span>
          )}
        </div>
        <h2
          className={`mt-1 wrap-words text-[15px] font-medium leading-snug ${style.title}`}
        >
          {slot.activity}
        </h2>
        {description && slot.description && (
          <p className="mt-1 wrap-words text-sm font-medium text-gray-600">
            {slot.description}
          </p>
        )}
      </article>
    </div>
  );
}

function NowNextCard({ current, next, hasSlots }) {
  let content;

  if (current) {
    content = (
      <>
        <p className="text-xs font-medium text-[#134936]/70">HAPPENING NOW</p>
        <p className="mt-1 wrap-words text-lg font-bold text-[#134936]">
          {current.activity}
        </p>
        <p className="wrap-words text-sm text-[#134936]/80">
          until {formatTime(current.endTime)}
          {next && ` · Next: ${next.activity} at ${formatTime(next.startTime)}`}
        </p>
      </>
    );
  } else if (next) {
    content = (
      <>
        <p className="text-xs font-medium text-[#134936]/70">NEXT UP</p>
        <p className="mt-1 wrap-words text-lg font-bold text-[#134936]">
          {next.activity}
        </p>
        <p className="text-sm text-[#134936]/80">
          at {formatTime(next.startTime)}
        </p>
      </>
    );
  } else if (hasSlots) {
    content = (
      <p className="wrap-words font-semibold text-[#134936]">
        The school day is over. See you tomorrow! 👋
      </p>
    );
  } else {
    return null;
  }

  return (
    <div className="mb-4 rounded-2xl bg-[#e3f2ea] p-3 sm:p-4">{content}</div>
  );
}

export default function Schedule({ classId, nurseryId ,showChildSwitcher = false }) {
  const todayKey = getTodayKey();
  const isSchoolDay = DAY_TABS.some((day) => day.key === todayKey);
  const [selectedDay, setSelectedDay] = useState(
    isSchoolDay ? todayKey : "sunday",
  );
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const nowMin = useNowMinutes();

  useEffect(() => {
    let cancelled = false;

    const loadSchedule = async () => {
      if (!classId || !nurseryId) {
        setSlots([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const result = await getSchedule(classId, nurseryId, selectedDay);

        if (!cancelled) setSlots(result);
      } catch (err) {
        if (!cancelled) {
          console.log("getSchedule failed:", err.code, err.message);
          setError("Couldn't load the schedule. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSchedule();

    return () => {
      cancelled = true;
    };
  }, [classId, nurseryId, selectedDay]);

  const isToday = selectedDay === todayKey;
  const statusOf = (slot) => (isToday ? getStatus(slot, nowMin) : "plain");
  const current = isToday
    ? slots.find((slot) => statusOf(slot) === "active")
    : null;
  const next = isToday
    ? slots.find((slot) => statusOf(slot) === "upcoming")
    : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-3 pb-8 pt-4 text-[#262723] sm:px-5 sm:pt-6 sm:pb-12 lg:px-8">
      <h1 className="wrap-words text-xl font-bold tracking-tight text-[#134936] sm:text-2xl">
        {isToday ? "Today's Schedule" : "Class Schedule"}
      </h1>
      {showChildSwitcher && <ChildSwitcher />}

      {!isSchoolDay && (
        <p className="mt-2 rounded-xl bg-[#fff0dc] p-3 text-sm text-[#8a4a00]">
          No school today. Showing Sunday's schedule.
        </p>
      )}

      <div
        className="mt-4 mb-4 grid grid-cols-5 gap-1.5 sm:gap-2"
        role="tablist"
        aria-label="Choose a day"
      >
        {DAY_TABS.map((day) => {
          const selected = day.key === selectedDay;
          return (
            <button
              key={day.key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setSelectedDay(day.key)}
              className={`relative min-h-11 min-w-0 rounded-xl px-1 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#134936] sm:text-sm ${
                selected
                  ? "bg-[#134936] text-white"
                  : "bg-white text-[#555c57] hover:bg-[#f0ede7]"
              }`}
            >
              {day.label}
              {day.key === todayKey && (
                <span
                  className={`absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full sm:right-2 ${
                    selected ? "bg-[#f3a000]" : "bg-[#134936]"
                  }`}
                  aria-label="today"
                />
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="animate-pulse space-y-3" aria-label="Loading schedule">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <div key={n} className="h-16 rounded-2xl bg-[#ece6dd]" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
        </div>
      )}

      {!loading && !error && (!classId || !nurseryId) && (
        <p className="rounded-xl bg-white p-5 text-center text-sm text-[#555c57] sm:p-6">
          Your account is not assigned to a class yet.
        </p>
      )}

      {!loading && !error && classId && nurseryId && slots.length === 0 && (
        <p className="rounded-xl bg-white p-5 text-center text-sm text-[#555c57] sm:p-6">
          No activities planned for this day.
        </p>
      )}

      {!loading && !error && slots.length > 0 && (
        <>
          {isToday && (
            <NowNextCard
              current={current}
              next={next}
              hasSlots={slots.length > 0}
            />
          )}
          <section
            className="relative flex min-w-0 flex-col gap-2.5"
            aria-label="Daily class schedule"
          >
            <div
              className="absolute bottom-4 left-[19px] top-4 z-0 w-0.5 bg-[#e8e0d4] sm:left-[21px]"
              aria-hidden="true"
            />
            {slots.map((slot) => (
              <EventCard
                key={slot.id}
                slot={slot}
                status={statusOf(slot)}
                isNext={next?.id === slot.id}
              />
            ))}
          </section>
        </>
      )}
    </main>
  );
}
