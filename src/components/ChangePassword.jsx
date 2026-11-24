import { useState } from "react";
import { changeMyPassword } from "../services/api"; // adjust path
import { useNavigate } from "react-router";


  const fieldClass =
  "min-h-11 w-full rounded-xl border border-[#e8e0d4] bg-white px-4 text-sm text-[#262723] placeholder:text-[#9a9d97] focus:border-brand focus:outline-none focus:ring-2 focus:ring-[#1f7a4d]/30 disabled:bg-[#f5f1ea] disabled:text-[#7a7d77]";
const labelClass = "mb-1 block text-sm font-semibold text-[#262723]";

const friendlyError = (err) => {
  switch (err?.code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Current password is incorrect.";
    case "auth/weak-password":
      return "New password is too weak. Use at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/requires-recent-login":
      return "Please sign in again, then retry.";
    default:
      return err?.message || "Something went wrong. Please try again.";
  }
};

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Go back in history; fall back to home if the page was opened directly
  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (next.length < 6) return setError("New password must be at least 6 characters.");
    if (next !== confirm) return setError("Passwords do not match.");
    if (next === current) return setError("New password must be different from the current one.");

    setLoading(true);
    try {
      await changeMyPassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setSuccess(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold tracking-tight text-[#262723]">
          Change password
        </h1>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[#262723]">Update your password</h2>
        <p className="mt-1 text-xs text-[#555C57]">
          Use a strong password you don't use anywhere else.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 max-w-md space-y-4">
          <div>
            <label htmlFor="current-password" className={labelClass}>
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={fieldClass}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="new-password" className={labelClass}>
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className={fieldClass}
              disabled={loading}
              required
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className={labelClass}>
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={fieldClass}
              disabled={loading}
              required
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-rose-700">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="text-sm text-[#1F7A4D]">
              Password updated successfully.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading || !current || !next || !confirm}
              className="rounded-full bg-[#1F7A4D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a6a42] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A4D] focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-[#555C57] transition hover:bg-[#F5F1EA] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A4D] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
