// src/utils/childUpdates.js
// Shared by ParentHome and UpdatesPage (and later the other parent pages).

export const NOTE_LABELS = {
  mood: { happy: "😊 Happy", calm: "😐 Calm", fussy: "😢 Fussy" },
  meal: { ate_all: "🍽️ Ate all", ate_some: "🥣 Ate some", none: "🚫 Didn't eat" },
  nap: { slept: "😴 Slept well", short: "💤 Short nap", none: "👀 No nap" },
};

export const ATTENDANCE_STATUS = {
  present: {
    label: "Present",
    chip: "bg-[#e3f2ea] text-brand",
    message: "is at nursery today",
  },
  late: {
    label: "Late",
    chip: "bg-[#fff0dc] text-[#cd6700]",
    message: "arrived a little late today",
  },
  absent: {
    label: "Absent",
    chip: "bg-rose-50 text-rose-700",
    message: "was marked absent today",
  },
  none: {
    label: "Not recorded yet",
    chip: "bg-[#f0ede7] text-[#777871]",
    message: "attendance has not been recorded yet",
  },
};

const toLocalISO = (date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

// "2026-10-24" -> "Today" | "Yesterday" | "Fri, Oct 23"
export const formatDayLabel = (isoDate) => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isoDate === toLocalISO(now)) return "Today";
  if (isoDate === toLocalISO(yesterday)) return "Yesterday";

  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

// ISO time -> "10:42 AM"
export const formatUpdateTime = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};
