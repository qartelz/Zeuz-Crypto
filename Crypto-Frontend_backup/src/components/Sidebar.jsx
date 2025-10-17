import {
  Home,
  BarChart3,
  History,
  Gamepad2,
  Trophy,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { useState, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";


const Sidebar = ({ onHoverChange }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { logoutUser } = useContext(AuthContext); // ✅ from context

  const navItems = [
    { id: "home", icon: Home, label: "Home", path: "/" },
    { id: "market", icon: BarChart3, label: "Market", path: "/trading" },
    { id: "Orders", icon: History, label: "Target", path: "/history" },
    { id: "challenge", icon: Gamepad2, label: "Challenge", path: "/dashboard/challenge" },
    { id: "achievements", icon: Trophy, label: "Achievements", path: "/dashboard/achievements" },
    { id: "settings", icon: Settings, label: "Settings", path: "/dashboard/settings" },
  ];

  const bottomItems = [
  
    { id: "logout", icon: LogOut, label: "Log Out" },
  ];

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHoverChange?.(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverChange?.(false);
  };

  const handleLogout = () => {
    if (loggingOut) return;
    setLoggingOut(true);

    // ✅ Use AuthContext logout method
    logoutUser();

    // ✅ Redirect after short delay
    setTimeout(() => {
      navigate("/login");
      setLoggingOut(false);
    }, 1000);
  };

  return (
    <div
      className={`h-full z-50 relative transition-all duration-300 bg-[radial-gradient(rgba(0,0,0,0.6),transparent_70%)] backdrop-blur-md before:content-[''] before:absolute before:top-0 before:right-0 before:w-[1px] before:h-full before:bg-gradient-to-b before:from-transparent before:via-white/30 before:to-transparent 
      ${isHovered ? "w-[220px]" : "w-[70px]"}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col justify-between h-full py-6">
        {/* Navigation */}
        <div className="flex flex-col flex-1 px-2 space-y-2">
          {navItems.map(({ id, icon: Icon, label, path }) => (
            <NavLink
              key={id}
              to={path}
              className={({ isActive }) =>
                `flex items-center space-x-3 py-3 px-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  isActive ? "bg-[#D643BF]/20" : "hover:bg-[#D643BF]/10"
                }`
              }
            >
              <Icon className="text-[#D643BF] w-6 h-6 flex-shrink-0" />
              {isHovered && <span className="text-white font-medium">{label}</span>}
            </NavLink>
          ))}
        </div>

        {/* Bottom Items */}
        <div className="flex flex-col px-2 space-y-2">
          {bottomItems.map(({ id, icon: Icon, label, path }) =>
            id === "logout" ? (
              <button
                key={id}
                onClick={handleLogout}
                disabled={loggingOut}
                className={`flex items-center space-x-3 py-3 px-3 rounded-lg cursor-pointer transition-all duration-200 w-full text-left
                  ${
                    loggingOut
                      ? "bg-gray-600 cursor-not-allowed"
                      : "hover:bg-[#D643BF]/10"
                  }`}
              >
                <Icon className="text-[#D643BF] w-6 h-6 flex-shrink-0" />
                {isHovered && (
                  <span className="text-white whitespace-nowrap font-medium">
                    {loggingOut ? "Logging out..." : label}
                  </span>
                )}
              </button>
            ) : (
              <NavLink
                key={id}
                to={path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 py-3 px-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    isActive ? "bg-[#D643BF]/20" : "hover:bg-[#D643BF]/10"
                  }`
                }
              >
                <Icon className="text-[#D643BF] w-6 h-6 flex-shrink-0" />
                {isHovered && <span className="text-white font-medium">{label}</span>}
              </NavLink>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
