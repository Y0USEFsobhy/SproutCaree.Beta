import { Link } from "react-router";

function BackBtn({to,label,className}) {
  return (
        <Link
        //   to="/admin/children"
          to={to}
          className={`${className} mb-4 inline-flex min-h-11 items-center rounded-xl px-2 text-sm font-semibold text-brand hover:bg-[#e3f2ea]`}
          >
          <img
            className="-rotate-90"
            width={20}
            src="/arrow.svg"
            alt="back"
            />
          {label}
        </Link>
      );
}

export default BackBtn;