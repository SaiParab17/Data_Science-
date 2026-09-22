// DataWatch — App Shell Layout
import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  return (
    <div className="min-h-screen bg-surface">
      <Header variant="app" />
      <Sidebar />
      <main className="ml-[220px] mt-16 min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
    </div>
  );
}
