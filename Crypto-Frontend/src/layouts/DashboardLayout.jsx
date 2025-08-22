import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <div className="relative h-screen w-full bg-[linear-gradient(to_top_right,_black_0%,_black_50%,_gray-900_70%,_#1b1b3a_100%)]">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(40,40,100,0.7),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.6),transparent_70%)]"></div>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <Topbar />

        <div className="flex flex-1 overflow-hidden">
          <div className="relative w-[90px] backdrop-blur-md before:content-[''] before:absolute before:top-0 before:right-0 before:w-[1px] before:h-full before:bg-gradient-to-b before:from-transparent before:via-white/30 before:to-transparent">
            <Sidebar />
          </div>

          <div className="flex-1 overflow-y-auto p-6 text-white">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
