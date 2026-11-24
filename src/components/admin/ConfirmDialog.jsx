// src/components/admin/ConfirmDialog.jsx
import { useEffect } from "react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  // Close with the Escape key
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={busy ? undefined : onCancel}
        className="absolute inset-0 bg-black/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
      >
        <h2 id="confirm-title" className="text-lg font-bold text-[#262723]">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-snug text-[#555c57]">{message}</p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            disabled={busy}
            className="min-h-11 flex-1 rounded-full bg-[#f0ede7] px-4 text-sm font-semibold text-[#555c57] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`min-h-11 flex-1 rounded-full px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 ${
              danger ? "bg-rose-600" : "bg-brand"
            }`}
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}