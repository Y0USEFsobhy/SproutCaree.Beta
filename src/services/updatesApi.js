// Paste these into src/services/api.js
// (the imports are the same ones you already have)
import { collection, getDocs, query, where } from "firebase/firestore";
import { database } from "./firebase";

// Every note of ONE child that this parent may read.
// Two equality filters + array-contains: no composite index needed.
// Sorting happens in the page (newest first).
//
// childId is compared as a STRING (the id type we agreed on).
// If your notes still store childId as a number, either re-save them as
// strings or change String(childId) to Number(childId) here.
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
