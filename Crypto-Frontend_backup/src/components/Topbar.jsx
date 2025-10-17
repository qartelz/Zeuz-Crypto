import { Bell, ChevronDown, User, Menu, X } from 'lucide-react';
import logo from '../assets/svg/logo.svg';
import { useContext } from 'react';
import { WalletContext } from '../contexts/WalletContext';

const Topbar = ({ onToggleSidebar, sidebarOpen }) => {
  const { balance, loading } = useContext(WalletContext); // ✅ Access balance and loading state

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-10 h-16 backdrop-blur-md border-b border-white/10">
      {/* Left Section */}
      <div className="flex items-center space-x-4 sm:space-x-10">
        {/* Mobile Burger */}
        <button
          className="sm:hidden p-2 rounded hover:bg-white/10"
          onClick={onToggleSidebar}
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Logo */}
        <img src={logo} alt="Logo" className="h-7 sm:h-8 w-auto" />

        {/* Navigation Dropdown (hidden on small screens) */}
        <div className="hidden sm:flex relative cursor-pointer items-center space-x-1 text-sm text-gray-300 hover:text-white">
          <span>Markets</span>
          <ChevronDown size={14} />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6 text-white">
        {/* Balance Boxes (only visible on sm and above) */}
        <div className="hidden sm:flex gap-5">
          {/* Portfolio Balance Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 min-w-[160px] text-white">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Portfolio Balance</span>
              <span className="text-green-400">+10%</span>
            </div>
            <div className="font-bold text-base">
              $10,000.00 {/* Placeholder static value */}
            </div>
          </div>

          {/* Available Balance Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 min-w-[160px] text-white">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Available Balance</span>
              <span className="text-green-400">+5%</span>
            </div>
            <div className="font-bold text-base">
              {loading
                ? 'Loading...'
                : `$${parseFloat(balance || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}`}
            </div>
          </div>
        </div>

        {/* Notification Icon */}
        <Bell className="w-5 h-5 text-gray-300 hover:text-white cursor-pointer" />

        {/* Profile */}
        <div className="flex items-center cursor-pointer space-x-2">
          <User className="w-5 h-5 text-gray-300" />
          <span className="hidden sm:inline text-sm font-medium">John Doe</span>
          <ChevronDown size={14} className="hidden sm:block" />
        </div>
      </div>
    </div>
  );
};

export default Topbar;
