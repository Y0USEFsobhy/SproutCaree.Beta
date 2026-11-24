import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../../features/auth/authSlice";
import {
  getNursery,
  updateNurserySettings,
  updateMyAccount,
  changeMyPassword,
} from "../../services/api";

// Replace these with your shared fieldClass / labelClass imports if you extract them.
const fieldClass =
  "min-h-11 w-full rounded-xl border border-[#e8e0d4] bg-white px-4 text-sm text-[#262723] placeholder:text-[#9a9d97] focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#1f7a4d]/30 disabled:bg-[#f5f1ea] disabled:text-[#7a7d77]";
const labelClass = "mb-1 block text-sm font-semibold text-[#262723]";
const primaryBtn =
  "cursor-pointer inline-flex min-h-11 items-center justify-center rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:bg-[#19633e] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a4d] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60";

const DAYS = [
  { key: "sunday", label: "Sun" },
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
  { key: "saturday", label: "Sat" },
];
const DEFAULT_DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday"];

const authMessage = (err) => {
  switch (err?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Current password is not correct.";
    case "auth/weak-password":
      return "New password is too weak. Use at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/requires-recent-login":
      return "Please log out and log in again, then retry.";
    default:
      return err?.message || "Something went wrong. Please try again.";
  }
};

/* ---------- Small building blocks ---------- */
function Card({ title, hint, children }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-brand">{title}</h2>
      {hint && <p className="mt-1 text-xs text-[#555c57]">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SaveRow({ saving, error, saved, label = "Save changes" }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="submit" disabled={saving} className={primaryBtn}>
        {saving ? "Saving…" : label}
      </button>
      {error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}
      {saved && !error && (
        <p role="status" className="text-sm font-semibold text-[#1f7a4d]">
          Saved ✓
        </p>
      )}
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading settings">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-2xl bg-[#ECE6DD]" />
      ))}
    </div>
  );
}

/* ---------- 1. Nursery profile ---------- */
function NurseryProfileCard({ nurseryId, nursery, onSaved }) {
  const [form, setForm] = useState({
    name: nursery.name ?? "",
    phone: nursery.phone ?? "",
    email: nursery.email ?? "",
    address: nursery.address ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setSaved(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const name = form.name.trim();
    if (!name) return setError("Nursery name is required.");
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()))
      return setError("Please enter a valid email address.");

    const data = {
      name,
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
    };
    setSaving(true);
    try {
      await updateNurserySettings(nurseryId, data);
      onSaved(data);
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Could not save the nursery profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Nursery profile"
      hint="These details are shown to teachers and parents."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="nursery-name" className={labelClass}>
            Nursery name
          </label>
          <input
            id="nursery-name"
            className={fieldClass}
            value={form.name}
            onChange={set("name")}
            disabled={saving}
            autoComplete="organization"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="nursery-phone" className={labelClass}>
              Phone
            </label>
            <input
              id="nursery-phone"
              type="tel"
              inputMode="tel"
              className={fieldClass}
              value={form.phone}
              onChange={set("phone")}
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="nursery-email" className={labelClass}>
              Contact email
            </label>
            <input
              id="nursery-email"
              type="email"
              className={fieldClass}
              value={form.email}
              onChange={set("email")}
              disabled={saving}
            />
          </div>
        </div>
        <div>
          <label htmlFor="nursery-address" className={labelClass}>
            Address
          </label>
          <input
            id="nursery-address"
            className={fieldClass}
            value={form.address}
            onChange={set("address")}
            disabled={saving}
            autoComplete="street-address"
          />
        </div>
        <SaveRow saving={saving} error={error} saved={saved} />
      </form>
    </Card>
  );
}

/* ---------- 2. Working hours and days ---------- */
function WorkingHoursCard({ nurseryId, nursery }) {
  const initial = nursery.workingHours ?? {};
  const [openTime, setOpenTime] = useState(initial.openTime ?? "08:00");
  const [closeTime, setCloseTime] = useState(initial.closeTime ?? "14:00");
  const [days, setDays] = useState(initial.days ?? DEFAULT_DAYS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const toggleDay = (key) => {
    setDays((current) =>
      current.includes(key)
        ? current.filter((d) => d !== key)
        : [...current, key],
    );
    setSaved(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!openTime || !closeTime) return setError("Please set both times.");
    if (closeTime <= openTime)
      return setError("Closing time must be after opening time.");
    if (days.length === 0) return setError("Choose at least one working day.");

    setSaving(true);
    try {
      await updateNurserySettings(nurseryId, {
        workingHours: {
          openTime,
          closeTime,
          // keep the week order, not the click order
          days: DAYS.map((d) => d.key).filter((k) => days.includes(k)),
        },
      });
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Could not save working hours. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card
      title="Working hours and days"
      hint="Used for the schedule and attendance."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="open-time" className={labelClass}>
              Opens at
            </label>
            <input
              id="open-time"
              type="time"
              className={fieldClass}
              value={openTime}
              onChange={(e) => {
                setOpenTime(e.target.value);
                setSaved(false);
              }}
              disabled={saving}
            />
          </div>
          <div>
            <label htmlFor="close-time" className={labelClass}>
              Closes at
            </label>
            <input
              id="close-time"
              type="time"
              className={fieldClass}
              value={closeTime}
              onChange={(e) => {
                setCloseTime(e.target.value);
                setSaved(false);
              }}
              disabled={saving}
            />
          </div>
        </div>

        <fieldset>
          <legend className={labelClass}>Working days</legend>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(({ key, label }) => {
              const on = days.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  disabled={saving}
                  onClick={() => toggleDay(key)}
                  className={`min-h-11 min-w-14 cursor-pointer rounded-full border px-4 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a4d] disabled:opacity-60 ${
                    on
                      ? "border-[#1f7a4d] bg-[#e3f2ea] text-[#1f7a4d]"
                      : "border-[#e8e0d4] bg-white text-[#555c57] hover:bg-[#f5f1ea]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <SaveRow saving={saving} error={error} saved={saved} />
      </form>
    </Card>
  );
}

/* ---------- 3. Admin account ---------- */
function AccountCard({ user }) {
  const dispatch = useDispatch();
  const [name, setName] = useState(user.name ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Your name is required.");

    setSaving(true);
    try {
      const data = { name: name.trim(), phone: phone.trim() };
      await updateMyAccount(user.uid, data);
      dispatch(setUser({ ...user, ...data }));
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Could not save your account. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="My account">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="admin-name" className={labelClass}>
              Name
            </label>
            <input
              id="admin-name"
              className={fieldClass}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              disabled={saving}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="admin-phone" className={labelClass}>
              Phone
            </label>
            <input
              id="admin-phone"
              type="tel"
              inputMode="tel"
              className={fieldClass}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setSaved(false);
              }}
              disabled={saving}
              autoComplete="tel"
            />
          </div>
        </div>
        <div>
          <label htmlFor="admin-email" className={labelClass}>
            Email
          </label>
          <input
            id="admin-email"
            className={fieldClass}
            value={user.email ?? ""}
            disabled
            readOnly
          />
          <p className="mt-1 text-xs text-[#555c57]">
            Your email is your login and can’t be changed here.
          </p>
        </div>
        <SaveRow saving={saving} error={error} saved={saved} />
      </form>
    </Card>
  );
}

/* ---------- 4. Change password ---------- */
function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!current) return setError("Enter your current password.");
    if (next.length < 6)
      return setError("New password must be at least 6 characters.");
    if (next !== confirm) return setError("The new passwords do not match.");
    if (next === current)
      return setError("New password must be different from the current one.");

    setSaving(true);
    try {
      await changeMyPassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setSaved(true);
    } catch (err) {
      setError(authMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const type = show ? "text" : "password";

  return (
    <Card title="Change password">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="pw-current" className={labelClass}>
            Current password
          </label>
          <input
            id="pw-current"
            type={type}
            className={fieldClass}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            disabled={saving}
            autoComplete="current-password"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="pw-new" className={labelClass}>
              New password
            </label>
            <input
              id="pw-new"
              type={type}
              className={fieldClass}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              disabled={saving}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="pw-confirm" className={labelClass}>
              Confirm new password
            </label>
            <input
              id="pw-confirm"
              type={type}
              className={fieldClass}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={saving}
              autoComplete="new-password"
            />
          </div>
        </div>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[#555c57]">
          <input
            type="checkbox"
            checked={show}
            onChange={(e) => setShow(e.target.checked)}
            className="size-4 accent-[#1f7a4d]"
          />
          Show passwords
        </label>
        <SaveRow
          saving={saving}
          error={error}
          saved={saved}
          label="Update password"
        />
      </form>
    </Card>
  );
}

/* ---------- Page ---------- */
export default function AdminSettings() {
  const user = useSelector((state) => state.auth.user);
  const nurseryId = user.nurseryId;

  const [nursery, setNursery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await getNursery(nurseryId);
        if (!active) return;
        if (!result) setError("Nursery not found.");
        setNursery(result);
      } catch (err) {
        console.error(err);
        if (active) setError("Could not load settings. Please refresh.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [nurseryId]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand">
          Settings
        </h1>
        <p className="text-xs text-[#555c57]">
          Manage your nursery and your account.
        </p>
      </div>

      {loading && <SettingsSkeleton />}

      {!loading && error && (
        <p role="alert" className="text-sm text-rose-700">
          {error}
        </p>
      )}

      {!loading && nursery && (
        <div className="space-y-4">
          <NurseryProfileCard
            nurseryId={nurseryId}
            nursery={nursery}
            onSaved={(data) => setNursery((n) => ({ ...n, ...data }))}
          />
          {/* <WorkingHoursCard nurseryId={nurseryId} nursery={nursery} /> */}
          <AccountCard user={user} />
          <PasswordCard />
        </div>
      )}
    </div>
  );
}
