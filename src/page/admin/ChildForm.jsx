// src/page/admin/ChildForm.jsx
// Used by two routes:
//   /admin/children/new        -> add a child
//   /admin/children/:childId   -> edit a child
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router";
import {
  getChildForAdmin,
  getClassesForNursery,
  getParentsForNursery,
  saveChild,
} from "../../services/api";
import BackBtn from "../../components/admin/BackBtn";

const RELATIONS = ["Father", "Mother", "Guardian", "Other"];

const inputClass =
  "w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#262723] placeholder:text-[#9a9d97] focus:border-brand focus:outline-none";

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
const cleanPhone = (value) => value.replace(/[\s-]/g, "");
const isValidPhone = (value) => /^\+\d{8,15}$/.test(cleanPhone(value));
const emptyPerson = () => ({ name: "", relation: "", phone: "" });
const isEmptyPerson = (p) =>
  !p.name.trim() && !p.relation.trim() && !p.phone.trim();

const todayISO = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

const EMPTY_FORM = {
  name: "",
  birthDate: "",
  gender: "",
  classId: "",
  allergies: "",
  careNotes: "",
  active: true,
};

// ---------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------
function Card({ title, hint, children, className = "" }) {
  return (
    <section className={`rounded-2xl bg-white p-5 shadow-sm ${className}`}>
      <h2 className="text-sm font-semibold text-brand">{title}</h2>
      {hint && <p className="mt-1 mb-3 text-xs text-[#777871]">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </section>
  );
}

function Label({ children }) {
  return (
    <span className="mb-1 block text-xs font-semibold text-[#777871]">
      {children}
    </span>
  );
}

function PersonFields({ legend, person, onChange, onRemove }) {
  const set = (field) => (event) =>
    onChange({ ...person, [field]: event.target.value });

  return (
    <fieldset className="mb-3 rounded-xl border border-[#f0ede7] p-3">
      <legend className="px-1 text-xs font-semibold text-[#777871]">
        {legend}
      </legend>
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          className={inputClass}
          value={person.name}
          onChange={set("name")}
          placeholder="Full name"
          aria-label={`${legend} name`}
        />
        <input
          className={inputClass}
          value={person.relation}
          onChange={set("relation")}
          placeholder="Relation"
          aria-label={`${legend} relation`}
        />
        <input
          className={inputClass}
          type="tel"
          inputMode="tel"
          value={person.phone}
          onChange={set("phone")}
          placeholder="+20 100 000 0000"
          aria-label={`${legend} phone`}
        />
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 min-h-11 rounded-xl px-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
        >
          Remove
        </button>
      )}
    </fieldset>
  );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------
export default function ChildForm() {
  const { childId } = useParams();
  const isEdit = Boolean(childId);

  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [classes, setClasses] = useState([]);
  const [parentUsers, setParentUsers] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedParents, setSelectedParents] = useState([]); // [{ uid, relation }]
  const [originalParents, setOriginalParents] = useState([]); // parents as stored on the child
  const [originalParentUids, setOriginalParentUids] = useState([]);
  const [parentSearch, setParentSearch] = useState("");
  const [emergency, setEmergency] = useState(emptyPerson());
  const [pickup, setPickup] = useState([]);

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // Load classes, parents and (when editing) the child
  useEffect(() => {
    if (!user?.nurseryId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const [classesResult, parentsResult, child] = await Promise.all([
          getClassesForNursery(user.nurseryId),
          getParentsForNursery(user.nurseryId),
          isEdit ? getChildForAdmin(childId) : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setClasses(classesResult);
        setParentUsers(parentsResult);

        if (!isEdit) return;

        if (!child || String(child.nurseryId) !== String(user.nurseryId)) {
          setLoadError("We couldn't find this child.");
          return;
        }

        const uids = child.parentUids ?? [];
        const storedParents = child.parents ?? [];

        setForm({
          name: child.name ?? "",
          birthDate: child.birthDate ?? "",
          gender: child.gender ?? "",
          classId: String(child.classId ?? ""),
          allergies: child.allergies ?? "",
          careNotes: child.careNotes ?? "",
          active: child.active !== false,
        });
        setSelectedParents(
          uids.map((uid) => ({
            uid,
            relation:
              storedParents.find((p) => p.uid === uid)?.relation || "Guardian",
          })),
        );
        setOriginalParents(storedParents);
        setOriginalParentUids(uids);
        setEmergency(
          child.emergencyContact
            ? { ...emptyPerson(), ...child.emergencyContact }
            : emptyPerson(),
        );
        setPickup(
          (child.authorizedPickup ?? []).map((p) => ({
            ...emptyPerson(),
            ...p,
          })),
        );
      } catch {
        if (!cancelled)
          setLoadError("Couldn't load the form. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.nurseryId, childId, isEdit]);

  const isSelected = (uid) => selectedParents.some((p) => p.uid === uid);

  const toggleParent = (uid) =>
    setSelectedParents((list) =>
      list.some((p) => p.uid === uid)
        ? list.filter((p) => p.uid !== uid)
        : [...list, { uid, relation: "Guardian" }],
    );

  const setRelation = (uid, relation) =>
    setSelectedParents((list) =>
      list.map((p) => (p.uid === uid ? { ...p, relation } : p)),
    );

  const visibleParents = parentUsers.filter((p) => {
    const term = parentSearch.trim().toLowerCase();
    if (!term) return true;
    return `${p.name ?? ""} ${p.phone ?? ""} ${p.email ?? ""}`
      .toLowerCase()
      .includes(term);
  });

  const validatePerson = (person, label) => {
    if (!person.name.trim()) return `${label}: please enter a name.`;
    if (!isValidPhone(person.phone)) {
      return `${label}: enter the phone with the country code, like +201000000000.`;
    }
    return "";
  };

  const validate = () => {
    if (form.name.trim().length < 2) return "Please enter the child's name.";
    if (!form.birthDate) return "Please choose the birth date.";
    if (form.birthDate > todayISO())
      return "The birth date can't be in the future.";
    if (!form.gender) return "Please choose boy or girl.";
    if (!form.classId) return "Please choose a class.";

    if (!isEmptyPerson(emergency)) {
      const problem = validatePerson(emergency, "Emergency contact");
      if (problem) return problem;
    }

    const filled = pickup.filter((p) => !isEmptyPerson(p));
    for (let i = 0; i < filled.length; i += 1) {
      const problem = validatePerson(filled[i], `Pickup person ${i + 1}`);
      if (problem) return problem;
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }

    // Parents are saved with their details, so the teacher sees them without
    // reading the users collection.
    const parents = selectedParents.map(({ uid, relation }) => {
      const account = parentUsers.find((u) => u.uid === uid);
      const stored = originalParents.find((p) => p.uid === uid);
      return {
        uid,
        name: account?.name ?? stored?.name ?? "",
        relation,
        phone: account?.phone ?? stored?.phone ?? "",
      };
    });

    const emergencyContact = isEmptyPerson(emergency)
      ? null
      : {
          name: emergency.name.trim(),
          relation: emergency.relation.trim(),
          phone: cleanPhone(emergency.phone),
        };

    const authorizedPickup = pickup
      .filter((p) => !isEmptyPerson(p))
      .map((p) => ({
        name: p.name.trim(),
        relation: p.relation.trim(),
        phone: cleanPhone(p.phone),
      }));

    setSaving(true);
    setFormError("");

    try {
      const name = form.name.trim();

      await saveChild(
        {
          id: isEdit ? childId : undefined,
          nurseryId: user.nurseryId,
          name,
          birthDate: form.birthDate,
          gender: form.gender,
          classId: form.classId,
          parents,
          allergies: form.allergies.trim(),
          careNotes: form.careNotes.trim(),
          emergencyContact,
          authorizedPickup,
          active: form.active,
        },
        originalParentUids,
      );

      navigate("/admin/children", {
        state: {
          message: isEdit ? `${name} was updated.` : `${name} was added.`,
        },
      });
    } catch {
      setFormError(
        "Couldn't save. Please check your connection and try again.",
      );
      setSaving(false);
    }
  };

  // ----- No nursery -----
  if (!user?.nurseryId) {
    return (
      <div>
        <BackBtn to={"/admin/children"} label={"Children"}/>
        <p className="rounded-2xl bg-white p-6 text-sm text-[#555c57] shadow-sm">
          Your account is not linked to a nursery.
        </p>
      </div>
    );
  }

  // ----- Loading -----
  if (loading) {
    return (
      <div className="max-w-2xl animate-pulse space-y-4" aria-label="Loading">
        <div className="h-8 w-40 rounded-lg bg-[#ece6dd]" />
        <div className="h-56 rounded-2xl bg-[#ece6dd]" />
        <div className="h-56 rounded-2xl bg-[#ece6dd]" />
      </div>
    );
  }

  // ----- Load error -----
  if (loadError) {
    return (
      <div>
        <BackBtn to={"/admin/children"} label={"Children"}/>
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {loadError}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <BackBtn to={"/admin/children"} label={"Children"}/>
      <h1 className="mb-5 text-2xl font-bold tracking-tight text-brand">
        {isEdit ? "Edit child" : "Add a child"}
      </h1>

      {/* Basic information */}
      <Card title="Basic information">
        <div className="space-y-4">
          <label className="block">
            <Label>Full name</Label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Omar Ahmed"
              maxLength={80}
            />
          </label>

          <label className="block">
            <Label>Birth date</Label>
            <input
              className={inputClass}
              type="date"
              value={form.birthDate}
              max={todayISO()}
              onChange={(e) => setField("birthDate", e.target.value)}
            />
          </label>

          <fieldset>
            <legend className="mb-1 text-xs font-semibold text-[#777871]">
              Gender
            </legend>
            <div className="flex gap-2">
              {[
                { value: "male", label: "Boy" },
                { value: "female", label: "Girl" },
              ].map((option) => {
                const selected = form.gender === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setField("gender", option.value)}
                    className={`min-h-11 flex-1 rounded-xl border text-sm font-semibold transition ${
                      selected
                        ? "border-brand bg-brand text-white"
                        : "border-[#e8e0d4] bg-white text-[#555c57] hover:bg-[#f0ede7]"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <Label>Class</Label>
            <select
              className={inputClass}
              value={form.classId}
              onChange={(e) => setField("classId", e.target.value)}
            >
              <option value="">Choose a class…</option>
              {classes.map((cls) => (
                <option key={cls.id} value={String(cls.id)}>
                  {cls.name}
                  {cls.ageGroup ? ` (${cls.ageGroup})` : ""}
                </option>
              ))}
            </select>
            {classes.length === 0 && (
              <span className="mt-1 block text-xs text-[#cd6700]">
                There are no classes yet.{" "}
                <Link to="/admin/classes" className="font-semibold underline">
                  Create a class first
                </Link>
                .
              </span>
            )}
          </label>

          {isEdit && (
            <label className="flex min-h-11 items-center gap-3 rounded-xl bg-[#f7f4ee] px-3">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setField("active", e.target.checked)}
                className="h-5 w-5 accent-brand"
              />
              <span className="text-sm text-[#262723]">
                Active (attends the nursery and appears in attendance and notes)
              </span>
            </label>
          )}
        </div>
      </Card>

      {/* Parents */}
      <Card
        title="Parents"
        hint="Only parents who already have an account can be linked. They will see this child in their app."
        className="mt-4"
      >
        {parentUsers.length === 0 ? (
          <p className="text-sm text-[#555c57]">
            No parent accounts yet.{" "}
            <Link
              to="/admin/parents/new"
              className="font-semibold text-brand underline"
            >
              Add a parent
            </Link>{" "}
            first, then come back to link them.
          </p>
        ) : (
          <>
            <input
              type="search"
              className={inputClass}
              value={parentSearch}
              onChange={(e) => setParentSearch(e.target.value)}
              placeholder="Search parents…"
              aria-label="Search parents"
            />

            <ul className="mt-3 max-h-72 divide-y divide-[#f0ede7] overflow-y-auto rounded-xl border border-[#f0ede7]">
              {visibleParents.length === 0 && (
                <li className="p-3 text-sm text-[#555c57]">
                  No parents match.
                </li>
              )}
              {visibleParents.map((parent) => {
                const selected = isSelected(parent.uid);
                const current = selectedParents.find(
                  (p) => p.uid === parent.uid,
                );

                return (
                  <li
                    key={parent.uid}
                    className="flex flex-wrap items-center gap-3 p-3"
                  >
                    <label className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleParent(parent.uid)}
                        className="h-5 w-5 flex-none accent-brand"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[#262723]">
                          {parent.name}
                        </span>
                        <span className="block truncate text-xs text-[#777871]">
                          {[parent.phone, parent.email]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                    </label>

                    {selected && (
                      <select
                        value={current.relation}
                        onChange={(e) =>
                          setRelation(parent.uid, e.target.value)
                        }
                        aria-label={`Relation of ${parent.name}`}
                        className="min-h-11 rounded-xl border border-[#e8e0d4] bg-white px-3 text-sm"
                      >
                        {RELATIONS.map((relation) => (
                          <option key={relation} value={relation}>
                            {relation}
                          </option>
                        ))}
                      </select>
                    )}
                  </li>
                );
              })}
            </ul>

            <p className="mt-3 text-xs text-[#777871]">
              {selectedParents.length} selected.
              {selectedParents.length === 0 &&
                " Without a linked parent, nobody can see this child in the parents' app."}
            </p>
          </>
        )}
      </Card>

      {/* Health and care */}
      <Card title="Health and care" className="mt-4">
        <div className="space-y-4">
          <label className="block">
            <Label>Allergies / medical alert</Label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              maxLength={300}
              value={form.allergies}
              onChange={(e) => setField("allergies", e.target.value)}
              placeholder="For example: Peanut allergy. Leave empty if none."
            />
            <span className="mt-1 block text-xs text-[#777871]">
              Teachers see this at the top of the child's profile.
            </span>
          </label>

          <label className="block">
            <Label>Care notes</Label>
            <textarea
              className={`${inputClass} resize-none`}
              rows={3}
              maxLength={500}
              value={form.careNotes}
              onChange={(e) => setField("careNotes", e.target.value)}
              placeholder="For example: needs his blue blanket for naps"
            />
          </label>
        </div>
      </Card>

      {/* Emergency contact */}
      <Card
        title="Emergency contact"
        hint="Optional. Phones need the country code."
        className="mt-4"
      >
        <PersonFields
          legend="Emergency contact"
          person={emergency}
          onChange={setEmergency}
        />
      </Card>

      {/* Pickup */}
      <Card title="People allowed to pick up" hint="Optional." className="mt-4">
        {pickup.length === 0 && (
          <p className="mb-3 text-sm text-[#555c57]">No one added yet.</p>
        )}
        {pickup.map((person, index) => (
          <PersonFields
            key={index}
            legend={`Pickup person ${index + 1}`}
            person={person}
            onChange={(next) =>
              setPickup((list) => list.map((p, i) => (i === index ? next : p)))
            }
            onRemove={() =>
              setPickup((list) => list.filter((_, i) => i !== index))
            }
          />
        ))}
        <button
          type="button"
          onClick={() => setPickup((list) => [...list, emptyPerson()])}
          className="min-h-11 w-full rounded-full bg-[#e3f2ea] px-4 text-sm font-semibold text-brand transition hover:bg-[#d3ebdf]"
        >
          + Add a person
        </button>
      </Card>

      {/* Save bar */}
      <div className="sticky bottom-0 -mx-4 mt-4 bg-[#fff8f2]/90 px-4 py-3 backdrop-blur lg:-mx-8 lg:px-8">
        {formError && (
          <p
            role="alert"
            className="mb-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          >
            {formError}
          </p>
        )}
        <div className="flex gap-2">
          <Link
            to="/admin/children"
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-[#555c57] shadow-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 flex-2 cursor-pointer rounded-full bg-brand px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add child"}
          </button>
        </div>
      </div>
    </form>
  );
}
