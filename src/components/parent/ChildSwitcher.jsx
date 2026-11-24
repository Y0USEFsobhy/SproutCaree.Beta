// src/components/parent/ChildSwitcher.jsx
import { useParentChild } from "../../context/ParentChildContext";

// Renders nothing when the parent has only one child.
export default function ChildSwitcher() {
  const { kids, selectedChild, selectChild } = useParentChild();

  if (kids.length < 2) return null;

  return (
    <div
      className="mt-4 flex gap-2 overflow-x-auto"
      role="tablist"
      aria-label="Choose a child"
    >
      {kids.map((kid) => {
        const selected = kid.id === selectedChild?.id;
        return (
          <button
            key={kid.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => selectChild(kid.id)}
            className={`min-h-11 flex-none rounded-full px-5 text-sm font-semibold transition ${
              selected
                ? "bg-brand text-white"
                : "bg-white text-[#555c57] hover:bg-[#f0ede7]"
            }`}
          >
            {kid.name.split(" ")[0]}
          </button>
        );
      })}
    </div>
  );
}
