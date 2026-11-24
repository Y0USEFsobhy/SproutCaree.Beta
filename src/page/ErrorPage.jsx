import { isRouteErrorResponse, useRouteError, Link } from "react-router";

export default function ErrorPage() {
  const error = useRouteError();

  let title = "Something went wrong";
  let message = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    title = `${error.status} ${error.statusText}`;
    message = error.data?.message || "Unable to load this page.";
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold">{title}</h1>

      <p className="mt-3 text-gray-500">{message}</p>

      <Link
        to="/"
        className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-white"
      >
        Back Home
      </Link>
    </div>
  );
}