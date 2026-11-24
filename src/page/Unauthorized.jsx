import { useDispatch } from "react-redux";
import { Link } from "react-router";
import { logout } from "../features/auth/authSlice";

export default function Unauthorized() {
  const dispatch = useDispatch();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Unauthorized</h1>
      <p className="text-gray-600">You do not have access to this page.</p>
      <Link
        to="/login"
        onClick={() => dispatch(logout())}
        className="text-brand hover:underline"
      >
        Back to login
      </Link>
    </div>
  );
}
