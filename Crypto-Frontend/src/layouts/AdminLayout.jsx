// import { Outlet, useNavigate } from "react-router-dom";
// import { useEffect } from "react";
// import AdminSidebar from "../components/admin/AdminSidebar";

// function AdminLayout() {
//   const navigate = useNavigate();

//   // You can place any layout-level logic here, like checking auth
//   // useEffect(() => {
//   //   const tokens = JSON.parse(localStorage.getItem('authTokens'));
//   //   if (!tokens?.access) {
//   //     navigate('/admin-login');
//   //   }
//   // }, [navigate]);

//   return (
//     // Main container using the base dark purple background from our theme
//     <div className="flex min-h-screen bg-[#0F051A]">
      
//       {/* The AdminSidebar is assumed to be a 'fixed' component,
//         so it's included here directly.
//       */}
//       <AdminSidebar />

//       {/* Main content area. 
//         We add 'ml-64' to offset it from the fixed 64-width (w-64) sidebar.
//         Padding 'p-6' is applied here so all child pages are padded consistently.
//       */}
//       <main className="flex-1 p-6 overflow-y-auto ">
//         <Outlet />
//       </main>
//     </div>
//   );
// }

// export default AdminLayout;

import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import AdminSidebar from "../components/admin/AdminSidebar";

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0F051A] relative">
      {/* Sidebar - always visible on large screens */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <AdminSidebar closeSidebar={() => setSidebarOpen(false)} />
      </div>

      {/* Overlay (visible only when sidebar is open on mobile) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        ></div>
      )}

      {/* Main content area */}
      <main
        className={`flex-1 p-6 overflow-y-auto transition-all duration-300 ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-64"
        }`}
      >
        {/* Header with hamburger menu for mobile */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-300 focus:outline-none"
          >
            {sidebarOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
          <h1 className="text-lg font-semibold text-gray-100">
            Admin Dashboard
          </h1>
        </div>

        {/* Outlet renders the current page content */}
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;


