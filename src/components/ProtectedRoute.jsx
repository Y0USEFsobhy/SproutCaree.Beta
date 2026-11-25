import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import Loading from "./Loading";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";

const demoEmails = [
  "demo-admin@sproutcaree.com",
  "demo-teacher@sproutcaree.com",
  "demo-parent@sproutcaree.com",
];

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
  // return (
//     demoEmails.includes(user?.email) ? (
//   <div className="flex flex-wrap items-center gap-3 bg-[#E3F2EA] px-4 py-2 text-xs text-[#1F7A4D]">
//     <span className="font-semibold">Demo mode</span>
//     <button
//       type="button"
//       onClick={async () => { await signOut(auth); }}
//       className="rounded-full px-3 py-1 font-semibold hover:bg-[#D3EBDF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F7A4D]"
//     >
//       Switch role
//     </button>
//     <Outlet/>
//   </div>
// ) : <Outlet/>
//   );
}
