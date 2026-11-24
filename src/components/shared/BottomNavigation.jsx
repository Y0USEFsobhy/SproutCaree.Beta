import { NavLink, useLocation } from "react-router";

const NAV_CONFIG = {
  parent: [
    { label: "Home", to: "/parent", icon: "home", end: true },
    { label: "Updates", to: "/parent/updates", icon: "check" },
    { label: "Schedule", to: "/parent/schedule", icon: "calendar" },
    { label: "Profile", to: "/parent/profile", icon: "profile" },
  ],
  teacher: [
    { label: "Home", to: "/teacher", icon: "home", end: true },
    { label: "Attendance", to: "/teacher/attendance", icon: "check" },
    { label: "Schedule", to: "/teacher/schedule", icon: "calendar" },
    { label: "Notes", to: "/teacher/notes", icon: "note" },
  ],
};

export default function BottomNavigation() {

  const location = useLocation();
  // const isParent = location.pathname.startsWith("/parent")
  const role = location.pathname.startsWith("/parent") ? "parent" : "teacher";
  const tabs = NAV_CONFIG[role];
  return (
    <nav
      aria-label="Teacher navigation"
      className=" inset-x-0 z-50 border-t bg-[#fff8f2] border-slate-200  pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur"
    >
      <div className="mx-auto place-content-center  grid h-16 max-w-2xl grid-cols-4 px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `  min-w-0 flex-col  duration-500 items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition ${
                isActive
                  ? "text-black "
                  : "text-slate-500 hover:text-slate-800"
              }`
            }
          >
            {({ isActive }) => (
              <div className={`flex flex-col items-center justify-center ${isActive ? " bg-[#e3f2ea] ": "bg-transparent"} transition-colors ease-in-out duration-300 w-full rounded-lg py-2`}>
                <TabIcon name={tab.icon} active={isActive} />
                <span className="truncate">{tab.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function TabIcon({ name, active }) {
  const common = {
    width: 21,
    height: 21,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    className: active ? "scale-105 " : "",
  };

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-6h6v6" />
      </svg>
    );
  }

  if (name === "check") {
    return (
      <svg {...common}>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="m8 12 2.5 2.5L16 9" />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5M8 12h8M8 16h8" />
    </svg>
  );
}