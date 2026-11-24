import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useSelector } from "react-redux";
import BackBtn from "../../components/admin/BackBtn";
import {
  getTeacher,
  getClasses,
  addTeacher,
  updateTeacher,
  deleteTeacher,
} from "../../services/api";

const EMPTY = { name: "", email: "", phone: "", classId: "", password: "" };
const fieldClass =
  "min-h-11 w-full rounded-xl border border-[#e8e0d4] bg-white px-4 text-sm text-[#262723] placeholder:text-[#9a9d97] focus:border-brand focus:outline-none disabled:bg-[#f5f1ea] disabled:text-[#7a7d77]";
const labelClass = "mb-1 block text-sm font-semibold text-[#262723]";

function Card({ title, hint, children, className = "" }) {
  return (
    <section className={`rounded-2xl bg-white p-5 shadow-sm ${className}`}>
      <h2 className="text-sm font-semibold text-brand">{title}</h2>
      {hint && <p className="mt-1 mb-3 text-xs text-[#777871]">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </section>
  );
}

export default function TeacherForm() {
  const { teacherId } = useParams(); // undefined on /admin/teacher/new
  const isEdit = Boolean(teacherId);
  const navigate = useNavigate();
  const nurseryId = useSelector((states) => states.auth.user.nurseryId);

  const [form, setForm] = useState(EMPTY);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  // Load classes (+ the teacher when editing)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [cls, teacher] = await Promise.all([
          getClasses(nurseryId),
          isEdit ? getTeacher(nurseryId, teacherId) : Promise.resolve(null),
        ]);
        if (!active) return;
        setClasses(cls);
        if (teacher) {
          setForm({
            name: teacher.name ?? "",
            email: teacher.email ?? "",
            phone: teacher.phone ?? "",
            classId: teacher.classId ?? "",
          });
        }
      } catch {
        if (active) setError("Couldn't load the data. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [nurseryId, teacherId, isEdit]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const busy = saving || deleting;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Please enter the teacher's name.");
    if (!form.email.trim())
      return setError("Please enter the teacher's email.");
    if (!isEdit && form.password.length < 6)
      return setError("Password must be at least 6 characters.");

    setSaving(true);
    try {
      if (isEdit) await updateTeacher(nurseryId, teacherId, form);
      else await addTeacher(nurseryId, form);
      navigate("/admin/teacher");
    } catch (err) {
      setError(
        err?.code === "auth/email-already-in-use"
          ? "This email already has an account."
          : err?.code === "auth/invalid-email"
            ? "Please enter a valid email."
            : "Couldn't save the teacher. Please try again.",
      );
      setSaving(false);
    }
  }

  async function handleDelete() {
    setError("");
    setDeleting(true);
    try {
      await deleteTeacher(nurseryId, teacherId);
      navigate("/admin/teacher");
    } catch {
      setError("Couldn't delete the teacher. Please try again.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded-full bg-[#ece6dd]" />
        <div className="h-64 animate-pulse rounded-2xl bg-[#ece6dd]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <BackBtn to="/admin/teacher" label={"teacher"} />

      <h1 className="text-2xl font-bold tracking-tight text-[#262723]">
        {isEdit ? "Edit teacher" : "Add teacher"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[#262723]">
            Teacher details
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="teacher-name" className={labelClass}>
                Full name
              </label>
              <input
                id="teacher-name"
                className={fieldClass}
                value={form.name}
                onChange={set("name")}
                autoComplete="name"
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="teacher-email" className={labelClass}>
                  Email
                </label>
                <input
                  id="teacher-email"
                  type="email"
                  className={fieldClass}
                  value={form.email}
                  onChange={set("email")}
                  autoComplete="email"
                  // email is the login, so keep it fixed when editing
                  readOnly={isEdit}
                  required
                />
                {!isEdit && (
                  <div>
                    <label htmlFor="teacher-password" className={labelClass}>
                      Password
                    </label>
                    <input
                      id="teacher-password"
                      type="password"
                      className={fieldClass}
                      value={form.password}
                      onChange={set("password")}
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                    <p className="mt-1 text-xs text-[#555c57]">
                      At least 6 characters. Share it with the teacher so they
                      can log in.
                    </p>
                  </div>
                )}
                {isEdit && (
                  <p className="mt-1 text-xs text-[#555c57]">
                    Email can't be changed after the account is created.
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="teacher-phone" className={labelClass}>
                  Phone
                </label>
                <input
                  id="teacher-phone"
                  type="tel"
                  className={fieldClass}
                  value={form.phone}
                  onChange={set("phone")}
                  autoComplete="tel"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-[#262723]">Class</h2>
          <label htmlFor="teacher-class" className={labelClass}>
            Assigned class
          </label>
          <select
            id="teacher-class"
            className={fieldClass}
            value={form.classId}
            onChange={set("classId")}
          >
            <option value="">No class yet</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Card>

        {error && (
          <p
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 w-full sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/admin/teacher")}
            disabled={busy}
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-[#555c57] shadow-sm"
          >
            Cancel
          </button>
          {/* rgb(19, 73, 54) */}
          <button
            type="submit"
            disabled={busy}
            className="min-h-11 flex-2 cursor-pointer rounded-full bg-brand px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add teacher"}
          </button>
        </div>
      </form>

      {isEdit && (
        <Card>
          <h2 className="text-sm font-semibold text-[#262723]">
            Delete teacher
          </h2>
          <p className="mt-1 text-xs text-[#555c57]">
            This removes the teacher's account from your nursery. It can't be
            undone.
          </p>

          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
              className="mt-3 min-h-11 rounded-full border border-rose-200 bg-rose-50 px-5 text-sm font-semibold text-rose-700 hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 disabled:opacity-50"
            >
              Delete teacher
            </button>
          ) : (
            <div
              role="alertdialog"
              aria-label="Confirm delete teacher"
              className="mt-3 space-y-3 rounded-2xl border border-rose-200 bg-rose-50 p-3"
            >
              <p className="text-sm text-rose-700">
                Delete {form.name || "this teacher"}? This can't be undone.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="min-h-11 rounded-full bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="min-h-11 rounded-full px-5 text-sm font-semibold text-[#555c57] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a4d] disabled:opacity-50"
                >
                  Keep teacher
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
