
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  UserCog,
  LogOut,
  Hexagon,
  ChevronRight,
  Crown
} from "lucide-react";
import { useContext, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";

function B2bAdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutUser } = useContext(AuthContext);
  const [hovered, setHovered] = useState(null);

  const links = [
    { to: "/b2b/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/b2b/batches", label: "Batches", icon: UserCog },
    { to: "/b2b/subscriptions", label: "Subscriptions", icon: Crown },
    { to: "/b2b/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    logoutUser();
    navigate("/b2badmin-login");
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-black border-r border-zinc-800 flex flex-col z-50 transition-all duration-300">
      <div className="h-20 flex items-center px-6 border-b border-zinc-800 relative overflow-hidden group">
        <div className="absolute inset-0 bg-zinc-900/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-zinc-700 transition-colors duration-300">
            <Hexagon className="text-white fill-white/10" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight tracking-wide">
              ZEUZ <span className="text-zinc-500">B2B</span>
            </h2>
            <p className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
        <div className="text-xs font-semibold text-zinc-600 uppercase tracking-widest px-4 mb-4">
          Menu
        </div>
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onMouseEnter={() => setHovered(to)}
              onMouseLeave={() => setHovered(null)}
              className={`relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group overflow-hidden ${isActive
                  ? "bg-zinc-900 border border-zinc-800"
                  : "hover:bg-zinc-900/50 hover:border hover:border-zinc-800/50 border border-transparent"
                }`}
            >
              {/* Hover Glow Effect for non-active items */}
              {!isActive && (
                <div className="absolute inset-0 bg-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              )}

              {/* Icon */}
              <Icon
                size={22}
                className={`relative z-10 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-white" : "text-zinc-500 group-hover:text-white"
                  }`}
              />

              {/* Label */}
              <span className={`relative z-10 font-medium tracking-wide transition-colors duration-300 ${isActive ? "text-white" : "text-zinc-500 group-hover:text-white"
                }`}>
                {label}
              </span>

              {/* Active Indicator Arrow */}
              {isActive && (
                <ChevronRight className="relative z-10 ml-auto text-white/50 w-5 h-5 animate-pulse" />
              )}

              {/* Hover Indicator Arrow is handled purely via group-hover usually, but lets use conditional for cleaner code */}
              {!isActive && (
                <ChevronRight className="relative z-10 ml-auto text-zinc-600 w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4  bg-black">
        {/* User Mini Profile Card could go here, for now just a stylized logout */}
        <button
          onClick={handleLogout}
          className="group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-all duration-300 overflow-hidden"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center group-hover:bg-red-900/20 text-zinc-500 group-hover:text-red-400 transition-colors duration-300 border border-zinc-800 group-hover:border-red-900/30">
            <LogOut size={18} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-zinc-400 group-hover:text-red-400 transition-colors">Sign Out</p>
            <p className="text-[10px] text-zinc-600">End session</p>
          </div>
        </button>
      </div>
    </aside>
  );
}

export default B2bAdminSidebar;
