import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  getAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../../services/api";
import AddBtn from "../../components/admin/AddBtn";

const fieldClass =
  "w-full rounded-xl border border-[#d9d3c8] bg-white px-3 py-2.5 text-sm text-[#262723] placeholder:text-[#555c57]/60 focus:border-[#1f7a4d] focus:outline-none focus:ring-2 focus:ring-[#1f7a4d]/30 disabled:opacity-60";
const labelClass = "mb-1 block text-sm font-semibold text-[#262723]";

const AUDIENCES = [
  { value: "all", label: "Everyone" },
  { value: "parents", label: "Parents" },
  { value: "teachers", label: "Teachers" },
];
const audienceLabel = (v) => AUDIENCES.find((a) => a.value === v)?.label ?? v;

const EMPTY_FORM = { title: "", body: "", audience: "all", pinned: false };

const formatDate = (ms) =>
  ms
    ? new Date(ms).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

/* ---------- small shared bits ---------- */

function PrimaryBtn({ className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`curosr-pointer inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:bg-[#1a6841] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a4d] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    />
  );
}

function SecondaryBtn({ className = "", ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`cursor-pointer inline-flex min-h-11 items-center justify-center rounded-full bg-[#e3f2ea] px-5 text-sm font-semibold text-[#1f7a4d] transition hover:bg-[#d3ebdf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a4d] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    />
  );
}

function Skeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl bg-white p-4 shadow-sm"
        >
          <div className="h-4 w-1/3 rounded bg-[#ece6dd]" />
          <div className="mt-3 h-3 w-full rounded bg-[#ece6dd]" />
          <div className="mt-2 h-3 w-2/3 rounded bg-[#ece6dd]" />
        </div>
      ))}
    </div>
  );
}

/* ---------- dialog (add / edit / delete confirm) ---------- */

function AnnouncementDialog({ mode, item, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(
    item
      ? {
          title: item.title,
          body: item.body,
          audience: item.audience,
          pinned: !!item.pinned,
        }
      : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setError("Please add a title and a message.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        ...form,
        title: form.title.trim(),
        body: form.body.trim(),
      });
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setError("");
    try {
      await onDelete(item);
    } catch {
      setError("Could not delete the announcement. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#262723]/40 p-4 sm:items-center"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-dialog-title"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-sm sm:p-5"
      >
        <h2
          id="announcement-dialog-title"
          className="text-sm font-semibold text-[#262723]"
        >
          {confirmDelete
            ? "Delete announcement"
            : mode === "edit"
              ? "Edit announcement"
              : "New announcement"}
        </h2>

        {confirmDelete ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-[#555c57]">
              Delete “{item.title}”? Parents and teachers will no longer see it.
            </p>
            {error && (
              <p role="alert" className="text-sm text-rose-700">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <SecondaryBtn
                onClick={() => setConfirmDelete(false)}
                disabled={saving}
              >
                Cancel
              </SecondaryBtn>
              <button
                type="button"
                onClick={remove}
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4" noValidate>
            <div>
              <label htmlFor="ann-title" className={labelClass}>
                Title
              </label>
              <input
                id="ann-title"
                className={fieldClass}
                value={form.title}
                onChange={set("title")}
                maxLength={80}
                placeholder="e.g. Trip to the farm on Sunday"
                disabled={saving}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="ann-body" className={labelClass}>
                Message
              </label>
              <textarea
                id="ann-body"
                className={`${fieldClass} min-h-28 resize-y`}
                value={form.body}
                onChange={set("body")}
                placeholder="Write the details here…"
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="ann-audience" className={labelClass}>
                Send to
              </label>
              <select
                id="ann-audience"
                className={fieldClass}
                value={form.audience}
                onChange={set("audience")}
                disabled={saving}
              >
                {AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[#262723]">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={set("pinned")}
                disabled={saving}
                className="h-4 w-4 rounded border-[#d9d3c8] accent-[#1f7a4d] focus-visible:ring-2 focus-visible:ring-[#1f7a4d]"
              />
              Pin to the top
            </label>

            {error && (
              <p role="alert" className="text-sm text-rose-700">
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              {mode === "edit" ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={saving}
                  className="curosr-pointer min-h-11 rounded-full px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 disabled:opacity-60"
                >
                  Delete
                </button>
              ) : (
                <span />
              )}
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <SecondaryBtn onClick={onClose} disabled={saving}>
                  Cancel
                </SecondaryBtn>
                <PrimaryBtn type="submit" disabled={saving}>
                  {saving
                    ? "Saving…"
                    : mode === "edit"
                      ? "Save changes"
                      : "Publish"}
                </PrimaryBtn>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
/* ---------- page ---------- */
export default function AnnouncementsPage() {
  const user = useSelector((s) => s.auth.user);
  const nurseryId = user?.nurseryId;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all-items");
  const [dialog, setDialog] = useState(null); // { mode, item }

  const load = useCallback(async () => {
    if (!nurseryId) return;
    setLoading(true);
    setError("");
    try {
      setItems(await getAnnouncements(nurseryId));
    } catch {
      setError("Could not load announcements. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [nurseryId]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    return items
      .filter((a) => filter === "all-items" || a.audience === filter)
      .sort(
        (a, b) =>
          Number(!!b.pinned) - Number(!!a.pinned) ||
          (b.createdAt ?? 0) - (a.createdAt ?? 0),
      );
  }, [items, filter]);

  const handleSave = async (data) => {
    if (dialog.mode === "edit") {
      await updateAnnouncement(dialog.item.id, data);
      setItems((prev) =>
        prev.map((a) => (a.id === dialog.item.id ? { ...a, ...data } : a)),
      );
    } else {
      const created = await addAnnouncement({
        ...data,
        nurseryId,
        authorUid: user?.uid ?? null,
      });
      setItems((prev) => [created, ...prev]);
    }
    setDialog(null);
  };

  const handleDelete = async (item) => {
    await deleteAnnouncement(item.id);
    setItems((prev) => prev.filter((a) => a.id !== item.id));
    setDialog(null);
  };

  const filters = [{ value: "all-items", label: "All" }, ...AUDIENCES];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand">
            Announcements
          </h1>
          <p className="text-sm text-[#555c57] ">
            Share news and reminders with parents and teachers.
          </p>
        </div>
        <AddBtn
          onClick={() => setDialog({ mode: "new", item: null })}
          label={"announcement"}
        />
      </div>

      <div
        role="group"
        aria-label="Filter by audience"
        className="flex flex-wrap gap-3"
      >
        {filters.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              aria-pressed={active}
              className={`cursor-pointer min-h-10 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a4d] ${
                active
                  ? "bg-[#e3f2ea] text-[#1f7a4d]"
                  : "bg-text-[#555c57] shadow-sm hover:bg-[#f5f1ea]"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <Skeleton />
      ) : error ? (
        <div className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p role="alert" className="text-sm text-rose-700">
            {error}
          </p>
          <SecondaryBtn onClick={load}>Try again</SecondaryBtn>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
          <p className="text-sm font-semibold text-[#262723]">
            No announcements yet
          </p>
          <p className="mt-1 text-xs text-[#555c57]">
            Tap Add announcement” to share your first one.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {visible.map((a) => (
            <li key={a.id}>
              <article className="rounded-2xl bg-white w-full p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-[#262723]">
                        {a.title}
                      </h2>
                      {a.pinned && (
                        <span className="rounded-full bg-[#e3f2ea] px-2 py-0.5 text-xs font-semibold text-[#1f7a4d]">
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#555c57]">
                      {audienceLabel(a.audience)} · {formatDate(a.createdAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDialog({ mode: "edit", item: a })}
                    className="cursor-pointer bg-[#f0ede7] min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold text-[#1f7a4d] transition hover:bg-[#f5f1ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a4d]"
                    aria-label={`Edit ${a.title}`}
                  >
                    Edit
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-line wrap-break-word text-sm text-[#262723]">
                  {a.body}
                </p>
              </article>
            </li>
          ))}
        </ul>
      )}

      {dialog && (
        <AnnouncementDialog
          mode={dialog.mode}
          item={dialog.item}
          onClose={() => setDialog(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
