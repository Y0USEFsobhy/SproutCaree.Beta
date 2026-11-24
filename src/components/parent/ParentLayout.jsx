import { Outlet } from "react-router";
import Header from "../Header";
import BottomNavigation from "../shared/BottomNavigation";
import { ParentChildProvider } from "../../context/ParentChildContext";
// bg-[#fff8f2]
export default function ParentLayout() {
  return (
    <div className="flex flex-col h-dvh">
      <Header />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <ParentChildProvider>
          <Outlet />
        </ParentChildProvider>/
      </main>
      <BottomNavigation />
    </div>
  );
}
