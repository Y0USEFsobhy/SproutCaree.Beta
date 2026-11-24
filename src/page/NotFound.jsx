import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <h1 className="text-8xl font-bold text-gray-800">404</h1>

      <p className="mt-4 text-xl text-gray-600">
        Oops! Page not found.
      </p>

      <Link
        to="/"
        className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-white"
      >
        Go Home
      </Link>
    </div>
  );
}