import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import Loading from "./Loading";

export default function ProtectedRoute({allowedRoles}) {
  const { isAuthenticated, authInitialized, user } = useSelector(
    (state) => state.auth,
  );

  // Wait until Firebase finishes checking the session
  if (!authInitialized) {
    return (
      <div className="inset-0 h-dvh flex gap-2 justify-center items-center flex-col w-full bg-white">
        <Loading />
        Checking session...
      </div>
    );
  }

  // No authenticated user or no valid profile.
  if (!isAuthenticated || !user?.role) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated but doesn't have permission.
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
