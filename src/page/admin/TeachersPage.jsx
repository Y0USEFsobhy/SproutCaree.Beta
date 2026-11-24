import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  getAllTeachersForNursery,
  getClassesForNursery,
} from "../../services/api";
import { useSelector } from "react-redux";
import { getInitials } from "../../utils/initials";
import AddBtn from "../../components/admin/AddBtn";
// import AddBtn from "./AddBtn";
const fieldClass =
  "min-h-11 rounded-xl border border-[#e8e0d4] bg-white px-4 text-sm text-[#262723] placeholder:text-[#9a9d97] focus:border-brand focus:outline-none";

function ParentsPage() {
  const user = useSelector((state) => state.auth.user);
  const [teacherData, setTeacherData] = useState([]);
  const [className, setClassName] = useState([]);
  const [classFilter, setClassFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [teacherResult, className] = await Promise.all([
          getAllTeachersForNursery(user.nurseryId),
          getClassesForNursery(user.nurseryId),
        ]);
        if (!cancelled) {
          setTeacherData(teacherResult);
          setClassName(className);
        }
      } catch {
        if (!cancelled) setError("Couldn't load the parent. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.nurseryId, teacherData?.classId]);

  const classNameById = useMemo(
    () => Object.fromEntries(className.map((c) => [String(c.id), c.name])),
    [className],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return teacherData
      .map((teacher) => ({
        ...teacher,
        classNames: classNameById[String(teacher.classId)] ?? null,
      }))
      .filter((teacher) => {
        if (
          String(teacher.classId) !== String(classFilter) &&
          classFilter != "all"
        )
          return false;
        if (!term) return true;
        return (
          teacher.name.toLowerCase().includes(term) ||
          teacher.phone?.includes(term)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [teacherData, search, classNameById, classFilter]);

  return (
    <div>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand">
            Teacher
          </h1>
          {!loading && !error && (
            <p className="mt-1 text-sm text-[#555c57]">
              {visible.length} {visible.length === 1 ? "Teacher" : "Teachers"}
            </p>
          )}
        </div>
        <AddBtn to={"/admin/teacher/new"} label={"teacher"} />
      </div>
      {/* search */}
      <div className="my-4 flex flex-col gap-3 lg:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by teacher name or phone…"
          aria-label="Search Parent"
          className={`${fieldClass} lg:flex-1`}
        />
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          aria-label="Filter by class"
          className={fieldClass}
        >
          <option value="all">All classes</option>
          {className.map((cls) => (
            <option key={cls.id} value={String(cls.id)}>
              {cls.name}
            </option>
          ))}
        </select>
      </div>

      {/* loading */}
      {loading && (
        <div className="animate-pulse space-y-3" aria-label="Loading parent">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 rounded-2xl bg-[#ece6dd]" />
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      {/* {no parent yet} */}
      {!loading && !error && visible.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-[#555c57]">
          {search
            ? `No parents match "${search}".`
            : "No parents yet. Use the Add button to add the first one."}
        </p>
      )}

      {/* List */}
      {!loading && !error && visible.length > 0 && (
        <ul className="space-y-3 ">
          {visible.map((teacher) => {
            const className = teacher.classNames;

            return (
              <li
                key={teacher.id}
                className={`flex flex-col justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm lg:flex-row lg:items-center `}
              >
                {/* teacher */}
                <div className="flex min-w-0 items-center justify-between lg:min-w-80 lg:w-fit  gap-5 ">
                  <div className="flex gap-3 items-center ">
                    <span
                      className={`grid h-12 w-12 flex-none place-items-center rounded-full text-sm font-bold bg-[#e3f2ea] text-brand `}
                      aria-hidden="true"
                    >
                      {getInitials(teacher.name)}
                    </span>
                    <div className="min-w-0">
                      <Link
                        to={`/admin/teacher/${teacher.uid}`}
                        className="block truncate  font-semibold text-[#262723] hover:text-brand"
                      >
                        {teacher.name}
                      </Link>
                      <p className="text-gray-500 text-[13px] ">
                        {teacher.email}
                      </p>
                    </div>
                  </div>

                  {/* class*/}
                  <div className="min-w-0 flex  justify-between items-center ">
                    <p
                      className={`truncate flex flex-col rounded-full  ${className == null ? "bg-[#fff0dc] text-[#cd6700]" : "bg-[#e3f2ea]  text-brand"}  px-2.5 py-1 text-xs font-semibold`}
                    >
                      {className == null ? "No class" : className}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 ">
                  <a
                    href={`tel:${teacher.phone}`}
                    // className="bg-[#e3f2ea] hover:bg-[#d3ebdf] py-2 px-4  rounded-full flex gap-2 items-center justify-center flex-1/2"
                    className="bg-[#f0ede7] text-[#555c57] hover:bg-[#d3ebdf] py-2 px-4  rounded-full flex gap-2 items-center justify-center flex-1/2"
                  >
                    <img src="/call.svg" width={20} alt="" />
                    Call
                  </a>
                  <Link
                    to={`/admin/teacher/${teacher.id}`}
                    className="bg-[#e3f2ea] hover:bg-[#d3ebdf] py-2 px-4 rounded-full flex gap-2 items-center justify-center flex-1/2"
                  >
                    Edit
                    <img src="/chevron.svg" width={15} alt="" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ParentsPage;
