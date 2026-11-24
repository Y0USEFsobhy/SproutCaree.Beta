import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  getClasses,
  addClass,
  updateClass,
  deleteClass,
  getChildren,
  getAllTeachersForNursery as getTeachers,
} from "../../services/api";
import AddBtn from "../../components/admin/AddBtn";

// Replace these two with your existing shared fieldClass / labelClass imports.
const fieldClass =
  "w-full rounded-xl border border-[#ece6dd] bg-white px-3 py-2 text-sm text-[#262723] placeholder:text-[#555c57]/60 focus:border-[#1f7a4d] focus:outline-none focus:ring-2 focus:ring-[#1f7a4d]/30 disabled:opacity-60";
const labelClass = "mb-1 block text-sm font-semibold text-[#262723]";

const primaryBtn =
  "cursor-pointer inline-flex min-h-[44px] items-center  justify-center rounded-full bg-[#1f7a4d] px-5 text-sm font-semibold text-white transition hover:bg-[#19633e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a4d] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";
const ghostBtn =
  "cursor-pointer inline-flex min-h-[44px] items-center justify-center rounded-full px-4 text-sm font-semibold text-[#262723] transition hover:bg-[#f5f1ea] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a4d] disabled:cursor-not-allowed disabled:opacity-50";
const dangerBtn =
  "cursor-pointer inline-flex min-h-[44px] items-center justify-center rounded-full bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

/* ---------- Dialog shell ---------- */
function Dialog({ title, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector("input, button")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-sm"
      >
        <h2 className="mb-4 text-sm font-semibold text-[#262723]">{title}</h2>
        {children}
      </div>
    </div>
  );
}

/* ---------- Add / edit form ---------- */
function ClassFormDialog({ initial, existingNames, onClose, onSave }) {
  const isEdit = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [ageGroup, setAgeGroup] = useState(initial?.ageGroup ?? "");
  const [capacity, setCapacity] = useState(initial?.capacity ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Please enter the class name.");
    if (existingNames.includes(trimmed.toLowerCase()))
      return setError("A class with this name already exists.");
    if (capacity !== "" && Number(capacity) < 1)
      return setError("Capacity must be at least 1.");

    setSaving(true);
    setError("");
    try {
      await onSave({
        name: trimmed,
        ageGroup: ageGroup.trim(),
        capacity: capacity === "" ? null : Number(capacity),
      });
    } catch {
      setError("Could not save the class. Please try again.");
      setSaving(false);
    }
  };

  return (
    <Dialog title={isEdit ? "Edit class" : "Add class"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="class-name" className={labelClass}>
            Class name
          </label>
          <input
            id="class-name"
            className={fieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sunflowers"
            disabled={saving}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="class-age" className={labelClass}>
              Age group
            </label>
            <input
              id="class-age"
              className={fieldClass}
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              placeholder="e.g. 2–3 years"
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="class-capacity" className={labelClass}>
              Capacity
            </label>
            <input
              id="class-capacity"
              type="number"
              min="1"
              inputMode="numeric"
              className={fieldClass}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Optional"
              disabled={saving}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-rose-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className={ghostBtn}
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className={primaryBtn} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add class"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

/* ---------- Delete confirm ---------- */
function ConfirmDeleteDialog({ cls, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      setError(err?.message || "Could not delete the class. Please try again.");
      setBusy(false);
    }
  };

  return (
    <Dialog title="Delete class" onClose={onClose}>
      <p className="text-sm text-[#555c57]">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-[#262723]">{cls.name}</span>? This
        can't be undone.
      </p>
      {error && (
        <p role="alert" className="mt-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          className={ghostBtn}
          onClick={onClose}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className={dangerBtn}
          onClick={confirm}
          disabled={busy}
        >
          {busy ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Dialog>
  );
}

/* ---------- Page ---------- */
export default function ClassesPage() {
  const nurseryId = useSelector((s) => s.auth?.user?.nurseryId);

  const [classes, setClasses] = useState([]);
  const [children, setChildren] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formFor, setFormFor] = useState(null); // null | "new" | class object
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [c, ch, t] = await Promise.all([
        getClasses(nurseryId),
        getChildren(nurseryId),
        getTeachers(nurseryId),
      ]);
      setClasses(c);
      setChildren(ch);
      setTeachers(t);
    } catch {
      setError("Could not load classes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (nurseryId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nurseryId]);

  // classId -> { children: n, teachers: [names] }
  const usage = useMemo(() => {
    const map = {};
    classes.forEach((c) => (map[c.id] = { children: 0, teachers: [] }));
    children.forEach((ch) => map[ch.classId] && map[ch.classId].children++);
    teachers.forEach(
      (t) => map[t.classId] && map[t.classId].teachers.push(t.name),
    );
    return map;
  }, [classes, children, teachers]);

  const sorted = useMemo(
    () => [...classes].sort((a, b) => a.name.localeCompare(b.name)),
    [classes],
  );

  const existingNames = useMemo(
    () =>
      classes
        .filter((c) => c.id !== formFor?.id)
        .map((c) => c.name.trim().toLowerCase()),
    [classes, formFor],
  );

  const handleSave = async (data) => {
    if (formFor && formFor !== "new") {
      await updateClass(formFor.id, data);
    } else {
      await addClass({ ...data, nurseryId });
    }
    setFormFor(null);
    await load();
  };

  const handleDelete = async () => {
    // Re-check against fresh data so a stale screen can't delete a class in use.
    const [ch, t] = await Promise.all([
      getChildren(nurseryId),
      getTeachers(nurseryId),
    ]);
    const inUse =
      ch.some((x) => x.classId === deleting.id) ||
      t.some((x) => x.classId === deleting.id);
    if (inUse) {
      setChildren(ch);
      setTeachers(t);
      throw new Error(
        "This class now has children or teachers. Move them first.",
      );
    }
    await deleteClass(deleting.id);
    setDeleting(null);
    await load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand">
            Classes
          </h1>
          <p className="text-xs text-[#555c57]">
            {loading
              ? "Loading…"
              : `${classes.length} ${classes.length === 1 ? "class" : "classes"}`}
          </p>
        </div>
        <AddBtn onClick={() => setFormFor("new")} label={"class"} />
      </div>

      {error && (
        <div
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4"
          role="alert"
        >
          <p className="text-sm text-rose-700">{error}</p>
          <button type="button" className={`${ghostBtn} mt-2`} onClick={load}>
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-[#ece6dd]"
            />
          ))}
        </div>
      ) : sorted.length === 0 && !error ? (
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#262723]">No classes yet</p>
          <p className="mt-1 text-xs text-[#555c57]">
            Add your first class to start organising children and teachers.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((c) => {
            const u = usage[c.id] || { children: 0, teachers: [] };
            const inUse = u.children > 0 || u.teachers.length > 0;
            return (
              <li key={c.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-[#262723]">
                      {c.name}
                    </h2>
                    {c.ageGroup && (
                      <p className="text-xs text-[#555c57]">{c.ageGroup}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-[#e3f2ea] px-2.5 py-1 text-xs font-semibold text-[#1f7a4d]">
                    {u.children}
                    {c.capacity ? ` / ${c.capacity}` : ""} children
                  </span>
                </div>

                <p className="mt-3 text-sm text-[#555c57]">
                  {u.teachers.length
                    ? `Teacher: ${u.teachers.join(", ")}`
                    : "No teacher assigned"}
                </p>

                <div className="mt-3 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    className={ghostBtn}
                    onClick={() => setFormFor(c)}
                    aria-label={`Edit ${c.name}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className={`${ghostBtn} text-rose-700 hover:bg-rose-50`}
                    onClick={() => setDeleting(c)}
                    disabled={inUse}
                    title={
                      inUse
                        ? "Move its children and teachers to another class first"
                        : undefined
                    }
                    aria-label={`Delete ${c.name}`}
                  >
                    Delete
                  </button>
                </div>
                {inUse && (
                  <p className="text-right text-xs text-[#555c57]">
                    Can't delete while it has children or teachers.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {formFor && (
        <ClassFormDialog
          initial={formFor === "new" ? null : formFor}
          existingNames={existingNames}
          onClose={() => setFormFor(null)}
          onSave={handleSave}
        />
      )}
      {deleting && (
        <ConfirmDeleteDialog
          cls={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
