import { Link } from "react-router";

const STATUS_OPTIONS = [
  {
    value: "present",
    label: "Present",
    activeClass: "border-emerald-500 bg-emerald-50 text-emerald-700",
  },
  {
    value: "late",
    label: "Late",
    activeClass: "border-amber-500 bg-amber-50 text-amber-700",
  },
  {
    value: "absent",
    label: "Absent",
    activeClass: "border-rose-500 bg-rose-50 text-rose-700",
  },
];

export default function Attendance({
  children,
  attendanceCounts,
  setSuccess,
  filteredChildren,
  getInitials,
  attendance,
  handleStatusChange,
  handleMarkAll,
  handleSaveAttendance,
  saving,
  search,
  setSearch,
  getToday,
  date,
  setDate,
}) {
  const { present, absent, late, notRecorded } = attendanceCounts;
  return (
    <div className="bg-white mx-4 p-5 mb-12  rounded-xl shadow-md ">
      <div className="flex gap-3 items-center justify-between ">
        <div className="flex gap-2 flex-2/3">
          <img
            className="bg-[#faf2eb] w-12 p-2 rounded-md "
            width={40}
            src="/attendance.svg"
            alt="Attendance"
          />
          <div>
            <p className="font-medium text-lg">Class Attendance</p>
            <p className="text-gray-600">
              {children.length - (notRecorded ?? 0)} of {children.length}{" "}
              recorded
            </p>
          </div>
        </div>

        <div className="py-3 flex-1/3 items-center flex flex-col rounded-lg font-medium bg-slate-100 text-slate-700">
          {notRecorded ?? 0}
          <div className="flex items-center justify-center gap-0.5 text-center text-[11px] leading-tight sm:text-sm">
            Not recorded
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <div className="flex-1 py-3  items-center flex flex-col rounded-lg font-medium bg-[#e8f5e9] text-[#1b7a43]">
          {present}
          <div className="flex items-center justify-center gap-0.5 ">
            <img src="/sun.svg" alt="icon" />
            Present
          </div>
        </div>
        <div className="flex-1 py-3  items-center flex flex-col rounded-lg font-medium bg-[#fff3e0] text-[#b86200]">
          {late}
          <div className="flex items-center justify-center gap-0.5 ">
            <img src="/clock.svg" alt="icon" />
            Late
          </div>
        </div>
        <div className="flex-1 py-3  items-center flex flex-col rounded-lg font-medium bg-[#fdecea] text-[#c0392b]">
          {absent}
          <div className="flex items-center justify-center gap-0.5 ">
            <img src="/home.svg" alt="icon" />
            Absent
          </div>
        </div>
      </div>

      {children.length > 0 && (
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => handleMarkAll("present")}
            className="min-h-10 flex-1 rounded-lg border border-emerald-500 bg-emerald-50 px-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            Mark all present
          </button>
          <button
            type="button"
            onClick={() => handleMarkAll("absent")}
            className="min-h-10 flex-1 rounded-lg border border-rose-500 bg-rose-50 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            Mark all absent
          </button>
        </div>
      )}

      {/* __________________________________________ */}
      {children.length === 0 ? (
        <div className="p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-2xl">
            🧸
          </div>

          <h3 className="mt-4 font-semibold">No children in your class yet</h3>

          <p className="mt-2 text-sm text-slate-500">
            Ask your administrator to add children to this class.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          <div className="flex flex-row my-4 gap-3">
            <label className="sr-only" htmlFor="child-search">
              Search children
            </label>

            <input
              id="child-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search children..."
              className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <label className="sr-only" htmlFor="attendance-date">
              Attendance date
            </label>

            <input
              id="attendance-date"
              type="date"
              value={date}
              max={getToday()}
              onChange={(event) => {
                setDate(event.target.value);
                setSuccess("");
              }}
              className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {filteredChildren.map((child) => (
            <article
              key={child.id}
              className="flex flex-row justify-between gap-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
            >
              <Link to={`/teacher/children/${child.id}`}   className="flex min-w-0 items-center gap-1.5 bg-gray-300/20 hover:bg-gray-300/40 duration-300  px-2 py-2 rounded-2xl">
                {child.photo ? (
                  <img
                    src={child.photo}
                    alt={child.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e3f2ea] text-sm font-bold text-brand">
                    {getInitials(child.name)}
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">
                    {child.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {child.gender === "male" ? "Boy" : "Girl"}
                  </p>
                </div>
              </Link>

              <div className="flex flex-col items-end gap-1.5">
                {!attendance[child.id] && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    Not recorded yet
                  </span>
                )}
                <fieldset className="flex flex-wrap justify-end gap-2">
                  <legend className="sr-only">
                    Attendance status for {child.name}
                  </legend>

                  {STATUS_OPTIONS.map((option) => {
                    const selected = attendance[child.id] === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          handleStatusChange(child.id, option.value)
                        }
                        className={`min-h-9 rounded-lg border px-2.5 text-[12px] font-medium transition ${
                          selected
                            ? option.activeClass
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </fieldset>
              </div>
            </article>
          ))}
        </div>
      )}
      {children.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-slate-100  pt-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={saving}
            className="sticky bottom-0 min-h-12 rounded-xl hover:bg-brand px-6 py-3 text-sm font-semibold text-white transition bg-[#375841] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save attendance"}
          </button>
        </div>
      )}
    </div>
  );
}
