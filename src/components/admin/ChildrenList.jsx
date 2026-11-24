// src/page/admin/ChildrenList.jsx
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router";
import ConfirmDialog from "./ConfirmDialog";
import {
  getAllChildrenForNursery,
  getClassesForNursery,
  setChildActive,
} from "../../services/api";
import { getAge } from "../../utils/age";
import { getInitials } from "../../utils/initials";
import AddBtn from "./AddBtn";

const STATUS_FILTERS = [
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "all", label: "All" },
];

const fieldClass =
  "min-h-11 rounded-xl border border-[#e8e0d4] bg-white px-4 text-sm text-[#262723] placeholder:text-[#9a9d97] focus:border-brand focus:outline-none";

export default function ChildrenList() {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const navigate = useNavigate();

  const [children, setChildren] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");

  const [toast, setToast] = useState(location.state?.message ?? "");
  const [toDeactivate, setToDeactivate] = useState(null);
  const [busy, setBusy] = useState(false);

  // The form sends a message through the navigation state. Show it once.
  useEffect(() => {
    if (location.state?.message) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!user?.nurseryId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [childrenResult, classesResult] = await Promise.all([
          getAllChildrenForNursery(user.nurseryId),
          getClassesForNursery(user.nurseryId),
        ]);

        if (!cancelled) {
          setChildren(childrenResult);
          setClasses(classesResult);
        }
      } catch {
        if (!cancelled)
          setError("Couldn't load the children. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.nurseryId]);

  const classNames = useMemo(
    () => Object.fromEntries(classes.map((c) => [String(c.id), c.name])),
    [classes],
  );
  //false = remove 
  //true = keep
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return children.filter((child) => {
      if (statusFilter === "active" && !child.active) return false;
      if (statusFilter === "inactive" && child.active) return false;
      if (classFilter !== "all" && String(child.classId) !== classFilter)
        return false;

      if (!term) return true;
      const parentNames = (child.parents ?? []).map((p) => p.name).join(" ");
      return `${child.name} ${parentNames}`.toLowerCase().includes(term);
    });
  }, [children, search, classFilter, statusFilter]);

  const activeCount = children.filter((c) => c.active).length;

  const updateActive = async (child, active) => {
    setBusy(true);
    try {
      await setChildActive(child.id, active);
      setChildren((list) =>
        list.map((c) => (c.id === child.id ? { ...c, active } : c)),
      );
      setToast(
        active
          ? `${child.name} is active again.`
          : `${child.name} was deactivated.`,
      );
    } catch {
      setToast("");
      setError("Couldn't update the child. Please try again.");
    } finally {
      setBusy(false);
      setToDeactivate(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand">
            Children
          </h1>
          {!loading && !error && (
            <p className="mt-1 text-sm text-[#555c57]">
              {activeCount} active {activeCount === 1 ? "child" : "children"}
            </p>
          )}
        </div>
        <AddBtn to={"/admin/children/new"} label={"child"}/>
      </div>

      {toast && (
        <p
          role="status"
          className="mb-4 rounded-xl bg-[#e3f2ea] p-3 text-sm font-medium text-brand"
        >
          ✓ {toast}
        </p>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by child or parent name…"
          aria-label="Search children"
          className={`${fieldClass} lg:flex-1`}
        />
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          aria-label="Filter by class"
          className={fieldClass}
        >
          <option value="all">All classes</option>
          {classes.map((cls) => (
            <option key={cls.id} value={String(cls.id)}>
              {cls.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2" role="group" aria-label="Filter by status">
          {STATUS_FILTERS.map((item) => {
            const active = statusFilter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={active}
                onClick={() => setStatusFilter(item.key)}
                className={`min-h-11 flex-1 rounded-xl px-4 text-sm font-semibold transition lg:flex-none ${
                  active
                    ? "bg-brand text-white"
                    : "bg-white text-[#555c57] hover:bg-[#f0ede7]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="animate-pulse space-y-3" aria-label="Loading children">
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

      {/* Empty */}
      {!loading && !error && visible.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#555c57] shadow-sm">
          {children.length === 0
            ? "No children yet. Add the first child to get started."
            : "No children match your filters."}
        </p>
      )}

      {/* List */}
      {!loading && !error && visible.length > 0 && (
        <ul className="space-y-3">
          {visible.map((child) => {
            const parents = child.parents ?? [];
            const age = getAge(child.birthDate);

            return (
              <li
                key={child.id}
                className={`flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm lg:flex-row lg:items-center ${
                  child.active ? "" : "opacity-70"
                }`}
              >
                {/* Child */}
                <div className="flex min-w-0 items-center gap-3 lg:w-80">
                  <div className="flex justify-between w-full ">
                    <div className="flex gap-3 items-center ">
                      <span
                        className={`grid h-12 w-12 flex-none place-items-center rounded-full text-sm font-bold ${
                          child.active
                            ? "bg-[#e3f2ea] text-brand"
                            : "bg-[#f0ede7] text-[#777871]"
                        }`}
                        aria-hidden="true"
                      >
                        {getInitials(child.name)}
                      </span>
                      <div className="min-w-0">
                        <Link
                          to={`/admin/children/${child.id}`}
                          className="block truncate  font-semibold text-[#262723] hover:text-brand"
                        >
                          {child.name.split(" ").slice(0, 3).join(" ")}
                        </Link>
                        <p className="text-xs text-[#777871]">
                          {[age, child.gender === "female" ? "Girl" : "Boy"]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Class */}
                  <div className="lg:w-36">
                    <span className="rounded-full bg-[#e3f2ea] px-2.5 py-1 text-xs font-semibold text-brand">
                      {classNames[String(child.classId)] ??
                        `Class ${child.classId}`}
                    </span>
                  </div>
                </div>

                {/* Parents and alerts */}
                <div className="min-w-0 flex-1">
                  {parents.length > 0 ? (
                    <p className="truncate text-sm text-[#555c57]">
                      {parents.map((p) => p.name).join(" · ")}
                    </p>
                  ) : (
                    <span className="rounded-full bg-[#fff0dc] px-2.5 py-1 text-xs font-semibold text-[#cd6700]">
                      No parent linked
                    </span>
                  )}
                  {child.allergies?.trim() && (
                    <p className="mt-1 truncate text-xs font-semibold text-[#cd6700]">
                      ⚠️ {child.allergies}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    to={`/admin/children/${child.id}`}
                    className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#e3f2ea] px-4 text-sm font-semibold text-brand transition hover:bg-[#d3ebdf] lg:flex-none"
                  >
                    Edit
                  </Link>
                  {child.active ? (
                    <button
                      type="button"
                      onClick={() => setToDeactivate(child)}
                      className="min-h-11 flex-1 rounded-full bg-[#f0ede7] px-4 text-sm font-semibold text-[#555c57] transition hover:bg-rose-50 hover:text-rose-700 lg:flex-none"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateActive(child, true)}
                      disabled={busy}
                      className="min-h-11 flex-1 rounded-full bg-brand px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 lg:flex-none"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDeactivate)}
        title={`Deactivate ${toDeactivate?.name ?? ""}?`}
        message="They will no longer appear in attendance, notes or the parents' app. Their history is kept, and you can activate them again at any time."
        confirmLabel="Deactivate"
        danger
        busy={busy}
        onConfirm={() => updateActive(toDeactivate, false)}
        onCancel={() => setToDeactivate(null)}
      />
    </div>
  );
}
