import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  getAllChildrenForNursery,
  getParentsForNursery,
} from "../../services/api";
import { useSelector } from "react-redux";
import { getInitials } from "../../utils/initials";
import AddBtn from "./AddBtn";
const fieldClass =
  "min-h-11 rounded-xl border border-[#e8e0d4] bg-white px-4 text-sm text-[#262723] placeholder:text-[#9a9d97] focus:border-brand focus:outline-none";

function ParentsList() {
  const user = useSelector((state) => state.auth.user);
  const [parentData, setParentData] = useState([]);
  const [childrenData, setChildrenData] = useState([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const [parentResult, childrenReslt] = await Promise.all([
          getParentsForNursery(user.nurseryId),
          getAllChildrenForNursery(user.nurseryId),
        ]);
        if (!cancelled) {
          setParentData(parentResult);
          setChildrenData(childrenReslt);
        }
      } catch {
        if (!cancelled)
          setError("Couldn't load the parent. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.nurseryId]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();

    return parentData
      .map((parent) => ({
        ...parent,
        children: childrenData.filter((c) =>
          c.parentUids?.includes(parent.uid),
        ),
      }))
      .filter((parent) => {
        if (!term) return true;
        return (
          parent.name.toLowerCase().includes(term) ||
          parent.phone?.includes(term) ||
          parent.children.some((c) => c.name.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [parentData, childrenData, search]);

  return (
    <div>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand">
            Parents
          </h1>
          {!loading && !error && (
            <p className="mt-1 text-sm text-[#555c57]">
              {visible.length} {visible.length === 1 ? "parent" : "parents"}
            </p>
          )}
        </div>
        <AddBtn to={"/admin/parent/new"} label={"parent"} />
      </div>
      {/* search */}
      <div className="my-4 flex flex-col gap-3 lg:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by child, parent name or phone…"
          aria-label="Search Parent"
          className={`${fieldClass} lg:flex-1`}
        />
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
          {visible.map((parent) => {
            const children = parent.children;

            return (
              <li
                key={parent.uid}
                className={`flex flex-col justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm lg:flex-row lg:items-center `}
              >
                {/* parent */}
                <div className="flex min-w-0 items-center justify-between lg:min-w-80 lg:w-fit  gap-5 ">
                  <div className="flex gap-3 items-center ">
                    <span
                      className={`grid h-12 w-12 flex-none place-items-center rounded-full text-sm font-bold bg-[#e3f2ea] text-brand `}
                      aria-hidden="true"
                    >
                      {getInitials(parent.name)}
                    </span>
                    <div className="min-w-0">
                      <Link
                        to={`/admin/parent/${parent.uid}`}
                        className="block truncate  font-semibold text-[#262723] hover:text-brand"
                      >
                        {parent.name}
                        {/* {parent.name.split(" ").slice(0, 3).join(" ")} */}
                      </Link>
                      <p className="text-gray-500 text-[13px] ">
                        {search != ""
                          ? children.map((c) => c.name).join(" - ")
                          : parent.email}
                      </p>
                    </div>
                  </div>

                  {/* Children*/}
                  <div className="min-w-0 flex  justify-between items-center ">
                    {children.length > 0 ? (
                      // <p className="truncate flex flex-col  text-sm text-[#555c57]">
                      //   {children.map((p) => p.name).join(" · ")}
                      // </p>
                      <span className="rounded-full min-w-[75px] text-center bg-[#e3f2ea] px-2.5 py-1 text-xs font-semibold text-brand">
                        {children.length}{" "}
                        {children.length > 1 ? "children" : "child"}
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#fff0dc] px-2.5 py-1 text-xs font-semibold text-[#cd6700]">
                        No children linked
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 ">
                  <a
                    href={`tel:${parent.phone}`}
                    // className="bg-[#e3f2ea] hover:bg-[#d3ebdf] py-2 px-4  rounded-full flex gap-2 items-center justify-center flex-1/2"
                    className="bg-[#f0ede7] text-[#555c57] hover:bg-[#d3ebdf] py-2 px-4  rounded-full flex gap-2 items-center justify-center flex-1/2"
                  >
                    <img
                      src="/call.svg"
                      width={20}
                      alt=""
                    />
                    Call
                  </a>
                  <Link
                    to={`/admin/parent/${parent.uid}`}
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

export default ParentsList;
