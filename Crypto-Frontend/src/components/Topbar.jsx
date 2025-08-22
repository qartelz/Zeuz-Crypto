import { Bell, ChevronDown, User } from 'lucide-react';
import logo from '../assets/svg/logo.svg';

const Topbar = () => {
  return (
    <div className="flex items-center justify-between px-6 py-10 h-16 backdrop-blur-md ">
      {/* Left Section: Logo and Nav */}
      <div className="flex items-center space-x-10">
        {/* Logo */}
        <img src={logo} alt="Logo" className="h-8 w-auto" />

        {/* Navigation Dropdown */}
        <div className="relative cursor-pointer flex items-center space-x-1 text-sm text-gray-300 hover:text-white">
          <span>Markets</span>
          <ChevronDown size={14} />
        </div>
      </div>

      {/* Right Section: Balance Boxes + Notifications + Profile */}
      <div className="flex items-center gap-6 text-white">
        {/* Balance Boxes */}
        <div className="flex gap-5">
          {/* Portfolio Balance Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 min-w-[160px] text-white">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Portfolio Balance</span>
              <span className="text-green-400">+10%</span>
            </div>
            <div className="font-bold text-base">$10,000.00</div>
          </div>

          {/* Available Balance Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 min-w-[160px] text-white">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Available Balance</span>
              <span className="text-green-400">+5%</span>
            </div>
            <div className="font-bold text-base">$4,500.00</div>
          </div>
        </div>

        {/* Notification Icon */}
        <Bell className="w-5 h-5 text-gray-300 hover:text-white cursor-pointer" />

        {/* Profile */}
        <div className="flex items-center cursor-pointer space-x-2">
          <User className="w-5 h-5 text-gray-300" />
          <span className="text-sm font-medium">John Doe</span>
          <ChevronDown size={14} />
        </div>
      </div>
    </div>
  );
};

export default Topbar;
