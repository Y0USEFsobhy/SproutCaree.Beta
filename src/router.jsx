// import { createBrowserRouter, Navigate } from "react-router";

// import Login from "./page/auth/Login";
// import AdminDashboard from "./page/admin/AdminDashboard";
// import Unauthorized from "./page/Unauthorized";
// import ProtectedRoute from "./components/ProtectedRoute";

// import TeacherLayout from "./components/teacher/TeacherLayout";
// import TeacherHome from "./page/teacher/TeacherHome";
// import AttendancePage from "./page/teacher/AttendancePage";
// import NotesPage from "./page/teacher/NotesPage";
// import ChildProfile from "./page/teacher/ChildProfile";
// import ParentLayout from "./components/parent/ParentLayout";

// import UpdatesPage from "./page/parent/UpdatesPage";
// import ParentProfile from "./page/parent/ParentProfile";
// import ParentHome from "./page/parent/ParentHome";
// import ParentSchedule from "./page/parent/ParentSchedule";
// import TeacherSchedule from "./page/teacher/TeacherSchedule";
// import AdminLayout from "./components/admin/AdminLayout";
// import ChildrenPage from "./page/admin/ChildrenPage";
// import ChildForm from "./page/admin/ChildForm";
// import ParentPage from "./page/admin/ParentPage";
// import ParentForm from "./page/admin/ParentForm";
// import TeachersPage from "./page/admin/TeachersPage";
// import TeacherForm from "./page/admin/TeacherForm";
// import ClassesPage from "./page/admin/ClassesPage";
// import SchedulePage from "./page/admin/schedulePage";
// import AnnouncementsPage from "./page/admin/AnnouncementsPage";
// import AdminSettings from "./page/admin/AdminSettings";

// import ChangePassword from "./components/ChangePassword"
// import ProfilePage from "./page/shared/ProfilePage";

// export const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <Navigate to="/login" replace />,
//   },
//   {
//     path: "/login",
//     element: <Login />,
//   },
//   {
//     path: "/unauthorized",
//     element: <Unauthorized />,
//   },
//   {
//     element: <ProtectedRoute allowedRoles={["parent","teacher"]} />,
//     children: [
//       {
//         path: "/password",
//         element: <ChangePassword />,
//       },
//       {
//         path: "/profile",
//         element: <ProfilePage />,
//       },
//     ],
//   },
//   {
//     path: "/admin",
//     element: <ProtectedRoute allowedRoles={["admin"]} />,
//     children: [
//       {
//         element: <AdminLayout />,
//         children: [ 
//           {
//             index: true,
//             element: <AdminDashboard />,
//           },
//           {
//             path: "children",
//             element: <ChildrenPage />,
//           },
//           {
//             path: "children/new",
//             element: <ChildForm />,
//           },
//           {
//             path: "children/:childId",
//             element: <ChildForm />,
//           },
//           {
//             path: "teacher",
//             element: <TeachersPage />,
//           },
//           {
//             path: "teacher/new",
//             element: <TeacherForm />,
//           },
//           {
//             path: "teacher/:teacherId",
//             element: <TeacherForm />,
//           },
//           {
//             path: "parent",
//             element: <ParentPage />,
//           },
//           {
//             path: "parent/new",
//             element: <ParentForm />,
//           },
//           {
//             path: "parent/:uid",
//             element: <ParentForm />,
//           },
//           {
//             path: "classes",
//             element: <ClassesPage />,
//           },
//           {
//             path: "schedule",
//             element: <SchedulePage />,
//           },
//           {
//             path: "announcements",
//             element: <AnnouncementsPage />,
//           },
//           {
//             path: "settings",
//             element: <AdminSettings />,
//           },
//         ],
//       },
//     ],
//   },
//   {
//     path: "/teacher",
//     element: <ProtectedRoute allowedRoles={["teacher"]} />,
//     children: [
//       {
//         element: <TeacherLayout />,
//         children: [
//           {
//             index: true,
//             element: <TeacherHome />,
//           },
//           {
//             path: "attendance",
//             element: <AttendancePage />,
//           },
//           {
//             path: "schedule",
//             element: <TeacherSchedule />,
//           },
//           {
//             path: "notes",
//             element: <NotesPage />,
//           },
//           {
//             path: "children/:childId",
//             element: <ChildProfile />,
//           },
//         ],
//       },
//     ],
//   },
//   {
//     path: "/parent",
//     element: <ProtectedRoute allowedRoles={["parent"]} />,
//     children: [
//       {
//         element: <ParentLayout />,
//         children: [
//           {
//             index: true,
//             element: <ParentHome />,
//           },
//           {
//             path: "updates",
//             element: <UpdatesPage />,
//           },
//           {
//             path: "profile",
//             element: <ParentProfile />,
//           },
//           {
//             path: "schedule",
//             element: <ParentSchedule />,
//             // element: <SchedulePage />,
//             // element: <SchedulePage2 />,
//           },
//         ],
//       },
//     ],
//   },
// ]);

import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router";

import ProtectedRoute from "./components/ProtectedRoute";
import ErrorPage from "./page/ErrorPage";
import PageLoader from "./page/PageLoader";

// Lazy loading helper
const loadPage = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// Auth
const Login = lazy(() => import("./page/auth/Login"));
const Unauthorized = lazy(() => import("./page/Unauthorized"));
const ChangePassword = lazy(() => import("./components/ChangePassword"));
const ProfilePage = lazy(() => import("./page/shared/ProfilePage"));

// Admin
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("./page/admin/AdminDashboard"));
const ChildrenPage = lazy(() => import("./page/admin/ChildrenPage"));
const ChildForm = lazy(() => import("./page/admin/ChildForm"));
const ParentPage = lazy(() => import("./page/admin/ParentPage"));
const ParentForm = lazy(() => import("./page/admin/ParentForm"));
const TeachersPage = lazy(() => import("./page/admin/TeachersPage"));
const TeacherForm = lazy(() => import("./page/admin/TeacherForm"));
const ClassesPage = lazy(() => import("./page/admin/ClassesPage"));
const SchedulePage = lazy(() => import("./page/admin/schedulePage"));
const AnnouncementsPage = lazy(() => import("./page/admin/AnnouncementsPage"));
const AdminSettings = lazy(() => import("./page/admin/AdminSettings"));

// Teacher
const TeacherLayout = lazy(() => import("./components/teacher/TeacherLayout"));
const TeacherHome = lazy(() => import("./page/teacher/TeacherHome"));
const AttendancePage = lazy(() => import("./page/teacher/AttendancePage"));
const NotesPage = lazy(() => import("./page/teacher/NotesPage"));
const ChildProfile = lazy(() => import("./page/teacher/ChildProfile"));
const TeacherSchedule = lazy(() => import("./page/teacher/TeacherSchedule"));

// Parent
const ParentLayout = lazy(() => import("./components/parent/ParentLayout"));
const UpdatesPage = lazy(() => import("./page/parent/UpdatesPage"));
const ParentProfile = lazy(() => import("./page/parent/ParentProfile"));
const ParentHome = lazy(() => import("./page/parent/ParentHome"));
const ParentSchedule = lazy(() => import("./page/parent/ParentSchedule"));

// 404
const NotFound = lazy(() => import("./page/NotFound"));

export const router = createBrowserRouter([
  {
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/",
        element: <Navigate to="/login" replace />,
      },
      {
        path: "/login",
        element: loadPage(Login),
      },
      {
        path: "/unauthorized",
        element: loadPage(Unauthorized),
      },

      {
        element: <ProtectedRoute allowedRoles={["parent", "teacher"]} />,
        children: [
          {
            path: "/password",
            element: loadPage(ChangePassword),
          },
          {
            path: "/profile",
            element: loadPage(ProfilePage),
          },
        ],
      },

      // Admin routes
      {
        path: "/admin",
        element: <ProtectedRoute allowedRoles={["admin"]} />,
        children: [
          {
            element: loadPage(AdminLayout),
            children: [
              {
                index: true,
                element: loadPage(AdminDashboard),
              },
              {
                path: "children",
                element: loadPage(ChildrenPage),
              },
              {
                path: "children/new",
                element: loadPage(ChildForm),
              },
              {
                path: "children/:childId",
                element: loadPage(ChildForm),
              },
              {
                path: "teacher",
                element: loadPage(TeachersPage),
              },
              {
                path: "teacher/new",
                element: loadPage(TeacherForm),
              },
              {
                path: "teacher/:teacherId",
                element: loadPage(TeacherForm),
              },
              {
                path: "parent",
                element: loadPage(ParentPage),
              },
              {
                path: "parent/new",
                element: loadPage(ParentForm),
              },
              {
                path: "parent/:uid",
                element: loadPage(ParentForm),
              },
              {
                path: "classes",
                element: loadPage(ClassesPage),
              },
              {
                path: "schedule",
                element: loadPage(SchedulePage),
              },
              {
                path: "announcements",
                element: loadPage(AnnouncementsPage),
              },
              {
                path: "settings",
                element: loadPage(AdminSettings),
              },
            ],
          },
        ],
      },

      // Teacher routes
      {
        path: "/teacher",
        element: <ProtectedRoute allowedRoles={["teacher"]} />,
        children: [
          {
            element: loadPage(TeacherLayout),
            children: [
              {
                index: true,
                element: loadPage(TeacherHome),
              },
              {
                path: "attendance",
                element: loadPage(AttendancePage),
              },
              {
                path: "schedule",
                element: loadPage(TeacherSchedule),
              },
              {
                path: "notes",
                element: loadPage(NotesPage),
              },
              {
                path: "children/:childId",
                element: loadPage(ChildProfile),
              },
            ],
          },
        ],
      },

      // Parent routes
      {
        path: "/parent",
        element: <ProtectedRoute allowedRoles={["parent"]} />,
        children: [
          {
            element: loadPage(ParentLayout),
            children: [
              {
                index: true,
                element: loadPage(ParentHome),
              },
              {
                path: "updates",
                element: loadPage(UpdatesPage),
              },
              {
                path: "profile",
                element: loadPage(ParentProfile),
              },
              {
                path: "schedule",
                element: loadPage(ParentSchedule),
              },
            ],
          },
        ],
      },
      {
        path: "*",
        element: loadPage(NotFound),
      },
    ],
  },
]);

