import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { Outlet } from "react-router-dom";
import SubscriptionIdleAlert from "../components/common/SubscriptionIdleAlert";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative h-screen w-full bg-[#070710]">
      <SubscriptionIdleAlert />
      {/* Background layers */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(40,40,100,0.7),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.6),transparent_70%)]"></div>
      </div>

      {/* Content */}
      <div className="relative z-40 flex flex-col h-full">
        {/* Topbar */}
        <Topbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Desktop Sidebar */}
          <div className="relative hidden sm:block w-[90px] ">
            <Sidebar />
          </div>

          {/* Mobile Sidebar (only rendered on small screens) */}
          <div className="sm:hidden">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6 text-white">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
