import { Outlet } from "react-router";
import Header from "../Header";
import BottomNavigation from "../shared/BottomNavigation";
// bg-[#fff8f2]
export default function TeacherLayout() {
  return (
    <div className="flex flex-col h-dvh">
      <Header />
      <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
      </main>
      <BottomNavigation />
    </div>
  );
}
