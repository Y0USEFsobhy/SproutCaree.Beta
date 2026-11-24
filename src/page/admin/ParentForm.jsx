import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useSelector } from "react-redux";
import {
  getAllChildrenForNursery,
  getParentsForNursery,
  createParent,
  updateParent,
  deleteParent,
} from "../../services/api";
import { getInitials } from "../../utils/initials";
import BackBtn from "../../components/admin/BackBtn";

const fieldClass =
  "min-h-11 w-full rounded-xl border border-[#e8e0d4] bg-white px-4 text-sm text-[#262723] placeholder:text-[#9a9d97] focus:border-brand focus:outline-none disabled:bg-[#f5f1ea] disabled:text-[#7a7d77]";
const labelClass = "mb-1 block text-sm font-semibold text-[#262723]";
const errorClass = "mt-1 text-xs text-rose-600";

const emptyForm = { name: "", email: "", phone: "", password: "" };

function ParentForm() {
  // /admin/parent/new  -> uid is undefined  -> add mode
  // /admin/parent/:uid -> uid exists        -> edit mode
  const { uid } = useParams();
  const isEdit = Boolean(uid);

  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [form, setForm] = useState(emptyForm);
  const [allChildren, setAllChildren] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]); // child ids linked to this parent
  const [originalIds, setOriginalIds] = useState([]); // to know what to add/remove on save
  const [childSearch, setChildSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // delete
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ---------- load data ----------
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const children = await getAllChildrenForNursery(user.nurseryId);
        if (cancelled) return;
        setAllChildren(children);

        if (isEdit) {
          const parents = await getParentsForNursery(user.nurseryId);
          if (cancelled) return;
          const parent = parents.find((p) => p.uid === uid);
          if (!parent) {
            setError("This parent was not found.");
            return;
          }
          setForm({
            name: parent.name || "",
            email: parent.email || "",
            phone: parent.phone || "",
            password: "",
          });
          const linked = children
            .filter((c) => c.parentUids?.includes(uid))
            .map((c) => c.id);
          setSelectedIds(linked);
          setOriginalIds(linked);
        }
      } catch {
        if (!cancelled) setError("Couldn't load the data. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [uid, isEdit, user?.nurseryId]);

  // ---------- children picker ----------
  const visibleChildren = useMemo(() => {
    const term = childSearch.trim().toLowerCase();
    return allChildren
      .filter((c) => !term || c.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allChildren, childSearch]);

  const toggleChild = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  // ---------- form ----------
  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFieldErrors((errs) => ({ ...errs, [key]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.phone.trim()) errs.phone = "Phone is required.";
    else if (!/^[+\d][\d\s-]{6,}$/.test(form.phone.trim()))
      errs.phone = "Enter a valid phone number.";
    if (!isEdit) {
      if (!form.email.trim()) errs.email = "Email is required.";
      else if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
        errs.email = "Enter a valid email.";
      if (form.password.length < 6)
        errs.password = "Password must be at least 6 characters.";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving || deleting || !validate()) return;

    setSaving(true);
    setError("");
    try {
      const data = {
        name: form.name.trim(),
        phone: form.phone.trim(),
      };

      if (isEdit) {
        await updateParent(uid, data, {
          nurseryId: user.nurseryId,
          childIds: selectedIds,
          previousChildIds: originalIds,
        });
      } else {
        await createParent({
          ...data,
          email: form.email.trim(),
          password: form.password,
          nurseryId: user.nurseryId,
          childIds: selectedIds,
        });
      }
      navigate("/admin/parent");
    } catch (err) {
      setError(
        err?.code === "auth/email-already-in-use"
          ? "This email is already used by another account."
          : "Couldn't save. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ---------- delete ----------
  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      // every child currently linked to this parent (as stored in the database)
      const linkedChildren = allChildren.filter((c) =>
        c.parentUids?.includes(uid),
      );
      await deleteParent(uid, linkedChildren);
      navigate("/admin/parent", {
        state: { message: `${form.name} was deleted.` },
      });
    } catch {
      setDeleteError("Couldn't delete this parent. Please try again.");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  // ---------- render ----------
  if (loading) {
    return (
      <div className="animate-pulse space-y-3" aria-label="Loading">
        <div className="h-8 w-40 rounded-xl bg-[#ece6dd]" />
        <div className="h-64 rounded-2xl bg-[#ece6dd]" />
      </div>
    );
  }

  // parent not found in edit mode
  if (isEdit && error && !form.name) {
    return (
      <div>
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
        </p>
        <Link
          to="/admin/parent"
          className="mt-4 inline-block text-sm font-semibold text-brand"
        >
          ← Back to parents
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <BackBtn to={"/admin/parent"} label={"Back to parents"} />

      <div className="mt-3 flex items-center gap-3">
        {isEdit && (
          <span
            className="grid h-12 w-12 flex-none place-items-center rounded-full bg-[#e3f2ea] text-sm font-bold text-brand"
            aria-hidden="true"
          >
            {getInitials(form.name || "?")}
          </span>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-brand">
          {isEdit ? "Edit parent" : "Add parent"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-5">
        {/* Details */}
        <section className="space-y-4 rounded-2xl bg-white p-4 shadow-sm">
          <div>
            <label htmlFor="name" className={labelClass}>
              Full name
            </label>
            <input
              id="name"
              value={form.name}
              onChange={setField("name")}
              placeholder="e.g. Sara Ahmed"
              className={fieldClass}
              autoComplete="off"
            />
            {fieldErrors.name && <p className={errorClass}>{fieldErrors.name}</p>}
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              value={form.phone}
              onChange={setField("phone")}
              placeholder="01xxxxxxxxx"
              className={fieldClass}
            />
            {fieldErrors.phone && (
              <p className={errorClass}>{fieldErrors.phone}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              Email {isEdit && <span className="font-normal">(can't be changed)</span>}
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={setField("email")}
              placeholder="parent@example.com"
              className={fieldClass}
              disabled={isEdit}
              autoComplete="off"
            />
            {fieldErrors.email && (
              <p className={errorClass}>{fieldErrors.email}</p>
            )}
          </div>

          {!isEdit && (
            <div>
              <label htmlFor="password" className={labelClass}>
                Temporary password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={setField("password")}
                  placeholder="At least 6 characters"
                  className={`${fieldClass} pr-16`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1 text-xs text-[#555c57]">
                Share it with the parent so they can sign in.
              </p>
              {fieldErrors.password && (
                <p className={errorClass}>{fieldErrors.password}</p>
              )}
            </div>
          )}
        </section>

        {/* Children */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#262723]">Children</h2>
            <span className="rounded-full bg-[#e3f2ea] px-2.5 py-1 text-xs font-semibold text-brand">
              {selectedIds.length} selected
            </span>
          </div>

          <input
            type="search"
            value={childSearch}
            onChange={(e) => setChildSearch(e.target.value)}
            placeholder="Search children…"
            aria-label="Search children"
            className={`${fieldClass} mt-3`}
          />

          {allChildren.length === 0 ? (
            <p className="mt-3 text-sm text-[#555c57]">
              No children in this nursery yet.
            </p>
          ) : visibleChildren.length === 0 ? (
            <p className="mt-3 text-sm text-[#555c57]">
              No children match "{childSearch}".
            </p>
          ) : (
            <ul className="mt-3 max-h-72 space-y-1 overflow-y-auto">
              {visibleChildren.map((child) => {
                const checked = selectedIds.includes(child.id);
                return (
                  <li key={child.id}>
                    <label
                      className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-[#f5f1ea] ${
                        checked ? "bg-[#e3f2ea]" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleChild(child.id)}
                        className="h-4 w-4 accent-[#1f7a4d]"
                      />
                      <span className="text-sm text-[#262723]">
                        {child.name}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            to="/admin/parent"
            className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#e3f2ea] px-4 py-2 text-sm font-semibold text-brand hover:bg-[#d3ebdf]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || deleting}
            className="min-h-11 flex-1 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add parent"}
          </button>
        </div>
      </form>

      {/* Delete (edit mode only) — outside the <form> so Enter never triggers it */}
      {isEdit && (
        <section className="mt-8 rounded-2xl border border-rose-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-rose-700">Delete parent</h2>

          {!confirmingDelete ? (
            <>
              <p className="mt-1 text-xs text-[#555c57]">
                Removes this parent's profile
                {originalIds.length > 0 &&
                  ` and unlinks them from ${originalIds.length} ${
                    originalIds.length === 1 ? "child" : "children"
                  }`}
                . The children themselves are not deleted. This can't be undone.
              </p>
              <button
                type="button"
                onClick={() => {
                  setDeleteError("");
                  setConfirmingDelete(true);
                }}
                className="mt-3 min-h-11 rounded-full border border-rose-300 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                Delete parent
              </button>
            </>
          ) : (
            <div role="alertdialog" aria-label="Confirm delete">
              <p className="mt-1 text-sm text-[#262723]">
                Are you sure you want to delete{" "}
                <span className="font-semibold">{form.name}</span>?
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="min-h-11 flex-1 rounded-full bg-[#f5f1ea] px-4 text-sm font-semibold text-[#555c57] disabled:opacity-60"
                >
                  Keep parent
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="min-h-11 flex-1 rounded-full bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
              </div>
            </div>
          )}

          {deleteError && (
            <p role="alert" className="mt-3 text-sm text-rose-700">
              {deleteError}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

export default ParentForm;