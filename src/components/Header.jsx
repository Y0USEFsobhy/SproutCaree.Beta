import { useSelector } from "react-redux";
import { getNursery, getClassById } from "../services/api";
import { useEffect, useState } from "react";
import LogoutBtn from "./LogoutBtn";
import { Link, useLocation } from "react-router";

function Aside({ setOpen, open }) {
  return (

<>
  {/* Backdrop */}
  <button
    type="button"
    aria-label="Close menu"
    onClick={() => setOpen(false)}
    tabIndex={open ? 0 : -1}
    className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-500 ${
      open
        ? "opacity-100 pointer-events-auto"
        : "opacity-0 pointer-events-none"
    }`}
  />

  {/* Drawer */}
  <div
    className={`fixed inset-y-0 right-0 z-50 w-72 max-w-[85%] transition-transform duration-500 ${
      open ? "translate-x-0" : "translate-x-full"
    }`}
    aria-hidden={!open}
  >
    <aside
      id="admin-drawer"
      role="dialog"
      aria-modal="true"
      aria-label="Account menu"
      className="flex h-full flex-col bg-[#f5f1ea] pb-18 p-4 shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#262723]">
          Account
        </h2>

        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="cursor-pointer flex h-10 w-10 items-center justify-center rounded-full text-[#555c57] transition hover:bg-[#d3ebdf] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a4d] active:scale-95"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* Menu card */}
      <nav
        aria-label="Account"
        className="mt-4 rounded-2xl bg-white p-4 shadow-sm"
      >
        <ul className="space-y-2">
          <li>
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-full px-4 text-sm font-semibold text-[#262723] transition hover:bg-[#f5f1ea] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a4d] active:bg-[#e3f2ea]"
            >
              <svg
                className="h-5 w-5 text-[#1f7a4d]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
              My Profile
            </Link>
          </li>

          <li>
            <Link
              to="/password"
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-3 rounded-full px-4 text-sm font-semibold text-[#262723] transition hover:bg-[#f5f1ea] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f7a4d] active:bg-[#e3f2ea]"
            >
              <svg
                className="h-5 w-5 text-[#1f7a4d]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 018 0v3" />
              </svg>
              Change Password
            </Link>
          </li>
        </ul>
      </nav>

      {/* Logout pinned to bottom */}
      <div className="mt-auto pt-4 flex justify-end">
        <LogoutBtn />
      </div>
    </aside>
  </div>
</>
  );
}

export default function Header() {
  const location = useLocation();
  const isParent = location.pathname.startsWith("/parent");
  const user = useSelector((state) => state.auth.user);
  const [data, setData] = useState();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!parent) {
      if (!user?.classId || !user?.nurseryId) return;
    }

    const load = async () => {
      if (isParent) {
        const resultInParent = await getNursery(user.nurseryId);
        setData(resultInParent);
      } else {
        const result = await getClassById(user.classId, user.nurseryId);
        setData(result);
      }
    };
    load();
  }, [user?.classId, user?.nurseryId, isParent]);

  return (
    <header className="bg-white py-2.5 px-4 flex items-center justify-between ">
      <div className="flex gap-3 items-center">
        <div className="w-10 h-10 rounded-lg  bg-amber-50">
          <img className="scale-150" src="/logo.png" alt="logo" />
        </div>
        <div className="flex flex-col leading-tight">
          <h1 className="text-brand font-bold text-[17px]">SproutCaree</h1>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full md:mt-0.5 bg-[#f39c12]"></span>
            <p className="text-gray-500 text-sm font-medium ">
              {isParent ? data?.name : `${data?.name} ${data?.ageGroup}`}
              {/* {data?.name} ({data?.ageGroup}) */}
            </p>
          </div>
        </div>
      </div>
      <button className="cursor-pointer" onClick={() => setOpen(!open)}>
        <img src="/menu.svg" width={25} alt="menu" />
      </button>
      <Aside setOpen={setOpen} open={open} />
    </header>
  );
}
