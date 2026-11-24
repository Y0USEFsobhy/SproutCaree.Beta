// services/api.js
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut,
  signInWithEmailAndPassword,
  deleteUser,
  updatePassword,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  collection,
  getCountFromServer,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  arrayRemove,
  arrayUnion,
  serverTimestamp,
  deleteDoc,
  addDoc,
} from "firebase/firestore";
import { database, auth, firebaseConfig } from "./firebase";
import { deleteApp, initializeApp } from "firebase/app";
import { EmailAuthProvider } from "firebase/auth";

const delay = (data) => new Promise((res) => setTimeout(() => res(data), 300));

export const login = async (email, password) => {
  const { user } = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password,
  );

  const profile = await getDoc(doc(database, "users", user.uid));

  if (!profile.exists()) {
    throw new Error("User profile not found");
  }

  return {
    uid: user.uid,
    ...profile.data(),
  };
};

// ________________________________________
// ________________________________________

export const getClassById = async (classId, nurseryId) => {
  const classDoc = await getDoc(doc(database, "classes", String(classId)));

  if (!classDoc.exists()) return null;

  const classRoom = {
    id: classDoc.id,
    ...classDoc.data(),
  };

  return classRoom.nurseryId === String(nurseryId) ? classRoom : null;
};

export const getChildren = async (nurseryId) => {
  const childrenQuery = query(
    collection(database, "children"),
    where("nurseryId", "==", String(nurseryId)),
  );

  const snapshot = await getDocs(childrenQuery);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const getChildrenForClass = async (classId, nurseryId) => {
  const childrenQuery = query(
    collection(database, "children"),
    where("classId", "==", String(classId)),
    where("nurseryId", "==", String(nurseryId)),
    where("active", "==", true),
  );

  const snapshot = await getDocs(childrenQuery);

  return snapshot.docs.map((childDoc) => ({
    id: childDoc.id,
    ...childDoc.data(),
  }));
};

export const getAttendanceForDate = async (nurseryId, date) => {
  const attendanceQuery = query(
    collection(database, "attendance"),
    where("nurseryId", "==", String(nurseryId)),
    where("date", "==", date),
  );

  const snapshot = await getDocs(attendanceQuery);

  const latestByChild = new Map();

  snapshot.docs.forEach((attendanceDoc) => {
    const record = {
      id: attendanceDoc.id,
      ...attendanceDoc.data(),
    };

    // If there are duplicate records for a child, the later document
    // in the query result replaces the earlier one.
    latestByChild.set(String(record.childId), record);
  });

  return [...latestByChild.values()];
};

export const saveAttendance = async (records) => {
  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  const batch = writeBatch(database);

  const savedRecords = records.map((record) => {
    const id = `${record.nurseryId}-${record.childId}-${record.date}`;

    const attendanceRef = doc(database, "attendance", id);

    const data = {
      ...record,
      id,
      nurseryId: String(record.nurseryId),
      childId: String(record.childId),
    };

    batch.set(attendanceRef, data);

    return data;
  });

  await batch.commit();

  return savedRecords;
};

export const getSchedule = async (classId, nurseryId, selectedDay) => {
  const scheduleQuery = query(
    collection(database, "schedule"),
    where("classId", "==", String(classId)),
    where("nurseryId", "==", String(nurseryId)),
    where("day", "==", selectedDay),
  );
  const snapshot = await getDocs(scheduleQuery);

  return snapshot.docs
    .map((scheduleDoc) => ({
      id: scheduleDoc.id,
      ...scheduleDoc.data(),
    }))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
};

// Paste these into src/services/api.js
// (they use the `delay` helper that already exists in that file)

// All notes of one nursery for one day (date = "YYYY-MM-DD").
// Firestore compares types strictly — keep IDs as strings (same as attendance).
export const getNotesForDate = async (nurseryId, date) => {
  const notesQuery = query(
    collection(database, "notes"),
    where("nurseryId", "==", String(nurseryId)),
    where("date", "==", date),
  );

  const snapshot = await getDocs(notesQuery);
  return snapshot.docs.map((d) => d.data());
};

// One note per child per day: the document id is "<childId>_<date>",
// so saving again replaces the same document instead of adding a duplicate.
export const saveNote = async (note) => {
  const id = `${note.childId}_${note.date}`;

  const saved = {
    ...note,
    id,
    nurseryId: String(note.nurseryId),
    childId: String(note.childId),
    teacherId: String(note.teacherId),
    parentUids: note.parentUids ?? [],
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(database, "notes", id), saved);
  return saved;
};

// _____________________________________
// child profile

export const getChildById = async (childId, nurseryId) => {
  const childDoc = await getDoc(doc(database, "children", String(childId)));

  if (!childDoc.exists()) return null;

  const child = {
    id: childDoc.id,
    ...childDoc.data(),
  };

  // Document id is the source of truth (data.id can differ in type).
  child.id = childDoc.id;

  return String(child.nurseryId) === String(nurseryId) ? child : null;
};

// Today's note for one child, or null.
// This is a query (not getDoc) on purpose: reading a document that does not
// exist is rejected by rules that look at resource.data, but an empty query
// result is fine.
export const getNoteForChild = async (childId, nurseryId, date) => {
  const noteQuery = query(
    collection(database, "notes"),
    where("nurseryId", "==", String(nurseryId)),
    where("childId", "==", String(childId)),
    where("date", "==", date),
  );

  const snapshot = await getDocs(noteQuery);
  return snapshot.empty ? null : snapshot.docs[0].data();
};

// All notes of one child, newest first.
// Sorted in JavaScript so no composite index is needed.
export const getNotesForChild = async (childId, nurseryId) => {
  const notesQuery = query(
    collection(database, "notes"),
    where("nurseryId", "==", String(nurseryId)),
    where("childId", "==", String(childId)),
  );

  const snapshot = await getDocs(notesQuery);
  return snapshot.docs
    .map((d) => d.data())
    .sort((a, b) => b.date.localeCompare(a.date));
};
// ________________________________________________________
//parent

export const getNotesForChildAsParent = async (uid, childId) => {
  const notesQuery = query(
    collection(database, "notes"),
    where("parentUids", "array-contains", uid),
    where("childId", "==", String(childId)),
  );

  const snapshot = await getDocs(notesQuery);
  return snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
};

// Every attendance record of ONE child that this parent may read.
export const getAttendanceForChildAsParent = async (uid, childId) => {
  const attendanceQuery = query(
    collection(database, "attendance"),
    where("parentUids", "array-contains", uid),
    where("childId", "==", String(childId)),
  );

  const snapshot = await getDocs(attendanceQuery);
  return snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
};

export const getMyChildren = async (uid, nurseryId) => {
  const childrenQuery = query(
    collection(database, "children"),
    where("parentUids", "array-contains", uid),
    where("nurseryId", "==", String(nurseryId)),
    where("active", "==", true),
  );

  const snapshot = await getDocs(childrenQuery);

  return snapshot.docs
    .map((d) => ({ ...d.data(), id: d.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Today's attendance for ALL of the parent's children (usually 1 to 3 documents).
// Filtering by childId happens in the page, so this works whether childId
// is stored as a string or a number.
export const getAttendanceForParent = async (uid, date) => {
  const attendanceQuery = query(
    collection(database, "attendance"),
    where("parentUids", "array-contains", uid),
    where("date", "==", date),
  );

  const snapshot = await getDocs(attendanceQuery);
  return snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
};

// Today's notes for ALL of the parent's children.
export const getNotesForParent = async (uid, date) => {
  const notesQuery = query(
    collection(database, "notes"),
    where("parentUids", "array-contains", uid),
    where("date", "==", date),
  );

  const snapshot = await getDocs(notesQuery);
  return snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
};

// __________________________________________________
// profile for parent

export const getMyProfile = async (uid) => {
  const snapshot = await getDoc(doc(database, "users", uid));
  return snapshot.exists() ? snapshot.data() : null;
};

// Save the four fields a parent may edit on a child.
// Only these keys are written, so the rules (hasOnly) accept the update.
export const updateChildInfo = async (childId, info) => {
  await updateDoc(doc(database, "children", String(childId)), {
    allergies: info.allergies,
    careNotes: info.careNotes,
    emergencyContact: info.emergencyContact,
    authorizedPickup: info.authorizedPickup,
  });
};

// Change the parent's phone in two places, in ONE atomic batch:
//   1. users/{uid}.phone
//   2. the matching entry of the `parents` array on each of their children,
//      so the teacher always sees the current number.
// An entry matches by uid, or (for older data without uid) by the old phone.
// Returns { [childId]: { parents } } so the page can update its state.
export const updateMyPhone = async (uid, newPhone, oldPhone, kids) => {
  const batch = writeBatch(database);
  const patches = {};

  batch.update(doc(database, "users", uid), { phone: newPhone });

  kids.forEach((kid) => {
    const parents = kid.parents ?? [];

    const index = parents.findIndex(
      (p) => p.uid === uid || (!p.uid && oldPhone && p.phone === oldPhone),
    );
    if (index === -1) return;

    const nextParents = parents.map((p, i) =>
      i === index ? { ...p, phone: newPhone, uid } : p,
    );

    batch.update(doc(database, "children", String(kid.id)), {
      parents: nextParents,
    });
    patches[kid.id] = { parents: nextParents };
  });

  await batch.commit();
  return patches;
};

export const getNursery = async (nurseryId) => {
  const nurseryRef = doc(database, "nurseries", String(nurseryId));

  const snapshot = await getDoc(nurseryRef);

  if (!snapshot.exists()) return null;

  return {
    ...snapshot.data(),
    id: snapshot.id,
  };
};

// for admin section (down)

// Every active child of the nursery.
// Every query filters by nurseryId, so the security rules accept it.
export const getChildrenForNursery = async (nurseryId) => {
  const childrenQuery = query(
    collection(database, "children"),
    where("nurseryId", "==", String(nurseryId)),
    where("active", "==", true),
  );

  const snapshot = await getDocs(childrenQuery);

  return snapshot.docs
    .map((d) => ({ ...d.data(), id: d.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Every class of the nursery.
export const getClassesForNursery = async (nurseryId) => {
  const classesQuery = query(
    collection(database, "classes"),
    where("nurseryId", "==", String(nurseryId)),
  );

  const snapshot = await getDocs(classesQuery);

  return snapshot.docs
    .map((d) => ({ ...d.data(), id: d.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// How many users of one role the nursery has ("teacher" or "parent").
// A count query reads no documents, so it is very cheap.
export const getUserCount = async (nurseryId, role) => {
  const countQuery = query(
    collection(database, "users"),
    where("nurseryId", "==", String(nurseryId)),
    where("role", "==", role),
  );

  const snapshot = await getCountFromServer(countQuery);
  return snapshot.data().count;
};

export const getAllChildrenForNursery = async (nurseryId) => {
  const childrenQuery = query(
    collection(database, "children"),
    where("nurseryId", "==", String(nurseryId)),
  );

  const snapshot = await getDocs(childrenQuery);

  return snapshot.docs
    .map((d) => ({ ...d.data(), id: d.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// One child by its document id (used by the edit form).
export const getChildForAdmin = async (childId) => {
  const snapshot = await getDoc(doc(database, "children", String(childId)));
  return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } : null;
};

// The parent accounts of the nursery, for the "link parents" list.
// The user document id IS the parent's Firebase uid.
export const getParentsForNursery = async (nurseryId) => {
  const parentsQuery = query(
    collection(database, "users"),
    where("nurseryId", "==", String(nurseryId)),
    where("role", "==", "parent"),
  );

  const snapshot = await getDocs(parentsQuery);

  return snapshot.docs
    .map((d) => ({ ...d.data(), uid: d.id }))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
};

// Parents must see the old notes and attendance of their child too, so when
// the list of parents changes, copy the new parentUids onto those documents.
const syncParentUids = async (childId, nurseryId, parentUids) => {
  for (const name of ["attendance", "notes"]) {
    const snapshot = await getDocs(
      query(
        collection(database, name),
        where("nurseryId", "==", nurseryId),
        where("childId", "==", childId),
      ),
    );

    let batch = writeBatch(database);
    let inBatch = 0;

    for (const docSnap of snapshot.docs) {
      batch.update(docSnap.ref, { parentUids });
      inBatch += 1;

      // a batch holds at most 500 writes
      if (inBatch === 450) {
        await batch.commit();
        batch = writeBatch(database);
        inBatch = 0;
      }
    }

    if (inBatch > 0) await batch.commit();
  }
};

const sameItems = (a, b) =>
  a.length === b.length && [...a].sort().join("|") === [...b].sort().join("|");

// Create (no id) or update (with id) a child. Returns the child's id.
// `parents` is [{ uid, name, relation, phone }]; parentUids is derived from it.
export const saveChild = async (child, previousParentUids = []) => {
  const nurseryId = String(child.nurseryId);
  const ref = child.id
    ? doc(database, "children", String(child.id))
    : doc(collection(database, "children")); // new auto id

  const parentUids = child.parents.map((p) => p.uid);

  const data = {
    id: ref.id,
    nurseryId,
    name: child.name,
    birthDate: child.birthDate,
    gender: child.gender,
    classId: String(child.classId),
    parents: child.parents,
    parentUids,
    allergies: child.allergies,
    careNotes: child.careNotes,
    emergencyContact: child.emergencyContact,
    authorizedPickup: child.authorizedPickup,
    active: child.active,
  };

  // merge: true keeps fields this form does not touch (photo, old fields)
  await setDoc(ref, data, { merge: true });

  if (child.id && !sameItems(previousParentUids, parentUids)) {
    await syncParentUids(ref.id, nurseryId, parentUids);
  }

  return ref.id;
};

// Deactivate or activate (children are never deleted, so history stays).
export const setChildActive = async (childId, active) => {
  await updateDoc(doc(database, "children", String(childId)), { active });
};

// Link / unlink children by editing parentUids on each child doc
function applyChildLinks(
  batch,
  parentUid,
  nurseryId,
  childIds,
  previousIds = [],
) {
  const toAdd = childIds.filter((id) => !previousIds.includes(id));
  const toRemove = previousIds.filter((id) => !childIds.includes(id));

  // ⚠️ change "children" to your real children collection path
  toAdd.forEach((id) =>
    batch.update(doc(database, "children", id), {
      parentUids: arrayUnion(parentUid),
    }),
  );
  toRemove.forEach((id) =>
    batch.update(doc(database, "children", id), {
      parentUids: arrayRemove(parentUid),
    }),
  );
}

export async function createParent({
  name,
  email,
  phone,
  password,
  nurseryId,
  childIds = [],
}) {
  // Creating a user with the main auth would sign the admin out and sign in
  // the new parent. A temporary second app avoids that.
  const secondaryApp = initializeApp(
    auth.app.options,
    `secondary-${Date.now()}`,
  );
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      password,
    );
    const uid = cred.user.uid;
    await signOut(secondaryAuth);

    const batch = writeBatch(database);
    batch.set(doc(database, "users", uid), {
      uid,
      role: "parent",
      nurseryId,
      name,
      email,
      phone,
      createdAt: serverTimestamp(),
    });
    applyChildLinks(batch, uid, String(nurseryId), childIds, []);
    await batch.commit();

    return uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}

export async function updateParent(
  uid,
  data,
  { nurseryId, childIds, previousChildIds },
) {
  const batch = writeBatch(database);
  batch.update(doc(database, "users", uid), data); // name + phone only
  applyChildLinks(batch, uid, nurseryId, childIds, previousChildIds);
  await batch.commit();
}

export async function deleteParent(uid, linkedChildren = []) {
  const batch = writeBatch(database);

  // 1) Unlink the parent from every child  ⚠️ change "children" if needed
  linkedChildren.forEach((child) => {
    batch.update(doc(database, "children", child.id), {
      parentUids: arrayRemove(uid),
      // keep the denormalized parents list in sync, if your children have one
      ...(child.parents
        ? { parents: child.parents.filter((p) => p.uid !== uid) }
        : {}),
    });
  });

  batch.delete(doc(database, "users", uid));

  await batch.commit();
}


// __________________________________________________________
// teacher page in the admin AdminDashboard
// __________________________________________________________
export const getAllTeachersForNursery = async (nurseryId) => {
  const teachersQuery = query(
    collection(database, "users"),
    where("nurseryId", "==", String(nurseryId)),
    where("role", "==", "teacher")
  );

  const snapshot = await getDocs(teachersQuery);

  return snapshot.docs
    .map((d) => ({ ...d.data(), id: d.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Fields the form is allowed to write. Keeps role/nurseryId/email safe on edit.
const pickTeacherFields = ({ name, phone, classId }) => ({
  name: name.trim(),
  phone: (phone || "").trim(),
  classId: classId || "",
});

// One teacher (also checks they belong to this nursery and are a teacher)
export const getTeacher = async (nurseryId, uid) => {
  const snap = await getDoc(doc(database, "users", uid));

  if (!snap.exists()) throw new Error("Teacher not found");

  const data = snap.data();
  if (data.role !== "teacher" || data.nurseryId !== String(nurseryId)) {
    throw new Error("Teacher not found");
  }

  return { ...data, id: snap.id };
};

// Classes of the nursery, for the "Assigned class" dropdown
export const getClasses = async (nurseryId) => {
  const classesQuery = query(
    collection(database, "classes"),
    where("nurseryId", "==", String(nurseryId))
  );

  const snapshot = await getDocs(classesQuery);

  return snapshot.docs
    .map((d) => ({ ...d.data(), id: d.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Add a new teacher
export const addTeacher = async (nurseryId, form) => {
  // Temporary second app, so the admin stays signed in
  const tempApp = initializeApp(firebaseConfig, `teacher-create-${Date.now()}`);
  const tempAuth = getAuth(tempApp);

  try {
    const cred = await createUserWithEmailAndPassword(
      tempAuth,
      form.email.trim().toLowerCase(),
      form.password
    );

    try {
      // Document id = auth uid, so getTeacher/updateTeacher/deleteTeacher keep working
      await setDoc(doc(database, "users", cred.user.uid), {
        ...pickTeacherFields(form),
        email: form.email.trim().toLowerCase(),
        role: "teacher",
        nurseryId: String(nurseryId),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      // Don't leave a login without a profile behind
      await deleteUser(cred.user).catch(() => {});
      throw err;
    }

    return cred.user.uid;
  } finally {
    await signOut(tempAuth).catch(() => {});
    await deleteApp(tempApp);
  }
};

// Edit an existing teacher (email, role and nurseryId are not changed)
export const updateTeacher = async (nurseryId, uid, form) => {
  await updateDoc(doc(database, "users", uid), {
    ...pickTeacherFields(form),
    updatedAt: serverTimestamp(),
  });
};

// Delete a teacher
export const deleteTeacher = async (nurseryId, uid) => {
  await deleteDoc(doc(database, "users", uid));
};


// classes page in the  adimn
export async function addClass(data) {
  return addDoc(collection(database, "classes"), { ...data, createdAt: serverTimestamp() });
}

export async function updateClass(id, data) {
  return updateDoc(doc(database, "classes", id), data);
}

export async function deleteClass(id) {
  return deleteDoc(doc(database, "classes", id));
}

// You likely already have these two; the page expects each item to have
// `classId` (and `name` for teachers).
// getChildren(nurseryId) -> [{ id, classId, ... }]
// getTeachers(nurseryId) -> [{ id, name, classId, ... }]


// ___________________________________________________________
// schedule page in the admin 
// ___________________________________________________________


// Schedule item shape:
// { classId, day, start: "HH:mm", end: "HH:mm", title, teacherUid, note }
// Top-level `schedule` collection. Document shape (matches the existing docs):
// { id, nurseryId, classId, day: "sunday", activity, description, type, startTime: "HH:mm", endTime: "HH:mm" }
// Top-level `schedule` collection. Document shape (matches the existing docs):
// { id, nurseryId, classId, day: "sunday", activity, description, type, startTime: "HH:mm", endTime: "HH:mm" }
const col = collection(database, "schedule");

export async function getScheduleByClass(nurseryId, classId) {
  const snap = await getDocs(
    query(col, where("nurseryId", "==", String(nurseryId)), where("classId", "==", String(classId)))
  );
  return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

const REQUIRED = ["nurseryId", "classId", "day", "activity", "startTime", "endTime"];

function assertValid(data) {
  if (!data || typeof data !== "object" || REQUIRED.some((k) => !data[k])) {
    throw new Error("Invalid schedule item: expected an object with " + REQUIRED.join(", "));
  }
}

export async function addScheduleItem(data) {
  assertValid(data);
  const ref = doc(col); // auto id, stored in the `id` field too like the old docs
  const item = { ...data, id: ref.id };
  await setDoc(ref, item);
  return item;
}

export async function updateScheduleItem(id, data) {
  assertValid(data);
  const { id: _omit, ...rest } = data;
  await updateDoc(doc(database, "schedule", id), rest);
}

export async function deleteScheduleItem(id) {
  await deleteDoc(doc(database, "schedule", id));
}



// ___________________________________________________________
// AnnouncementsPage page in the admin 
// ___________________________________________________________

// Top-level `announcements` collection (same pattern as `schedule`).
// Doc shape: { nurseryId, title, body, audience: "all"|"parents"|"teachers",
//              pinned, authorUid, createdAt (ms) }

export async function getAnnouncements(nurseryId) {
  const q = query(collection(database, "announcements"), where("nurseryId", "==", String(nurseryId)));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addAnnouncement(data) {
  const payload = { ...data, createdAt: Date.now() };
  const ref = await addDoc(collection(database, "announcements"), payload);
  return { id: ref.id, ...payload };
}

export async function updateAnnouncement(id, data) {
  await updateDoc(doc(database, "announcements", id), data);
}

export async function deleteAnnouncement(id) {
  await deleteDoc(doc(database, "announcements", id));
}
// __________________________________________________
// settings (admin)

// Save the nursery profile / working hours. Only the keys passed in are written.
export const updateNurserySettings = async (nurseryId, data) => {
  await updateDoc(doc(database, "nurseries", String(nurseryId)), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Admin edits their own name / phone (the rules already allow own-profile edits, role excluded).
export const updateMyAccount = async (uid, { name, phone }) => {
  await updateDoc(doc(database, "users", uid), { name, phone });
};

// Firebase needs a recent sign-in to change the password, so re-check the current one first.
export const changeMyPassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("You are not signed in.");
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};