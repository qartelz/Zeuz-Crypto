import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  UserCog,
  LogOut,
} from "lucide-react";
import { useContext } from "react";
import {  } from "../../contexts/AuthContext";

function B2bAdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutUser } = useContext(AuthContext);

  const links = [
    { to: "/b2b/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/b2b/batches", label: "Batches", icon: UserCog },
    { to: "/b2b/settings", label: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    logoutUser(); 
    navigate("/b2badmin-login"); 
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-gray-900 text-gray-200 shadow-2xl flex flex-col">
      <div className="p-6 shadow-md">
        <h2 className="text-2xl font-bold text-white tracking-wide">
          B2B Admin
        </h2>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition font-medium
                ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 w-full rounded-lg bg-red-600 text-white hover:bg-red-700 transition shadow-md"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default B2bAdminSidebar;
