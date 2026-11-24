import { useState } from "react";
import { useSelector } from "react-redux";

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const formatDate = (dateString) =>
  new Date(`${dateString}T12:00:00`).toLocaleDateString("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

export default function MainInfo() {
  const [date,] =useState(getToday())
  const user = useSelector((state)=>state.auth.user)


  return (
    <div className="px-2 py-2 ">
      <div className="flex items-center gap-0.5">
        <img width={20} src="/calender.svg" alt="calender" />
        <p className="text-brand font-medium">{formatDate(date)}</p>
      </div>

      <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-3xl ">
        {getGreeting()}, <span className="text-brand">{ user?.name?.split(" ")[0] || "Teacher"}!</span> 
      </h1>
    </div>
  );
}
