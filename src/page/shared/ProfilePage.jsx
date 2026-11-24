import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { updateMyAccount as updateMyProfile } from "../../services/api"; // adjust path (see snippet below)
import { setUser } from "../../features/auth/authSlice"; // adjust path / action name
// import { fieldClass, labelClass } from "../styles/formClasses"; // adjust path

const fieldClass =
  "min-h-11 w-full rounded-xl border border-[#e8e0d4] bg-white px-4 text-sm text-[#262723] placeholder:text-[#9a9d97] focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#1f7a4d]/30 disabled:bg-[#f5f1ea] disabled:text-[#7a7d77]";
const labelClass = "mb-1 block text-sm font-semibold text-[#262723]";

// Adjust to match your store: where the signed-in user lives
const selectUser = (state) => state.auth.user;

const ROLE_LABELS = { teacher: "Teacher", parent: "Parent" };

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-[#555C57]">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-[#262723]">
        {value || <span className="font-normal text-[#555C57]">Not added</span>}
      </dd>
    </div>
  );
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/", { replace: true });
  };

  const startEdit = () => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setError("");
    setSuccess(false);
    setEditing(true);
  };

  const cancelEdit = () => {
    setError("");
    setEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) return setError("Please enter your name.");
    if (cleanPhone && !/^[+\d][\d\s-]{6,}$/.test(cleanPhone)) {
      return setError("Please enter a valid phone number.");
    }

    setSaving(true);
    try {
      const changes = { name: cleanName, phone: cleanPhone };
      await updateMyProfile(user.uid, changes);
      dispatch(setUser({ ...user, ...changes }));
      setEditing(false);
      setSuccess(true);
    } catch (err) {
      setError(err?.message || "Could not save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Loading state while the user is not in the store yet
  if (!user) {
    return (
      <main className="mx-auto w-full max-w-2xl space-y-4 p-4" aria-busy="true">
        <div className="h-11 w-48 animate-pulse rounded-full bg-[#ECE6DD]" />
        <div className="h-64 animate-pulse rounded-2xl bg-[#ECE6DD]" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-4 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#555C57] shadow-sm transition hover:bg-[#D3EBDF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A4D] active:scale-95"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-[#262723]">My profile</h1>
      </div>

      {/* Identity card */}
      <section className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div
          aria-hidden="true"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E3F2EA] text-lg font-bold text-[#1F7A4D]"
        >
          {initialsOf(user.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#262723]">{user.name}</p>
          <p className="truncate text-xs text-[#555C57]">{user.email}</p>
          {ROLE_LABELS[user.role] && (
            <span className="mt-1 inline-block rounded-full bg-[#E3F2EA] px-2.5 py-0.5 text-xs font-semibold text-[#1F7A4D]">
              {ROLE_LABELS[user.role]}
            </span>
          )}
        </div>
      </section>

      {/* Details card */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#262723]">Personal information</h2>
          {!editing && (
            <button
              type="button"
              onClick={startEdit}
              className="rounded-full bg-[#E3F2EA] px-4 py-2 text-sm font-semibold text-[#1F7A4D] transition hover:bg-[#D3EBDF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A4D] active:scale-[0.98]"
            >
              Edit
            </button>
          )}
        </div>

        {success && !editing && (
          <p role="status" className="mt-3 text-sm text-[#1F7A4D]">
            Your profile was updated.
          </p>
        )}

        {editing ? (
          <form onSubmit={handleSubmit} className="mt-4 max-w-md space-y-4">
            <div>
              <label htmlFor="profile-name" className={labelClass}>
                Full name
              </label>
              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldClass}
                disabled={saving}
                required
              />
            </div>

            <div>
              <label htmlFor="profile-phone" className={labelClass}>
                Phone number
              </label>
              <input
                id="profile-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={fieldClass}
                disabled={saving}
              />
            </div>

            <div>
              <label htmlFor="profile-email" className={labelClass}>
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={user.email || ""}
                className={fieldClass}
                disabled
                readOnly
              />
              <p className="mt-1 text-xs text-[#555C57]">
                Email is your sign-in address and can't be changed here.
              </p>
            </div>

            {error && (
              <p role="alert" className="text-sm text-rose-700">
                {error}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="rounded-full bg-[#1F7A4D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a6a42] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A4D] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-[#555C57] transition hover:bg-[#F5F1EA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A4D] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="mt-4 space-y-4">
            <Field label="Full name" value={user.name} />
            <Field label="Phone number" value={user.phone} />
            <Field label="Email" value={user.email} />
          </dl>
        )}
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------
   Add to services/api (Firestore). Adjust the collection name if your
   user documents live somewhere else:

   import { doc, updateDoc } from "firebase/firestore";
   import { db } from "../firebase";

   export const updateMyProfile = (uid, { name, phone }) =>
     updateDoc(doc(db, "users", uid), { name, phone });

   Make sure your Firestore security rules let a user update only their
   own name and phone (and not role or nurseryId).
------------------------------------------------------------------- */