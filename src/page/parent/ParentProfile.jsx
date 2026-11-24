// src/page/parent/ParentProfile.jsx
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import ChildSwitcher from "../../components/parent/ChildSwitcher";
import { useParentChild } from "../../context/ParentChildContext";
import {
  getClassById,
  getMyProfile,
  updateChildInfo,
  updateMyPhone,
} from "../../services/api";
import { getInitials } from "../../utils/initials";

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
const cleanPhone = (value) => value.replace(/[\s-]/g, "");
const isValidPhone = (value) => /^\+\d{8,15}$/.test(cleanPhone(value));
const isEmptyPerson = (p) => !p.name.trim() && !p.relation.trim() && !p.phone.trim();
const emptyPerson = () => ({ name: "", relation: "", phone: "" });

const getAge = (birthDate) => {
  if (!birthDate) return "";
  const birth = new Date(birthDate);
  const now = new Date();

  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return "";

  const years = Math.floor(months / 12);
  const rest = months % 12;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (rest || !years) parts.push(`${rest} ${rest === 1 ? "month" : "months"}`);
  return parts.join(" ");
};

const formatBirthDate = (birthDate) =>
  birthDate
    ? new Date(`${birthDate}T00:00:00`).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

const inputClass =
  "w-full rounded-xl border border-[#e8e0d4] bg-white px-3 py-3 text-sm text-[#262723] placeholder:text-[#9a9d97] focus:border-brand focus:outline-none";

// ---------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------
function Card({ title, children, className = "" }) {
  return (
    <section className={`rounded-2xl bg-white p-4 shadow-sm ${className}`}>
      {title && <h2 className="mb-3 text-sm font-semibold text-brand">{title}</h2>}
      {children}
    </section>
  );
}

function Subheading({ children }) {
  return (
    <h3 className="mb-1 text-xs font-semibold tracking-wide text-[#777871] uppercase">
      {children}
    </h3>
  );
}

function PersonLine({ person }) {
  return (
    <li className="py-2 first:pt-0 last:pb-0">
      <p className="font-semibold text-[#262723]">{person.name}</p>
      <p className="text-sm text-[#555c57]">
        {[person.relation, person.phone].filter(Boolean).join(" · ")}
      </p>
    </li>
  );
}

function ErrorBox({ children }) {
  return (
    <p
      role="alert"
      className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
    >
      {children}
    </p>
  );
}

function PersonFields({ legend, person, onChange, onRemove }) {
  const set = (field) => (event) => onChange({ ...person, [field]: event.target.value });

  return (
    <fieldset className="mb-3 rounded-xl border border-[#f0ede7] p-3">
      <legend className="px-1 text-xs font-semibold text-[#777871]">{legend}</legend>
      <div className="space-y-2">
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
          placeholder="Relation (for example Grandmother)"
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
// Health, care notes and contacts: read view + edit form
// ---------------------------------------------------------------
function ChildInfo({ child, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [allergies, setAllergies] = useState("");
  const [careNotes, setCareNotes] = useState("");
  const [emergency, setEmergency] = useState(emptyPerson());
  const [pickup, setPickup] = useState([]);

  const startEditing = () => {
    setAllergies(child.allergies ?? "");
    setCareNotes(child.careNotes ?? "");
    setEmergency(child.emergencyContact ? { ...emptyPerson(), ...child.emergencyContact } : emptyPerson());
    setPickup((child.authorizedPickup ?? []).map((p) => ({ ...emptyPerson(), ...p })));
    setError("");
    setEditing(true);
  };

  const validatePerson = (person, label) => {
    if (!person.name.trim()) return `${label}: please enter a name.`;
    if (!isValidPhone(person.phone)) {
      return `${label}: enter the phone with the country code, like +201000000000.`;
    }
    return "";
  };

  const handleSave = async (event) => {
    event.preventDefault();

    // Emergency contact: all empty means "no emergency contact"
    let emergencyContact = null;
    if (!isEmptyPerson(emergency)) {
      const problem = validatePerson(emergency, "Emergency contact");
      if (problem) return setError(problem);
      emergencyContact = {
        name: emergency.name.trim(),
        relation: emergency.relation.trim(),
        phone: cleanPhone(emergency.phone),
      };
    }

    // Pickup people: ignore completely empty rows
    const filledPickup = pickup.filter((p) => !isEmptyPerson(p));
    for (let i = 0; i < filledPickup.length; i += 1) {
      const problem = validatePerson(filledPickup[i], `Pickup person ${i + 1}`);
      if (problem) return setError(problem);
    }

    const info = {
      allergies: allergies.trim(),
      careNotes: careNotes.trim(),
      emergencyContact,
      authorizedPickup: filledPickup.map((p) => ({
        name: p.name.trim(),
        relation: p.relation.trim(),
        phone: cleanPhone(p.phone),
      })),
    };

    setSaving(true);
    setError("");

    try {
      await updateChildInfo(child.id, info);
      onSaved(child.id, info);
      setEditing(false);
    } catch {
      setError("Couldn't save the changes. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  // ----- Edit form -----
  if (editing) {
    return (
      <form onSubmit={handleSave}>
        <Card title="Allergies / medical alert">
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            maxLength={300}
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="For example: Peanut allergy. Leave empty if none."
            aria-label="Allergies or medical alert"
          />
          <p className="mt-1 text-xs text-[#777871]">
            The teacher sees this at the top of {child.name.split(" ")[0]}'s profile.
          </p>
        </Card>

        <Card title="Care notes" className="mt-3">
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            maxLength={500}
            value={careNotes}
            onChange={(e) => setCareNotes(e.target.value)}
            placeholder="For example: needs his blue blanket for naps"
            aria-label="Care notes"
          />
        </Card>

        <Card title="Emergency contact" className="mt-3">
          <PersonFields legend="Emergency contact" person={emergency} onChange={setEmergency} />
        </Card>

        <Card title="People allowed to pick up" className="mt-3">
          {pickup.length === 0 && (
            <p className="mb-3 text-sm text-[#555c57]">
              No one added yet. Only you and the people listed here may collect your child.
            </p>
          )}
          {pickup.map((person, index) => (
            <PersonFields
              key={index}
              legend={`Pickup person ${index + 1}`}
              person={person}
              onChange={(next) =>
                setPickup((list) => list.map((p, i) => (i === index ? next : p)))
              }
              onRemove={() => setPickup((list) => list.filter((_, i) => i !== index))}
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

        {error && <ErrorBox>{error}</ErrorBox>}

        <div className="sticky bottom-0 -mx-4 mt-3 flex gap-2 bg-[#fff8f2]/90 px-4 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="min-h-11 flex-1 rounded-full bg-white px-4 text-sm font-semibold text-[#555c57] shadow-sm disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 flex-[2] rounded-full bg-brand px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    );
  }

  // ----- Read view -----
  const allergiesText = child.allergies?.trim();

  return (
    <>
      {allergiesText ? (
        <div
          role="note"
          className="rounded-2xl border border-[#f3a000]/50 bg-[#fff0dc] p-4"
        >
          <p className="text-xs font-semibold tracking-wide text-[#cd6700] uppercase">
            ⚠️ Allergies / medical alert
          </p>
          <p className="mt-1 font-semibold text-[#262723]">{allergiesText}</p>
        </div>
      ) : (
        <Card title="Allergies / medical alert">
          <p className="text-sm text-[#555c57]">None on file.</p>
        </Card>
      )}

      <Card title="Care notes" className="mt-3">
        <p className="text-sm leading-snug text-[#262723]">
          {child.careNotes?.trim() || "None on file."}
        </p>
      </Card>

      <Card title="Contacts" className="mt-3">
        <Subheading>Emergency contact</Subheading>
        {child.emergencyContact ? (
          <ul>
            <PersonLine person={child.emergencyContact} />
          </ul>
        ) : (
          <p className="text-sm text-[#555c57]">None on file.</p>
        )}

        <div className="mt-4">
          <Subheading>Allowed to pick up</Subheading>
          {(child.authorizedPickup?.length ?? 0) > 0 ? (
            <ul className="divide-y divide-[#f0ede7]">
              {child.authorizedPickup.map((person, index) => (
                <PersonLine key={`${person.name}-${index}`} person={person} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#555c57]">No one added yet.</p>
          )}
        </div>
      </Card>

      <button
        type="button"
        onClick={startEditing}
        className="mt-3 min-h-11 w-full rounded-full bg-brand px-4 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Edit health and contact information
      </button>
    </>
  );
}

// ---------------------------------------------------------------
// The parent's own account (phone)
// ---------------------------------------------------------------
function MyAccount({ kids, onChildrenPatched }) {
  const user = useSelector((state) => state.auth.user);

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;

    getMyProfile(user.uid)
      .then((result) => {
        if (!cancelled) setProfile(result);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const handleSave = async (event) => {
    event.preventDefault();

    if (!isValidPhone(phone)) {
      setError("Enter your phone with the country code, like +201000000000.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const newPhone = cleanPhone(phone);
      const patches = await updateMyPhone(user.uid, newPhone, profile?.phone ?? "", kids);
      setProfile((p) => ({ ...p, phone: newPhone }));
      onChildrenPatched(patches);
      setEditing(false);
    } catch {
      setError("Couldn't save your phone number. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="My account" className="mt-6">
      <p className="font-semibold text-[#262723]">{profile?.name ?? user?.name}</p>
      {profile?.email && <p className="text-sm text-[#555c57]">{profile.email}</p>}

      {editing ? (
        <form onSubmit={handleSave} className="mt-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-[#777871]">Phone</span>
            <input
              className={inputClass}
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+20 100 000 0000"
            />
          </label>
          {error && <ErrorBox>{error}</ErrorBox>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="min-h-11 flex-1 rounded-full bg-[#f0ede7] px-4 text-sm font-semibold text-[#555c57] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-11 flex-[2] rounded-full bg-brand px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save phone"}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="text-sm text-[#555c57]">
            Phone: <span className="font-semibold text-[#262723]">{profile?.phone || "Not added"}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setPhone(profile?.phone ?? "");
              setError("");
              setEditing(true);
            }}
            className="min-h-11 rounded-xl px-3 text-sm font-semibold text-brand hover:bg-[#e3f2ea]"
          >
            Edit
          </button>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------
// Page
// ---------------------------------------------------------------
export default function ParentProfile() {
  const { kids, selectedChild: child, loading, error, updateChild } = useParentChild();
  const [className, setClassName] = useState("");
  const [toast, setToast] = useState("");

  const classId = child?.classId;
  const nurseryId = child?.nurseryId;

  useEffect(() => {
    setClassName("");
    if (!classId || !nurseryId) return;

    let cancelled = false;

    getClassById(classId, nurseryId)
      .then((result) => {
        if (!cancelled) setClassName(result?.name ?? "");
      })
      .catch(() => {}); // the class name is optional; the class id is still shown

    return () => {
      cancelled = true;
    };
  }, [classId, nurseryId]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  const wrapper = "mx-auto w-full max-w-md px-4 pt-4 pb-6 text-[#262723]";

  if (loading) {
    return (
      <main className={wrapper}>
        <div className="animate-pulse space-y-3" aria-label="Loading">
          <div className="h-8 w-32 rounded-lg bg-[#ece6dd]" />
          <div className="h-28 rounded-2xl bg-[#ece6dd]" />
          <div className="h-28 rounded-2xl bg-[#ece6dd]" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className={wrapper}>
        <p
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
        >
          {error}
        </p>
      </main>
    );
  }

  if (!child) {
    return (
      <main className={wrapper}>
        <h1 className="text-2xl font-bold tracking-tight text-brand">Profile</h1>
        <p className="mt-4 rounded-2xl bg-white p-6 text-center text-sm text-[#555c57] shadow-sm">
          No children are linked to your account yet. Please contact your nursery.
        </p>
        <MyAccount kids={kids} onChildrenPatched={() => {}} />
      </main>
    );
  }

  const age = getAge(child.birthDate);
  const birth = formatBirthDate(child.birthDate);

  const handleSaved = (childId, info) => {
    updateChild(childId, info);
    setToast("Changes saved. The teacher can see them now.");
  };

  const handlePatched = (patches) => {
    Object.entries(patches).forEach(([id, patch]) => updateChild(id, patch));
    setToast("Phone number updated.");
  };

  return (
    <main className={wrapper}>
      <h1 className="text-2xl font-bold tracking-tight text-brand">Profile</h1>
      <p className="mt-1 text-sm text-[#555c57]">
        Keep your child's information up to date.
      </p>

      <ChildSwitcher />

      {toast && (
        <p
          role="status"
          className="mt-3 rounded-xl bg-[#e3f2ea] p-3 text-sm font-medium text-brand"
        >
          ✓ {toast}
        </p>
      )}

      {/* Child details (managed by the nursery, read only) */}
      <section className="mt-4 flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm">
        <span
          className="grid h-16 w-16 flex-none place-items-center rounded-full bg-[#e3f2ea] text-xl font-bold text-brand"
          aria-hidden="true"
        >
          {getInitials(child.name)}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-xl font-bold text-brand">{child.name}</h2>
          {age && <p className="text-sm text-[#555c57]">{age}</p>}
          {birth && <p className="text-xs text-[#777871]">Born {birth}</p>}
          <p className="mt-1.5 text-sm text-[#262723]">
            <span className="font-semibold">Class:</span>{" "}
            {/* {className || `Class ${child.classId}`} */}
            {loading ? "loading":`${className}`}
            <span className="ml-1.5 text-xs text-[#777871]">(ID {child.classId})</span>
          </p>
        </div>
      </section>

      {/* Health, notes, contacts (editable). key resets the form when the child changes */}
      <div className="mt-3">
        <ChildInfo key={child.id} child={child} onSaved={handleSaved} />
      </div>

      {/* Parents on file (managed by the nursery) */}
      {(child.parents?.length ?? 0) > 0 && (
        <Card title="Parents on file" className="mt-3">
          <ul className="divide-y divide-[#f0ede7]">
            {child.parents.map((person, index) => (
              <PersonLine key={`${person.name}-${index}`} person={person} />
            ))}
          </ul>
          <p className="mt-3 text-xs text-[#777871]">
            To change a name or relation, please contact the nursery.
          </p>
        </Card>
      )}

      <MyAccount kids={kids} onChildrenPatched={handlePatched} />
    </main>
  );
}
