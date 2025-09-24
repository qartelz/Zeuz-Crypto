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
      <main className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-[#0F0F1E] to-[#1A1446]">
        <div className="bg-white/5 backdrop-blur-lg rounded-xl shadow-lg p-6 min-h-screen text-gray-100">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default B2bAdminLayout;
