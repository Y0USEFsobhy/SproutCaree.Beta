// import { Outlet } from "react-router";
// import Header from "../Header";

// function AdminLayout() {
//   return (
//     <>
//       <Header />
//       <main>
//         AdminLayout
//         <Outlet />
//       </main>
//     </>
//   );
// }

// export default AdminLayout;
// src/components/admin/AdminLayout.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { NavLink, Outlet } from "react-router";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";
import { logout } from "../../features/auth/authSlice";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: "/school.svg", end: true },
  { to: "/admin/children", label: "Children", icon: "/children.svg" },
  { to: "/admin/teacher", label: "Teachers", icon: "/teacher.svg" },
  { to: "/admin/parent", label: "Parents", icon: "/parents.svg" },
  { to: "/admin/classes", label: "Classes", icon: "/classes.svg" },
  { to: "/admin/schedule", label: "Schedule", icon: "/schedule.svg" },
  { to: "/admin/announcements", label: "Announcements", icon: "/announcement.svg" },
  { to: "/admin/settings", label: "Settings", icon: "/settings.svg" },
  // { to: "/admin", label: "Dashboard", icon: "🏠", end: true },
  // { to: "/admin/children", label: "Children", icon: "🧒" },
  // { to: "/admin/teacher", label: "Teachers", icon: "👩‍🏫" },
  // { to: "/admin/parent", label: "Parents", icon: "👨‍👩‍👧" },
  // { to: "/admin/classes", label: "Classes", icon: "🏫" },
  // { to: "/admin/schedule", label: "Schedule", icon: "📅" },
  // { to: "/admin/announcements", label: "Announcements", icon: "📣" },
  // { to: "/admin/settings", label: "Settings", icon: "⚙️" },
];

// The same menu is used in the desktop sidebar and in the phone drawer
function SidebarContent({ user, onNavigate, onSignOut }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-6 pb-4">
        <p className="text-lg font-bold tracking-tight text-white">
          SproutCaree
        </p>
        <p className="text-xs text-white/70">Nursery admin</p>
      </div>

      <nav
        aria-label="Admin navigation"
        className="flex-1 space-y-1 overflow-y-auto px-3"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-white/15 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <img src={item.icon}className="w-6 h-6" alt="icon" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/15 p-4">
        <p className="truncate text-sm font-semibold text-white">
          {user?.name}
        </p>
        <p className="truncate text-xs text-white/70">{user?.email}</p>
        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center justify-center gap-1.5 mt-3 min-h-11 w-full rounded-xl bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          <img src="/logout.svg" className="w-5" alt="icon"/>
          Sign out
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  // Close the drawer with the Escape key
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleSignOut = async () => {
    await signOut(auth);
    dispatch(logout());
  };

  return (
    <div className={`flex h-dvh bg-[#fff8f2] `}>
      {/* Sidebar: wide screens */}
      <aside className="hidden w-64 flex-none bg-brand lg:block ">
        <SidebarContent user={user} onSignOut={handleSignOut} />
      </aside>

      {/* Drawer: phones and tablets */}  
      <>
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          tabIndex={open ? 0 : -1}
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-500 lg:hidden ${
            open
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        />
        <div
          className={`fixed inset-y-0 left-0 z-50 w-72 lg:hidden transition-transform duration-700  ${open ? "translate-x-0 " : "-translate-x-full"}`}
        >
          <aside
            id="admin-drawer"
            // className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-brand shadow-xl"
            className="h-full w-full bg-brand shadow-xl"
          >
            <SidebarContent
              open={open}
              user={user}
              onNavigate={() => setOpen(false)}
              onSignOut={handleSignOut}
            />
          </aside>
        </div>
      </>
      {/* )} */}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar: phones and tablets only */}
        <header className="flex flex-none items-center gap-3 border-b border-[#e8e0d4] bg-white px-4 py-2 lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="admin-drawer"
            onClick={() => setOpen(true)}
            className="grid h-11 w-11 place-items-center rounded-xl text-xl text-brand hover:bg-[#e3f2ea]"
          >
            ☰
          </button>
          <p className="font-bold text-brand">SproutCaree</p>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
