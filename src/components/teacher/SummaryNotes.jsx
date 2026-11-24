import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { getLocalDate } from "../../utils/time";
import { getChildrenForClass, getNotesForDate } from "../../services/api";
import { Link } from "react-router";

export default function SummaryNotes() {
  const user = useSelector((state) => state.auth.user);
  const [children, setChildren] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = getLocalDate();

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

  const noteByChild = useMemo(
    () =>
      Object.fromEntries(
        notes.map((note) => [String(note.childId), note]),
      ),
    [notes],
  );
  const doneCount = children.filter(
    (child) => noteByChild[String(child.id)],
  ).length;
  const percent = children.length
    ? Math.round((doneCount / children.length) * 100)
    : 0;

  return (
    <div>
      {!loading && !error && children.length > 0 && (
        <div className="mt-4 rounded-2xl ring-1 ring-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-brand">Daily Notes</h2>
            <Link
              to="/teacher/notes"
              className="flex gap-1 text-xs text-[#555c57]"
            >
              View all
              <img
                src="/arrow-up.svg"
                width={20}
                className="rotate-90"
                alt="arrow"
              />
            </Link>
          </div>
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
    </div>
  );
}
