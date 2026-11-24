// src/page/admin/Dashboard.jsx
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router";
import {
  getAttendanceForDate,
  getChildrenForNursery,
  getClassesForNursery,
  getNotesForDate,
  getUserCount,
} from "../../services/api";
import { getLocalDate } from "../../utils/time";

// ---------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------
function Card({ title, action, children, className = "" }) {
  return (
    <section className={`rounded-2xl bg-white p-4 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-brand">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function StatCard({ to, icon, label, value }) {
  return (
    <Link
      to={to}
      className="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div
        className="text-2xl flex items-center justify-between gap-2"
        aria-hidden="true"
      >
        <p className="text-sm text-[#555c57]">{label}</p>
        {icon}
      </div>
      <p className="mt-2 text-3xl font-bold text-brand">{value ?? "–"}</p>
    </Link>
  );
}

function AttendanceTile({ value, label, className }) {
  return (
    <div className={`rounded-xl p-3 text-center ${className}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  );
}

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------
export default function AdminDashboard() {
  const user = useSelector((state) => state.auth.user);
  const today = getLocalDate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [partial, setPartial] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user?.nurseryId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setPartial(false);

      const results = await Promise.allSettled([
        getChildrenForNursery(user.nurseryId),
        getClassesForNursery(user.nurseryId),
        getAttendanceForDate(user.nurseryId, today),
        getNotesForDate(user.nurseryId, today),
        getUserCount(user.nurseryId, "teacher"),
        getUserCount(user.nurseryId, "parent"),
      ]);

      if (cancelled) return;

      const [children, classes, attendance, notes, teachers, parents] = results;

      // Children and classes are the core data: without them show an error
      if (children.status === "rejected" || classes.status === "rejected") {
        setError("Couldn't load the dashboard. Please try again.");
        setLoading(false);
        return;
      }

      setPartial(results.some((r) => r.status === "rejected"));
      setData({
        children: children.value,
        classes: classes.value,
        attendance: attendance.status === "fulfilled" ? attendance.value : [],
        notes: notes.status === "fulfilled" ? notes.value : [],
        teacherCount: teachers.status === "fulfilled" ? teachers.value : null,
        parentCount: parents.status === "fulfilled" ? parents.value : null,
      });
      setLoading(false);
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.nurseryId, today, reloadKey]);

  const firstName = user?.name?.split(" ")[0] ?? "";
  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const header = (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand">
          {greeting()}
          {firstName && `, ${firstName}`} 👋
        </h1>
        <p className="mt-1 text-sm text-[#555c57]">{dateLabel}</p>
      </div>
      <button
        type="button"
        onClick={() => setReloadKey((n) => n + 1)}
        disabled={loading}
        className="min-h-11 rounded-full bg-white px-4 text-sm font-semibold text-brand shadow-sm transition hover:bg-[#e3f2ea] disabled:opacity-60"
      >
        ↻ Refresh
      </button>
    </div>
  );

  // ----- No nursery (for example the super admin) -----
  if (!user?.nurseryId) {
    return (
      <div>
        {header}
        <p className="rounded-2xl bg-white p-6 text-sm text-[#555c57] shadow-sm">
          This dashboard is for nursery admins. Your account is not linked to a
          nursery.
        </p>
      </div>
    );
  }

  // ----- Loading -----
  if (loading) {
    return (
      <div>
        {header}
        <div className="animate-pulse space-y-4" aria-label="Loading dashboard">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-32 rounded-2xl bg-[#ece6dd]" />
            ))}
          </div>
          <div className="h-56 rounded-2xl bg-[#ece6dd]" />
        </div>
      </div>
    );
  }

  // ----- Error -----
  if (error) {
    return (
      <div>
        {header}
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
        </p>
      </div>
    );
  }

  // ----- Numbers -----
  const { children, classes, attendance, notes, teacherCount, parentCount } =
    data;

  const childIds = new Set(children.map((c) => String(c.id)));
  // Only count records of children who are still active
  const todayRecords = attendance.filter((r) =>
    childIds.has(String(r.childId)),
  );

  const counts = { present: 0, late: 0, absent: 0 };
  todayRecords.forEach((r) => {
    if (counts[r.status] !== undefined) counts[r.status] += 1;
  });

  const recordedIds = new Set(todayRecords.map((r) => String(r.childId)));
  const notRecorded = children.length - recordedIds.size;
  const checkedIn = counts.present + counts.late;
  const notesToday = notes.filter((n) =>
    childIds.has(String(n.childId)),
  ).length;

  // Attendance progress for each class (classes that still need it come first)
  const classProgress = classes
    .map((cls) => {
      const kids = children.filter((c) => String(c.classId) === String(cls.id));
      const marked = kids.filter((c) => recordedIds.has(String(c.id))).length;
      return { cls, total: kids.length, marked };
    })
    .filter((item) => item.total > 0)
    .sort(
      (a, b) => Number(a.marked === a.total) - Number(b.marked === b.total),
    );

  // Things that need the admin's attention
  const classesWithoutTeacher = classes.filter((c) => !c.teacherId);
  const childrenWithoutParent = children.filter(
    (c) => !(c.parentUids?.length > 0),
  );

  const attention = [];
  if (childrenWithoutParent.length > 0) {
    attention.push({
      key: "parents",
      to: "/admin/children",
      text: `${childrenWithoutParent.length} ${
        childrenWithoutParent.length === 1 ? "child has" : "children have"
      } no parent linked`,
      detail: childrenWithoutParent
        .slice(0, 3)
        .map((c) => c.name)
        .join(", "),
    });
  }
  if (classesWithoutTeacher.length > 0) {
    attention.push({
      key: "teachers",
      to: "/admin/classes",
      text: `${classesWithoutTeacher.length} ${
        classesWithoutTeacher.length === 1 ? "class has" : "classes have"
      } no teacher`,
      detail: classesWithoutTeacher
        .slice(0, 3)
        .map((c) => c.name)
        .join(", "),
    });
  }

  return (
    <div>
      {header}

      {partial && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-[#fff0dc] p-3 text-sm text-[#8a4a00]"
        >
          Some numbers couldn't be loaded. Press Refresh to try again.
        </p>
      )}

      {/* Counts */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          to="/admin/children"
          icon="🧒"
          label="Children"
          value={children.length}
        />
        <StatCard
          to="/admin/teacher"
          icon="👩‍🏫"
          label="Teachers"
          value={teacherCount}
        />
        <StatCard
          to="/admin/parent"
          icon="👨‍👩‍👧"
          label="Parents"
          value={parentCount}
        />
        <StatCard
          to="/admin/classes"
          icon="🏫"
          label="Classes"
          value={classes.length}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Today's attendance */}
        <Card title="Today's attendance">
          <div className="grid grid-cols-4 gap-2">
            <AttendanceTile
              value={counts.present}
              label="Present"
              className="bg-[#e3f2ea] text-brand"
            />
            <AttendanceTile
              value={counts.late}
              label="Late"
              className="bg-[#fff0dc] text-[#cd6700]"
            />
            <AttendanceTile
              value={counts.absent}
              label="Absent"
              className="bg-rose-50 text-rose-700"
            />
            <AttendanceTile
              value={notRecorded}
              label="Not yet"
              className="bg-[#f0ede7] text-[#777871]"
            />
          </div>

          {classProgress.length > 0 && (
            <ul className="mt-5 space-y-3">
              {classProgress.map(({ cls, total, marked }) => {
                const done = marked === total;
                return (
                  <li key={cls.id}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="font-semibold text-[#262723]">
                        {cls.name}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs leading-none font-semibold ${
                          done
                            ? "bg-[#e3f2ea] text-brand"
                            : "bg-[#fff0dc] text-[#cd6700]"
                        }`}
                      >
                        {done
                          ? "Done"
                          : marked === 0
                            ? "Not taken yet"
                            : `${marked} of ${total}`}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#ece6dd]">
                      <div
                        className="h-2 rounded-full bg-brand transition-all"
                        style={{ width: `${(marked / total) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {children.length === 0 && (
            <p className="mt-4 text-sm text-[#555c57]">
              There are no children yet. Add the first child to get started.
            </p>
          )}
        </Card>

        <div className="space-y-4">
          {/* Notes progress */}
          <Card title="Teacher notes today">
            {checkedIn === 0 ? (
              <p className="text-sm text-[#555c57]">
                No children have been checked in yet today.
              </p>
            ) : (
              <>
                <p className="text-sm text-[#262723]">
                  <span className="text-2xl font-bold text-brand">
                    {notesToday}
                  </span>{" "}
                  of {checkedIn} children at nursery have a note
                </p>
                <div className="mt-3 h-2 rounded-full bg-[#ece6dd]">
                  <div
                    className="h-2 rounded-full bg-brand transition-all"
                    style={{
                      width: `${Math.min(100, (notesToday / checkedIn) * 100)}%`,
                    }}
                  />
                </div>
              </>
            )}
          </Card>

          {/* Needs attention */}
          <Card title="Needs attention">
            {attention.length === 0 ? (
              <p className="text-sm font-medium text-brand">
                Everything is set up ✓
              </p>
            ) : (
              <ul className="space-y-2">
                {attention.map((item) => (
                  <li key={item.key}>
                    <Link
                      to={item.to}
                      className="block rounded-xl bg-[#fff0dc] p-3 transition hover:bg-[#ffe7c4]"
                    >
                      <p className="text-sm font-semibold text-[#8a4a00]">
                        {item.text}
                      </p>
                      {item.detail && (
                        <p className="mt-0.5 text-xs text-[#8a4a00]/80">
                          {item.detail}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Quick actions */}
          <Card title="Quick actions">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { to: "/admin/children/new", label: " Child" },
                { to: "/admin/teacher/new", label:  " Teacher" },
                { to: "/admin/parent/new", label:   " Parent" },
              ].map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex gap-1 min-h-11 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <img src="/plus.svg" width={18} alt="add"/>
                  {action.label}
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
