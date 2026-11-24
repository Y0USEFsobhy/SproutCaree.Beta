// src/page/teacher/NotesPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  getChildrenForClass,
  getNotesForDate,
  saveNote,
} from "../../services/api";
import { Link, useLocation, useNavigate } from "react-router";
import { getInitials } from "../../utils/initials";
import { getLocalDate } from "../../utils/time";
// import { debugRules } from "../../services/debug";

const MOODS = [
  { value: "happy", label: "Happy", icon: "😊" },
  { value: "calm", label: "Calm", icon: "😐" },
  { value: "fussy", label: "Fussy", icon: "😢" },
];

const MEALS = [
  { value: "ate_all", label: "Ate all", icon: "🍽️" },
  { value: "ate_some", label: "Ate some", icon: "🥣" },
  { value: "none", label: "Didn't eat", icon: "🚫" },
];

const NAPS = [
  { value: "slept", label: "Slept well", icon: "😴" },
  { value: "short", label: "Short nap", icon: "💤" },
  { value: "none", label: "No nap", icon: "👀" },
];

const FILTERS = [
  { key: "needs", label: "Needs note" },
  { key: "done", label: "Done" },
  { key: "all", label: "All" },
];

// ---------------------------------------------------------------
// One group of tap options (mood / meal / nap)
// ---------------------------------------------------------------
function OptionGroup({ legend, options, value, onChange }) {
  return (
    <fieldset className="mb-5">
      <legend className="mb-2 text-sm font-semibold text-brand">
        {legend}
      </legend>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(selected ? "" : option.value)}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                selected
                  ? "border-brand bg-brand text-white"
                  : "border-[#e8e0d4] bg-white text-[#555c57] hover:bg-[#f0ede7]"
              }`}
            >
              <span className="text-xl" aria-hidden="true">
                {option.icon}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

// ---------------------------------------------------------------
// Note form for one child
// ---------------------------------------------------------------
function NoteForm({ child, existing, saving, error, onSave, onBack }) {
  const isGroup = child.id === "group";
  const [mood, setMood] = useState(existing?.mood ?? "");
  const [meal, setMeal] = useState(existing?.meal ?? "");
  const [nap, setNap] = useState(existing?.nap ?? "");
  const [text, setText] = useState(existing?.text ?? "");
  const [formError, setFormError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!mood && !meal && !nap && !text.trim()) {
      setFormError("Choose at least one option or write a note.");
      return;
    }

    setFormError("");
    onSave({ mood, meal, nap, text: text.trim() });
  };

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="button"
        onClick={onBack}
        className="flex items-center mb-3 min-h-11 rounded-xl px-2 text-sm font-semibold text-brand hover:bg-[#e3f2ea]"
      >
        <img src="/arrow.svg" width={20} className="-rotate-90" alt="arrow" />
        Back to list
      </button>

      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex  gap-3 items-center">
          {!isGroup && (
            <span
              className="grid h-12 w-12 place-items-center rounded-full bg-[#e3f2ea] text-sm font-bold text-brand"
              aria-hidden="true"
            >
              {getInitials(child.name)}
            </span>
          )}
          <div>
            <h1 className="text-xl font-bold text-brand">{child.name}</h1>
            <p className="text-sm text-[#555c57]">
              {existing ? "Edit today's note" : "New note for today"}
            </p>
          </div>
        </div>
        {!isGroup && (
          <Link
            className="flex min-w-0 items-center gap-1.5 bg-gray-300/20 hover:bg-[#e3f2ea] duration-300  p-3 rounded-2xl"
            to={`/teacher/children/${child.id}`}
            state={{ from: "notes" }}
          >
            view child profile
            <img
              src="/arrow.svg"
              width={20}
              className="rotate-90 "
              alt="arrow"
            />
          </Link>
        )}
      </div>

      <OptionGroup
        legend="Mood"
        options={MOODS}
        value={mood}
        onChange={setMood}
      />
      <OptionGroup
        legend="Meal"
        options={MEALS}
        value={meal}
        onChange={setMeal}
      />
      <OptionGroup legend="Nap" options={NAPS} value={nap} onChange={setNap} />

      <label className="mb-5 block">
        <span className="mb-2 block text-sm font-semibold text-brand">
          Note for the parent (optional)
        </span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={500}
          rows={4}
          placeholder={`${!isGroup ? child.name.split(" ")[0] : ""} enjoyed the painting activity today…`}
          className="w-full resize-none rounded-xl border border-[#e8e0d4] bg-white p-3 text-sm text-[#262723] placeholder:text-[#9a9d97] focus:border-brand focus:outline-none"
        />
        <span className="mt-1 block text-right text-xs text-[#777871]">
          {text.length}/500
        </span>
      </label>

      {(formError || error) && (
        <p
          role="alert"
          className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {formError || error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 bg-[#fff8f2]/90 px-4 py-3 backdrop-blur">
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-brand py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving…" : existing ? "Update note" : "Save note"}
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------
export default function NotesPage() {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const navigate = useNavigate();
  const today = getLocalDate();
  //   useEffect(() => { debugRules(user); }, []);

  const [children, setChildren] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState("needs");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState(null);
  const [resumeChildId, setResumeChildId] = useState(
    () => location.state?.childId ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [toast, setToast] = useState("");

  const [selectedChildren, setSelectedChildren] = useState([]);
  const [groupOptions, setGroupOptions] = useState(false);
  const [groupForm, setGroupForm] = useState(false);

  const toggleChild = (childId) => {
    setSelectedChildren((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId],
    );
  };

  // Pick up childId when navigating back from profile / "Edit note"
  const navChildId = location.state?.childId ?? null;
  if (navChildId && navChildId !== resumeChildId) {
    setResumeChildId(navChildId);
  }

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user?.classId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");

      try {
        const [childrenResult, notesResult] = await Promise.all([
          getChildrenForClass(user.classId, user.nurseryId),
          getNotesForDate(user.nurseryId, today),
        ]);

        if (!cancelled) {
          setChildren(childrenResult);
          setNotes(notesResult);
        }
      } catch (err) {
        if (!cancelled)
          setError("Couldn't load the notes. Please try again." + err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.classId, user?.nurseryId, today]);

  // Clear one-shot navigation state so Back to list stays on the list
  useEffect(() => {
    if (!location.state?.childId) return;
    navigate(".", { replace: true, state: {} });
  }, [location.state, navigate]);

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const noteByChild = useMemo(
    () => Object.fromEntries(notes.map((note) => [String(note.childId), note])),
    [notes],
  );

  const formChild =
    selected ??
    (resumeChildId
      ? children.find((child) => String(child.id) === String(resumeChildId))
      : null) ??
    null;

  const doneCount = children.filter(
    (child) => noteByChild[String(child.id)],
  ).length;
  const percent = children.length
    ? Math.round((doneCount / children.length) * 100)
    : 0;

  const visibleChildren = children.filter((child) => {
    const hasNote = Boolean(noteByChild[String(child.id)]);
    if (filter === "needs" && hasNote) return false;
    if (filter === "done" && !hasNote) return false;
    return child.name.toLowerCase().includes(search.trim().toLowerCase());
  });

  const closeForm = () => {
    setSelected(null);
    setResumeChildId(null);
    setSaveError("");
  };

  const handleSave = async (values) => {
    if (!formChild) return;

    setSaving(true);
    setSaveError("");

    try {
      const saved = await saveNote({
        nurseryId: user.nurseryId,
        childId: formChild.id,
        teacherId: user.id,
        parentUids: formChild.parentUids ?? [],
        date: today,
        ...values,
      });

      setNotes((previous) => [
        ...previous.filter(
          (note) => String(note.childId) !== String(formChild.id),
        ),
        saved,
      ]);
      setToast(`Note saved for ${formChild.name}`);
      closeForm();
    } catch {
      setSaveError("Couldn't save the note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGroup = async (values) => {
    const selectedChildrenData = children.filter((child) =>
      selectedChildren.some((id) => String(id) === String(child.id)),
    );

    if (!selectedChildrenData.length) return;

    setSaving(true);
    setSaveError("");

    try {
      const savedNotes = await Promise.all(
        selectedChildrenData.map((child) =>
          saveNote({
            nurseryId: user.nurseryId,
            childId: child.id,
            teacherId: user.id,
            parentUids: child.parentUids ?? [],
            date: today,
            ...values,
          }),
        ),
      );

      setNotes((previous) => [
        ...previous.filter(
          (note) =>
            !selectedChildren.some((id) => String(id) === String(note.childId)),
        ),
        ...savedNotes,
      ]);

      setToast(`Notes saved for ${savedNotes.length} children`);
      setSelectedChildren([]);
      setGroupOptions(false);
      setGroupForm(false);
    } catch (err) {
      console.error("Failed to save group notes:", err);
      setSaveError("Couldn't save all the notes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const openChild = (child) => {
    setSaveError("");
    setResumeChildId(null);
    setSelected(child);
  };
  if (groupForm) {
    return (
      <div className="mx-auto w-full max-w-md px-4 pt-4 pb-6 text-[#262723]">
        <h2 className="mb-2 text-lg font-bold text-brand">Group Notes</h2>

        <p className="mb-4 text-sm text-gray-600">
          This note will be saved for {selectedChildren.length} children.
        </p>

        <NoteForm
          key="group-notes"
          child={{
            id: "group",
            name: `${selectedChildren.length} selected children`,
          }}
          existing={null}
          saving={saving}
          error={saveError}
          onSave={handleSaveGroup}
          onBack={() => {
            setGroupOptions(false);
            setSaveError("");
            setGroupForm(false);
            setSelectedChildren([]);
          }}
        />
      </div>
    );
  }

  // ----- Form view -----
  if (formChild) {
    return (
      <main className="mx-auto w-full max-w-md px-4 pt-4 pb-6 text-[#262723]">
        <NoteForm
          key={formChild.id}
          child={formChild}
          existing={noteByChild[String(formChild.id)]}
          saving={saving}
          error={saveError}
          onSave={handleSave}
          onBack={closeForm}
        />
      </main>
    );
  }

  // ----- List view -----
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <main className="mx-auto w-full max-w-md px-4 pt-4 pb-6 text-[#262723]">
      <h1 className="text-2xl font-bold tracking-tight text-brand">
        Daily Notes
      </h1>
      <p className="mt-1 text-sm text-[#555c57]">{dateLabel}</p>

      {toast && (
        <p
          role="status"
          className="mt-3 rounded-xl bg-[#e3f2ea] p-3 text-sm font-medium text-brand"
        >
          ✓ {toast}
        </p>
      )}

      {/* Progress */}
      {!loading && !error && children.length > 0 && (
        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-brand">
              {doneCount} of {children.length} notes done
            </span>
            <span className="text-[#777871]">{percent}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#ece6dd]">
            <div
              className="h-2 rounded-full bg-brand transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Search + filters */}
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search children…"
        aria-label="Search children"
        className="mt-4 w-full rounded-xl border border-[#e8e0d4] bg-white px-4 py-3 text-sm placeholder:text-[#9a9d97] focus:border-brand focus:outline-none"
      />
      <div className="flex flex-col mb-4">
        <div
          className="mt-3 mb-2 flex  gap-2"
          role="group"
          aria-label="Filter notes"
        >
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(item.key)}
                className={`min-h-11 flex-1 rounded-xl text-sm font-semibold transition ${
                  active
                    ? "bg-brand text-white"
                    : "bg-white text-[#555c57] hover:bg-[#f0ede7]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setGroupOptions(!groupOptions)}
          className={`min-h-11 flex-1 rounded-xl text-sm font-semibold transition border border-brand text-brand ${groupOptions ? "bg-[#e3f2ea] border" : "bg-white"}`}
        >
          {groupOptions ? "Deselect group" : "Select a Group"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="animate-pulse space-y-3" aria-label="Loading notes">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-16 rounded-2xl bg-[#ece6dd]" />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      {/* No class */}
      {!loading && !error && !user?.classId && (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-[#555c57]">
          Your account is not assigned to a class yet.
        </p>
      )}

      {/* Empty states */}
      {!loading && !error && user?.classId && children.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-[#555c57]">
          There are no children in your class yet.
        </p>
      )}

      {!loading &&
        !error &&
        children.length > 0 &&
        visibleChildren.length === 0 && (
          <p className="rounded-xl bg-white p-6 text-center text-sm text-[#555c57]">
            {filter === "needs" && !search
              ? "All notes are done for today 🎉"
              : "No children match."}
          </p>
        )}

      {/* Children */}
      {!loading && !error && visibleChildren.length > 0 && (
        <ul className="space-y-2.5">
          {visibleChildren.map((child) => {
            const hasNote = Boolean(noteByChild[String(child.id)]);
            const isSelected = selectedChildren.includes(child.id);

            return (
              <li key={child.id}>
                <button
                  type="button"
                  onClick={() =>
                    groupOptions ? toggleChild(child.id) : openChild(child)
                  }
                  aria-pressed={isSelected}
                  className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border p-3 text-left shadow-sm transition 
                    ${
                      (isSelected && groupOptions)
                        ? "border-[#3b8060] bg-[#f0f8f3]"
                        : "border-transparent bg-white hover:shadow-md"
                    }
                  `}
                >
                  <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-[#e3f2ea] text-sm font-bold text-brand">
                    {getInitials(child.name)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-[#262723]">
                      {child.name}
                    </span>

                    <span
                      className={`mt-1 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        hasNote
                          ? "bg-[#e3f2ea] text-brand"
                          : "bg-[#fff0dc] text-[#cd6700]"
                      }`}
                    >
                      {hasNote ? "Note added" : "Not yet"}
                    </span>
                  </span>

                  {groupOptions ? (
                    <span
                      className={`grid h-6 w-6 flex-none place-items-center rounded-md border ${
                        isSelected
                          ? "border-[#3b8060] bg-[#3b8060] text-white"
                          : "border-gray-300 bg-white"
                      }`}
                      aria-hidden="true"
                    >
                      {/* {isSelected && "✓"} */}
                      {isSelected && (
                        <img src="/check.svg" width={18} alt="check" />
                      )}
                    </span>
                  ) : (
                    <img src="/chevron.svg" width={15} alt="arrow" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {groupOptions && selectedChildren.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setGroupForm(true);
          }}
          disabled={selectedChildren.length === 0}
          className="mt-4 w-full rounded-xl bg-brand px-4 py-3
             font-semibold text-white disabled:opacity-50"
        >
          Add Note for Selected Children ({selectedChildren.length})
        </button>
      )}
    </main>
  );
}
