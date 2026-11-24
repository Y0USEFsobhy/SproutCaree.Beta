// src/context/ParentChildContext.jsx
// Loads the parent's children ONCE and keeps the selected child while the
// parent moves between Home, Updates, Schedule and Profile.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSelector } from "react-redux";
import { getMyChildren } from "../services/api";

const ParentChildContext = createContext(null);

export function ParentChildProvider({ children: content }) {
  const user = useSelector((state) => state.auth.user);

  const [kids, setKids] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    getMyChildren(user.uid, user.nurseryId)
      .then((result) => {
        if (!cancelled) setKids(result);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your children. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.nurseryId]);

  // The first child is selected until the parent picks another one
  const selectedChild = kids.find((c) => c.id === selectedId) ?? kids[0] ?? null;

  // Merge new data into one child after the parent saved changes (no refetch)
  const updateChild = useCallback((id, patch) => {
    setKids((list) => list.map((kid) => (kid.id === id ? { ...kid, ...patch } : kid)));
  }, []);

  const value = useMemo(
    () => ({
      kids,
      selectedChild,
      selectChild: setSelectedId,
      updateChild,
      loading,
      error,
    }),
    [kids, selectedChild, updateChild, loading, error],
  );

  return (
    <ParentChildContext.Provider value={value}>
      {content}
    </ParentChildContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useParentChild() {
  const context = useContext(ParentChildContext);
  if (!context) {
    throw new Error("useParentChild must be used inside <ParentChildProvider>");
  }
  return context;
}
