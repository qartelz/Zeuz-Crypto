// src/layouts/B2bLayout.js
import { Outlet } from "react-router-dom";
import B2bAdminSidebar from "../components/b2badmin/B2bAdminSidebar";

function B2bAdminLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64">
        <B2bAdminSidebar />
      </div>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto bg-black">
        <div className="p-6 min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default B2bAdminLayout;
