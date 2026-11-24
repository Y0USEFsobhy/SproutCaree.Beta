import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { getClasses } from "../../services/api"; // ADAPT
import {
  addScheduleItem,
  deleteScheduleItem,
  getScheduleByClass,
  updateScheduleItem,
} from "../../services/api";
import ConfirmDialog from "../../components/admin/ConfirmDialog";

// ADAPT: replace with your shared fieldClass / labelClass imports
const fieldClass =
  "w-full rounded-xl border border-[#d9d3c9] bg-white px-3 py-2.5 text-sm text-[#262723] outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:opacity-60";
const labelClass = "mb-1 block text-sm font-semibold text-[#262723]";

const DAYS = [
  { key: "sunday", label: "Sunday" },
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
];

// ADAPT: use the `type` values you already have in Firestore
const TYPES = ["play", "learning", "meal", "rest", "outdoor", "other"];
const typeLabel = (t) => t.charAt(0).toUpperCase() + t.slice(1);

const emptyForm = (day) => ({
  activity: "",
  day,
  startTime: "09:00",
  endTime: "09:45",
  type: "play",
  description: "",
});

const fmt = (t) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

export default function SchedulePage() {
  const nurseryId = useSelector((s) => s.auth.user?.nurseryId); // ADAPT: your Redux path

  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState("");
  const [items, setItems] = useState([]);
  const [activeDay, setActiveDay] = useState(DAYS[0].key);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!nurseryId) return;
    (async () => {
      try {
        const c = await getClasses(nurseryId);
        setClasses(c);
        if (c.length) setClassId(String(c[0].id));
      } catch {
        setError("Could not load classes. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [nurseryId]);

  const loadItems = useCallback(async () => {
    if (!nurseryId || !classId) return;
    setLoadingItems(true);
    setError("");
    try {
      setItems(await getScheduleByClass(nurseryId, classId));
    } catch {
      setError("Could not load the schedule. Please try again.");
    } finally {
      setLoadingItems(false);
    }
  }, [nurseryId, classId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const byDay = useMemo(() => {
    const map = Object.fromEntries(DAYS.map((d) => [d.key, []]));
    items.forEach((i) => map[i.day]?.push(i));
    Object.values(map).forEach((list) =>
      list.sort((a, b) => a.startTime.localeCompare(b.startTime)),
    );
    return map;
  }, [items]);

  const handleSave = async (form) => {
    const payload = {
      nurseryId: String(nurseryId),
      classId: String(classId),
      day: form.day,
      activity: form.activity,
      description: form.description,
      type: form.type,
      startTime: form.startTime,
      endTime: form.endTime,
    };
    if (form.id) await updateScheduleItem(form.id, payload);
    else await addScheduleItem(payload);
    setEditing(null);
    await loadItems();
  };

  const handleDelete = async (id) => {
    await deleteScheduleItem(id);
    setEditing(null);
    await loadItems();
  };

  if (loading) {
    return (
      <>
        <div className="h-8 w-40 mb-10 animate-pulse rounded-xl bg-[#ece6dd]" />
        <div className="grid md:grid-cols-5 grid-cols-1 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl bg-[#ece6dd]"
            />
          ))}
        </div>
      </>
    );
  }

  if (!classes.length) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-brand">
          Schedule
        </h1>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-sm text-[#555c57]">
            Create a class first, then you can build its weekly schedule.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 ">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand">
            Schedule
          </h1>
          <p className="text-xs text-[#555c57]">
            Weekly timetable for each class
          </p>
        </div>
        <div className="w-full sm:w-64 flex items-center gap-4">
          <label htmlFor="class-select" className={labelClass}>
            Class
          </label>
          <select
            id="class-select"
            className={fieldClass}
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            {classes.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      <div
        role="tablist"
        aria-label="Days"
        className="flex gap-3 overflow-x-auto pb-1 md:hidden"
      >
        {DAYS.map((d) => (
          <button
            key={d.key}
            role="tab"
            aria-selected={activeDay === d.key}
            onClick={() => setActiveDay(d.key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              activeDay === d.key
                ? "bg-brand text-white"
                : "bg-white text-[#555c57] hover:bg-[#f5f1ea]"
            }`}
          >
            {d.label.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* main content */}
      <div className="grid gap-3 md:grid-cols-5  ">
        {DAYS.map((d) => (
          <section
            key={d.key}
            aria-label={d.label}
            className={`${activeDay === d.key ? "block" : "hidden"}  md:block`}
          >
            <div className=" space-y-3 rounded-2xl bg-white p-2 shadow-sm">
              <div className="flex items-center px-1 pt-2 justify-between gap-3">
                <h2 className="text-sm font-semibold text-[#262723]">
                  {d.label}
                </h2>
                <button
                  onClick={() => setEditing(emptyForm(d.key))}
                  aria-label={`Add activity on ${d.label}`}
                  className="rounded-full flex items-center gap-1    bg-[#e3f2ea] px-3 py-1.5 text-sm font-semibold text-[#1f7a4d] transition hover:bg-[#d3ebdf] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a4d]"
                >
                  <img src="/plus(green).svg" width={15} alt="add" />
                  Add
                </button>
              </div>

              {loadingItems ? (
                <div className="h-16 animate-pulse rounded-xl bg-[#ece6dd]" />
              ) : byDay[d.key].length === 0 ? (
                <p className="text-xs text-[#555c57]">No activities yet.</p>
              ) : (
                <ul className="space-y-3">
                  {byDay[d.key].map((i) => (
                    <li key={i.id}>
                      <button
                        onClick={() => setEditing(i)}
                        className="w-full cursor-pointer rounded-xl bg-[#f5f1ea] p-3 text-left transition hover:bg-[#e3f2ea] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a4d]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-[#1f7a4d]">
                            {fmt(i.startTime)} – {fmt(i.endTime)}
                          </p>
                          {i.type && (
                            <span className="rounded-full bg-[#e3f2ea] px-2 py-0.5 text-xs font-semibold text-[#1f7a4d]">
                              {typeLabel(i.type)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-[#262723]">
                          {i.activity}
                        </p>
                        {i.description && (
                          <p className="mt-1 text-xs text-[#555c57]">
                            {i.description}
                          </p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}
      </div>

      {editing && (
        <ActivityDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function ActivityDialog({ initial, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const isEdit = Boolean(initial.id);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.activity.trim())
      return setError("Please enter an activity name.");
    if (form.endTime <= form.startTime)
      return setError("End time must be after start time.");
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        activity: form.activity.trim(),
        description: form.description.trim(),
      });
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  const remove = () => {
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setSaving(true);

    try {
      await onDelete(initial.id);
      setShowConfirm(false);
    } catch {
      setError("Could not delete. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-title"
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-2xl bg-white p-4 shadow-sm"
      >
        <h2
          id="activity-title"
          className="text-sm font-semibold text-[#262723]"
        >
          {isEdit ? "Edit activity" : "Add activity"}
        </h2>

        <div>
          <label htmlFor="a-activity" className={labelClass}>
            Activity
          </label>
          <input
            id="a-activity"
            autoFocus
            className={fieldClass}
            placeholder="e.g. Circle time, Snack, Art"
            value={form.activity}
            onChange={set("activity")}
            disabled={saving}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="a-day" className={labelClass}>
              Day
            </label>
            <select
              id="a-day"
              className={fieldClass}
              value={form.day}
              onChange={set("day")}
              disabled={saving}
            >
              {DAYS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="a-type" className={labelClass}>
              Type
            </label>
            <select
              id="a-type"
              className={fieldClass}
              value={form.type}
              onChange={set("type")}
              disabled={saving}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {typeLabel(t)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="a-start" className={labelClass}>
              Start
            </label>
            <input
              id="a-start"
              type="time"
              className={fieldClass}
              value={form.startTime}
              onChange={set("startTime")}
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="a-end" className={labelClass}>
              End
            </label>
            <input
              id="a-end"
              type="time"
              className={fieldClass}
              value={form.endTime}
              onChange={set("endTime")}
              disabled={saving}
            />
          </div>
        </div>

        <div>
          <label htmlFor="a-desc" className={labelClass}>
            Description (optional)
          </label>
          <textarea
            id="a-desc"
            rows={2}
            className={fieldClass}
            value={form.description}
            onChange={set("description")}
            disabled={saving}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#196640] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full bg-[#f5f1ea] px-5 py-2.5 text-sm font-semibold text-[#262723] transition hover:bg-[#ece6dd] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-60"
          >
            Cancel
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={remove}
              disabled={saving}
              className="ml-auto rounded-full border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 disabled:opacity-60"
            >
              Delete
            </button>
          )}
        </div>
      </form>
      <ConfirmDialog
        open={showConfirm}
        title="Delete activity?"
        message="Are you sure you want to delete this activity? This action cannot be undone."
        confirmLabel="Delete"
        danger={true}
        busy={saving}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
