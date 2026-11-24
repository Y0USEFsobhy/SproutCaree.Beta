import { useEffect } from "react";
import { onAuthStateChanged ,signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { auth, database } from "../services/firebase";
import { setUser, logout } from "../features/auth/authSlice";


export default function AuthListener() {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        dispatch(logout());
        return;
      }

      try {
        const userRef = doc(database, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        // Reject authenticated users without a profile.
        if (!userSnap.exists()) {
          await signOut(auth);
          dispatch(logout());
          return;
        }

        const profile = userSnap.data();

        // Reject profiles without a role.
        if (!profile.role) {
          await signOut(auth);
          dispatch(logout());
          return;
        }

        dispatch(
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            ...profile,
          })
        );
      } catch (error) {
        console.error("Failed to restore user data:", error);

        try {
          await signOut(auth);
        } catch (signOutError) {
          console.error("Failed to sign out:", signOutError);
        } finally {
          // Always clear Redux and finish initialization.
          dispatch(logout());
        }
      }
    });

    return unsubscribe;
  }, [dispatch]);

  return null;
}