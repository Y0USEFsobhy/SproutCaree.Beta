// src/page/teacher/ChildProfile.jsx
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import {
  getAttendanceForDate,
  getChildById,
  getNoteForChild,
  getNotesForChild,
} from "../../services/api";
import { getLocalDate } from "../../utils/time";
import { getInitials } from "../../utils/initials";

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

// "2 years 7 months"
const getAge = (birthDate) => {
  if (!birthDate) return "";
  const birth = new Date(birthDate);
  const now = new Date();

  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return "";

  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (rest || !years) parts.push(`${rest} ${rest === 1 ? "month" : "months"}`);
  return parts.join(" ");
};

const formatDate = (isoDate) =>
  new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const NOTE_LABELS = {
  mood: { happy: "😊 Happy", calm: "😐 Calm", fussy: "😢 Fussy" },
  meal: {
    ate_all: "🍽️ Ate all",
    ate_some: "🥣 Ate some",
    none: "🚫 Didn't eat",
  },
  nap: { slept: "😴 Slept well", short: "💤 Short nap", none: "👀 No nap" },
};

const STATUS_STYLES = {
  present: { label: "Present", className: "bg-[#e3f2ea] text-brand" },
  late: { label: "Late", className: "bg-[#fff0dc] text-[#cd6700]" },
  absent: { label: "Absent", className: "bg-rose-50 text-rose-700" },
  none: { label: "Not recorded", className: "bg-[#f0ede7] text-[#777871]" },
};

// ---------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------
function Card({ title, children, className = "" }) {
  return (
    <section className={`rounded-2xl bg-white p-4 shadow-sm ${className}`}>
      {title && (
        <h2 className="mb-3 text-sm font-semibold text-brand">{title}</h2>
      )}
      {children}
    </section>
  );
}

function ContactButtons({ phone, name }) {
  const digits = phone.replace(/\D/g, "");

  return (
    <div className="mt-2 flex gap-2">
      <a
        href={`tel:${phone}`}
        aria-label={`Call ${name}`}
        className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white transition hover:opacity-90"
      >
        📞 Call
      </a>
      <a
        href={`https://wa.me/${digits}`}
        target="_blank"
        rel="noreferrer"
        aria-label={`WhatsApp ${name}`}
        className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#e3f2ea] px-4 text-sm font-semibold text-brand transition hover:bg-[#d3ebdf]"
      >
        💬 WhatsApp
      </a>
    </div>
  );
}

function PersonList({ heading, people }) {
  if (!people || people.length === 0) return null;

  return (
    <div className="mt-4 first:mt-0">
      <h3 className="mb-1 text-xs font-semibold tracking-wide text-[#777871] uppercase">
        {heading}
      </h3>
      <ul className="divide-y divide-[#f0ede7]">
        {people.map((person, index) => (
          <li
            key={`${person.name}-${index}`}
            className="py-3 first:pt-1 last:pb-0"
          >
            <p className="font-semibold text-[#262723]">{person.name}</p>
            <p className="text-sm text-[#555c57]">
              {[person.relation, person.phone].filter(Boolean).join(" · ")}
            </p>
            {person.phone && (
              <ContactButtons phone={person.phone} name={person.name} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NoteSummary({ note }) {
  const chips = [
    NOTE_LABELS.mood[note.mood],
    NOTE_LABELS.meal[note.meal],
    NOTE_LABELS.nap[note.nap],
  ].filter(Boolean);

  return (
    <div>
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
        <p className="mt-2 text-sm leading-snug text-[#262723]">{note.text}</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------
export default function ChildProfile() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const today = getLocalDate();

  const [child, setChild] = useState(null);
  const [status, setStatus] = useState(null);
  const [todayNote, setTodayNote] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!childId || !user?.nurseryId) {
        setLoading(false);
        setError("Couldn't load this profile. Please try again.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const found = await getChildById(childId, user.nurseryId);
        if (cancelled) return;
        setChild(found);
        if (!found) return;

        const [records, note, notes] = await Promise.all([
          getAttendanceForDate(user.nurseryId, today),
          getNoteForChild(found.id, user.nurseryId, today),
          getNotesForChild(found.id, user.nurseryId),
        ]);
        if (cancelled) return;

        const list = Array.isArray(records) ? records : [];
        setStatus(
          list.find((record) => String(record.childId) === String(found.id))
            ?.status ?? null,
        );
        setTodayNote(note);
        setHistory(
          (Array.isArray(notes) ? notes : [])
            .filter((n) => n.date !== today)
            .slice(0, 5),
        );
      } catch {
        if (!cancelled)
          setError("Couldn't load this profile. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [childId, user?.nurseryId, today]);

  const handleBack = () => {
    if (location.state?.from === "notes") {
      navigate("/teacher/notes", { state: { childId } });
      return;
    }
    navigate(-1);
  };

  const backButton = (
    <button
      type="button"
      onClick={handleBack}
      className="flex items-center mb-3 min-h-11 rounded-xl px-2 text-sm font-semibold text-brand hover:bg-[#e3f2ea]"
    >
      <img className="-rotate-90" width={20} src="/arrow.svg" alt="back" />
      Back
    </button>
  );

  const wrapper = "mx-auto w-full max-w-md px-4 pt-4 pb-6 text-[#262723]";

  // ----- Loading -----
  if (loading) {
    return (
      <main className={wrapper}>
        <div className="animate-pulse space-y-3" aria-label="Loading profile">
          <div className="h-24 rounded-2xl bg-[#ece6dd]" />
          <div className="h-32 rounded-2xl bg-[#ece6dd]" />
          <div className="h-32 rounded-2xl bg-[#ece6dd]" />
        </div>
      </main>
    );
  }

  // ----- Error / not found / not in this teacher's class -----
  if (error || !child || String(child.classId) !== String(user?.classId)) {
    const message = error
      ? error
      : !child
        ? "We couldn't find this child."
        : "This child is not in your class.";

    return (
      <main className={wrapper}>
        {backButton}
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {message}
        </p>
      </main>
    );
  }

  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.none;
  const age = getAge(child.birthDate);
  const allergies = child.allergies?.trim();
  const hasContacts =
    (child.parents?.length ?? 0) > 0 ||
    child.emergencyContact ||
    (child.authorizedPickup?.length ?? 0) > 0;

  return (
    <main className={wrapper}>
      {backButton}

      {/* Header */}
      <section className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
        <span
          className="grid h-16 w-16 flex-none place-items-center rounded-full bg-[#e3f2ea] text-xl font-bold text-brand"
          aria-hidden="true"
        >
          {getInitials(child.name)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold text-brand">
            {child.name}
          </h1>
          {age && <p className="text-sm text-[#555c57]">{age}</p>}
          <span
            className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs leading-none font-semibold ${statusStyle.className}`}
          >
            Today: {statusStyle.label}
          </span>
        </div>
      </section>

      {/* Safety alert (only when there is something to show) */}
      {allergies && (
        <div
          role="note"
          className="mt-3 rounded-2xl border border-[#f3a000]/50 bg-[#fff0dc] p-4"
        >
          <p className="text-xs font-semibold tracking-wide text-[#cd6700] uppercase">
            ⚠️ Allergies / medical alert
          </p>
          <p className="mt-1 font-semibold text-[#262723]">{allergies}</p>
        </div>
      )}

      {/* Today */}
      <Card title="Today" className="mt-3">
        {todayNote ? (
          <NoteSummary note={todayNote} />
        ) : (
          <p className="text-sm text-[#555c57]">No note added yet today.</p>
        )}

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() =>
              navigate("/teacher/notes", { state: { childId: child.id } })
            }
            className="min-h-11 flex-1 rounded-full bg-brand px-4 text-sm font-semibold text-white transition hover:opacity-90"
          >
            {todayNote ? "Edit note" : "Add note"}
          </button>
          {!status && (
            <Link
              to="/teacher/attendance"
              className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#e3f2ea] px-4 text-sm font-semibold text-brand transition hover:bg-[#d3ebdf]"
            >
              Mark attendance
            </Link>
          )}
        </div>
      </Card>

      {/* Contacts */}
      <Card title="Parents and contacts" className="mt-3">
        {hasContacts ? (
          <>
            <PersonList heading="Parents" people={child.parents} />
            <PersonList
              heading="Emergency contact"
              people={child.emergencyContact ? [child.emergencyContact] : []}
            />
            <PersonList
              heading="Authorized pickup"
              people={child.authorizedPickup}
            />
          </>
        ) : (
          <p className="text-sm text-[#555c57]">No contacts added yet.</p>
        )}
      </Card>

      {/* Care notes */}
      {child.careNotes?.trim() && (
        <Card title="Care notes from the parent" className="mt-3">
          <p className="text-sm leading-snug text-[#262723]">
            {child.careNotes}
          </p>
        </Card>
      )}

      {/* Recent notes */}
      <Card title="Recent notes" className="mt-3">
        {history.length === 0 ? (
          <p className="text-sm text-[#555c57]">No earlier notes yet.</p>
        ) : (
          <ul className="divide-y divide-[#f0ede7]">
            {history.map((note) => (
              <li key={note.id} className="py-3 first:pt-0 last:pb-0">
                <p className="mb-1.5 text-xs font-semibold text-[#777871]">
                  {formatDate(note.date)}
                </p>
                <NoteSummary note={note} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}
