// src/components/NowNext.jsx
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router";
import { getSchedule } from "../../services/api";
import {
  formatTime,
  getStatus,
  getTodayKey,
  useNowMinutes,
} from "../../utils/time";

export default function NowNext() {
  const user = useSelector((state) => state.auth.user);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const nowMin = useNowMinutes();
  // To test at any time of day:
  // const nowMin = 10 * 60 + 45;

  useEffect(() => {
    if (!user?.classId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    getSchedule(user.classId,user.nurseryId ,getTodayKey())
      .then((result) => {
        if (!cancelled) setSlots(result);
      })
      .catch(() => {
        if (!cancelled) setSlots([]); // on error, show the "no schedule" state
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.classId]);

  const current = slots.find((s) => getStatus(s, nowMin) === "active");
  const next = slots.find((s) => getStatus(s, nowMin) === "upcoming");

  if (loading) {
    return <div className="h-28 animate-pulse rounded-2xl bg-[#ece6dd]" />;
  }

  return (
    <Link
      to="/teacher/schedule"
      className="block rounded-2xl ring-1 ring-slate-200  bg-white shadow-sm p-4  transition hover:shadow-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#134936]">Today's schedule</h2>
        <span className="flex gap-1 items-center text-xs text-[#555c57]">
          View all 
          <img src="/arrow-up.svg" width={20} className="rotate-90" alt="arrow" />
        </span>
      </div>

      {slots.length === 0 ? (
        <p className="text-sm text-[#555c57]">No school today. Enjoy your day! 🌿</p>
      ) : !current && !next ? (
        <p className="text-sm font-medium text-[#134936]">
          The school day is over. See you tomorrow! 👋
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 ">
          {/* Current */}
          <div className="rounded-xl bg-[#fff0dc] p-3">
            <p className="text-[11px] font-semibold text-[#cd6700]">NOW</p>
            {current ? (
              <>
                <p className="mt-1 text-sm leading-snug font-bold text-[#262723]">
                  {current.activity}
                </p>
                <p className="mt-1 text-xs text-[#555c57]">
                  until {formatTime(current.endTime)}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-[#555c57]">Nothing yet</p>
            )}
          </div>

          {/* Next */}
          <div className="rounded-xl bg-[#e3f2ea] p-3">
            <p className="text-[11px] font-semibold text-[#134936]">NEXT</p>
            {next ? (
              <>
                <p className="mt-1 text-sm leading-snug font-bold text-[#262723]">
                  {next.activity}
                </p>
                <p className="mt-1 text-xs text-[#555c57]">
                  at {formatTime(next.startTime)}
                </p>
              </>
            ) : (
              <p className="mt-1 text-sm text-[#555c57]">Last activity of the day</p>
            )}
          </div>
        </div>
      )}
    </Link>
  );
}
