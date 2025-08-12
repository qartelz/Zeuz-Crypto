import { NavLink } from 'react-router-dom';
import {
  Home,
  Trophy,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react'; // Lucide icons

const mainMenuItems = [
  { to: '/', icon: <Home />, label: 'Home' },
  { to: '/challenges', icon: <Trophy />, label: 'Challenges' },
  { to: '/settings', icon: <Settings />, label: 'Settings' },
];

const bottomMenuItems = [
  { to: '/help', icon: <HelpCircle />, label: 'Help' },
  { to: '/logout', icon: <LogOut />, label: 'Logout' },
];

export default function Sidebar() {
  return (
    <div className="group flex flex-col justify-between bg-gray-800 text-white transition-all duration-300 w-16 hover:w-48 min-h-screen">
      {/* Top: Logo and Main Navigation */}
      <div>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-2">
          <img
            src="/logo.svg"
            alt="Logo"
            className="h-10 w-auto"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '';
            }}
          />
          <span className="sr-only">App Logo</span>
        </div>

        {/* Menu Items */}
        <div className="mt-6 flex flex-col p-4 gap-4">
          {mainMenuItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) =>
                `flex items-center gap-4 p-2 rounded-md transition-all hover:bg-gray-700 ${
                  isActive ? 'bg-gray-700 font-semibold' : ''
                }`
              }
            >
              <span>{icon}</span>
              <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {label}
              </span>
            </NavLink>
          ))}
        </div>
      </div>

      {/* Bottom: Help & Logout */}
      <div className="border-t border-gray-700 p-4 flex flex-col gap-4">
        {bottomMenuItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="flex items-center gap-4 p-2 rounded-md transition-all hover:bg-gray-700"
          >
            <span>{icon}</span>
            <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {label}
            </span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
