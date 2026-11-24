import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { getAnnouncements } from "../../services/api";

const VISIBLE_COUNT = 3;

const formatDate = (ms) =>
  ms
    ? new Date(ms).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

export default function Announcements({ audience = "teachers" , className = ""}) {
  const nurseryId = useSelector((state) => state.auth.user?.nurseryId);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!nurseryId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");

      try {
        const data = await getAnnouncements(String(nurseryId));
        if (!cancelled) setItems(data ?? []);
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Could not load announcements.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [nurseryId]);

  // Only items meant for everyone or for this audience; pinned first, then newest.
  const visibleItems = useMemo(
    () =>
      items
        .filter((a) => a.audience === "all" || a.audience === audience)
        .sort(
          (a, b) =>
            Number(!!b.pinned) - Number(!!a.pinned) ||
            (b.createdAt ?? 0) - (a.createdAt ?? 0),
        ),
    [items, audience],
  );

  const shown = showAll ? visibleItems : visibleItems.slice(0, VISIBLE_COUNT);
  const hiddenCount = visibleItems.length - VISIBLE_COUNT;

  return (
    <section
      aria-labelledby="announcements-title"
      className={`rounded-2xl bg-white p-4 shadow-sm ${className}`}
    >
      <h2
        id="announcements-title"
        className="text-sm font-semibold text-[#262723]"
      >
        Announcements
      </h2>

      {loading && (
        <div className="mt-3 space-y-3" aria-hidden="true">
          {[0, 1].map((i) => (
            <div key={i} className="animate-pulse rounded-xl bg-[#ECE6DD] p-4">
              <div className="h-4 w-1/3 rounded bg-white/60" />
              <div className="mt-3 h-3 w-full rounded bg-white/60" />
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <p role="alert" className="mt-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      {!loading && !error && visibleItems.length === 0 && (
        <p className="mt-3 text-sm text-[#555C57]">No announcements yet.</p>
      )}

      {!loading && !error && visibleItems.length > 0 && (
        <>
          <ul className="mt-3 space-y-3">
            {shown.map((a) => (
              <li
                key={a.id}
                className={`rounded-xl p-4 ${
                  a.pinned ? "bg-[#E3F2EA]" : "bg-[#F5F1EA]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-[#262723]">
                    {a.title}
                  </h3>
                  {a.pinned && (
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-[#1F7A4D]">
                      Pinned
                    </span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-[#555C57]">
                  {a.body}
                </p>
                <p className="mt-2 text-xs text-[#555C57]">
                  {formatDate(a.createdAt)}
                </p>
              </li>
            ))}
          </ul>

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
              className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-[#E3F2EA] px-5 text-sm font-semibold text-[#1F7A4D] transition hover:bg-[#D3EBDF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A4D] focus-visible:ring-offset-2 active:scale-[0.98]"
            >
              {showAll ? "Show less" : `Show ${hiddenCount} more`}
            </button>
          )}
        </>
      )}
    </section>
  );
}