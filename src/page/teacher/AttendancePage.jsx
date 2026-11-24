import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  getAttendanceForDate,
  getChildrenForClass,
  getClassById,
  saveAttendance,
} from "../../services/api";
// import MainInfo from "../../components/MainInfo";
import Attendance from "../../components/teacher/Attendance";

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

function AttendancePage() {
  const user = useSelector((state) => state.auth.user);

  const [children, setChildren] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(getToday());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadClassData = async () => {
      if (!user?.classId || !user?.nurseryId) {
        // setClassRoom(null);
        setChildren([]);
        setAttendance({});
        setError("Your account is not assigned to a class.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setSuccess("");

      try {
        const [classData, childrenData, attendanceData] = await Promise.all([
          getClassById(user.classId, user.nurseryId),
          getChildrenForClass(user.classId, user.nurseryId),
          getAttendanceForDate(user.nurseryId, date),
        ]);

        if (cancelled) return;

        // setClassRoom(classData);
        setChildren(childrenData);

        // Unrecorded until a status is chosen (matches home page "Not recorded").
        const initialAttendance = {};

        childrenData.forEach((child) => {
          initialAttendance[child.id] = null;
        });

        attendanceData.forEach((record) => {
          if (Object.hasOwn(initialAttendance, record.childId)) {
            initialAttendance[record.childId] = record.status;
          }
        });

        setAttendance(initialAttendance);

        if (!classData) {
          setError("We couldn't find your assigned class.");
        }
      } catch {
        if (!cancelled) {
          setError("Couldn't load your class. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadClassData();

    return () => {
      cancelled = true;
    };
  }, [user?.classId, user?.nurseryId, date]);

  const filteredChildren = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return children;

    return children.filter((child) => child.name.toLowerCase().includes(query));
  }, [children, search]);

  const attendanceCounts = useMemo(() => {
    return children.reduce(
      (counts, child) => {
        const status = attendance[child.id];

        if (status && counts[status] !== undefined) {
          counts[status] += 1;
        } else {
          counts.notRecorded += 1;
        }

        return counts;
      },
      { present: 0, absent: 0, late: 0, notRecorded: 0 },
    );
  }, [children, attendance]);

  const handleStatusChange = (childId, status) => {
    setAttendance((current) => ({
      ...current,
      [childId]: status,
    }));

    setSuccess("");
  };

  const handleMarkAll = (status) => {
    setAttendance((current) => {
      const next = { ...current };

      children.forEach((child) => {
        next[child.id] = status;
      });

      return next;
    });

    setSuccess("");
  };

  const handleSaveAttendance = async () => {
    if (!user?.nurseryId || children.length === 0) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const records = children
        .filter((child) => attendance[child.id])
        .map((child) => ({
          nurseryId: user.nurseryId,
          childId: child.id,
          parentUids: child.parentUids ?? [],
          date,
          status: attendance[child.id],
        }));

      if (records.length === 0) {
        setError("Mark at least one child before saving.");
        setSaving(false);
        return;
      }

      await saveAttendance(records);

      setSuccess("Attendance saved successfully.");
    } catch {
      setError(
        "Couldn't save attendance. Please check your browser storage and try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div
          className="mx-auto max-w-7xl animate-pulse space-y-6"
          aria-label="Loading teacher dashboard"
        >
          <div className="h-8 w-64 rounded-lg bg-slate-200" />
          <div className="h-36 rounded-2xl bg-slate-200" />
          <div className="h-64 rounded-2xl bg-slate-200" />
        </div>
      </main>
    );
  }
  return (
    <main className="text-slate-800">
      <p className="text-2xl px-4 my-5 font-bold  text-brand">Who’s Here Today?</p>
      <Attendance
        children={children}
        attendanceCounts={attendanceCounts}
        setSuccess={setSuccess}
        filteredChildren={filteredChildren}
        getInitials={getInitials}
        attendance={attendance}
        handleStatusChange={handleStatusChange}
        handleMarkAll={handleMarkAll}
        handleSaveAttendance={handleSaveAttendance}
        saving={saving}
        search={search}
        setSearch={setSearch}
        getToday={getToday}
        date={date}
        setDate={setDate}
      />
    </main>
  );
}

export default AttendancePage;
