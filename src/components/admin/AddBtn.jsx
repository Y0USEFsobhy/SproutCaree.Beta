import { Link } from "react-router";

function AddBtn({to,label,onClick}) {
    if(onClick) return (
      <button onClick={onClick} className="cursor-pointer w-fit flex gap-2 min-h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:opacity-90">
            <img src="/plus.svg" width={20} alt="plus" />
            Add {label}
      </button>
    )
  return (
    <Link
    to={to}
    className="cursor-pointer w-fit flex gap-2 min-h-11 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:opacity-90"
  >
    <img src="/plus.svg" width={20} alt="plus" />
    Add {label}
  </Link>
  );
}

export default AddBtn;