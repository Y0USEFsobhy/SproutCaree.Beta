// src/utils/time.js
import { useEffect, useState } from "react";

// "09:30" -> 570 (minutes since midnight). Numbers are easy to compare.
export const toMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// "13:05" -> "1:05 PM"
export const formatTime = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

// "done" | "active" | "upcoming"
export const getStatus = (slot, nowMin) => {
  if (nowMin >= toMinutes(slot.endTime)) return "done";
  if (nowMin >= toMinutes(slot.startTime)) return "active";
  return "upcoming";
};

// "sunday", "monday", ... (always English, matches the `day` field in the data)
export const getTodayKey = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

// Current time in minutes, refreshed every 30 seconds.
// Call it ONCE per page, not inside every card.
export function useNowMinutes() {
  const getNow = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  const [nowMin, setNowMin] = useState(getNow);

  useEffect(() => {
    const id = setInterval(() => setNowMin(getNow()), 30_000);
    return () => clearInterval(id);
  }, []);

  return nowMin;
}

export const getLocalDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};