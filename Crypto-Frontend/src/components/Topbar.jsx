import { Bell, ChevronDown, User, Menu, X, LogOut, Settings } from "lucide-react";
import logo from "../assets/svg/logo.svg";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WalletContext } from "../contexts/WalletContext";
import { AuthContext } from "../contexts/AuthContext";
import { usePnL } from "../contexts/PnLContext";

const Topbar = ({ onToggleSidebar, sidebarOpen }) => {
  const { totalPnL, totalPnLPercentage, isloading } = usePnL();
  const { balance, loading } = useContext(WalletContext);
  const { user, logoutUser } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleViewProfile = () => {
    navigate('/profile');
    setDropdownOpen(false);
  };

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

        {/* Navigation Dropdown */}
        
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-6 text-white relative">
        {/* Balance Boxes */}
        <div className="hidden sm:flex gap-5">
          {/* Portfolio Balance Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 min-w-[160px] text-white">
            {isloading ? (
              <div className="text-sm text-gray-400">Loading...</div>
            ) : (
              <>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Portfolio PnL </span>
                  <span
                    className={`${
                      totalPnLPercentage >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    ({totalPnLPercentage >= 0 ? '+' : ''}
                    {totalPnLPercentage.toFixed(2)}%)
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span
                    className={`font-bold text-base ${
                      totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {totalPnL >= 0 ? '+' : ''}
                    {totalPnL.toFixed(2)} USDT
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Available Balance Box */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg px-4 py-2 min-w-[160px] text-white">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Available Balance</span>
   
            </div>
            <div className="font-bold text-base">
              {loading
                ? "Loading..."
                : `$${parseFloat(balance || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}`}
            </div>
          </div>
        </div>

        {/* Notification Icon */}
        {/* <Bell className="w-5 h-5 text-gray-300 hover:text-white cursor-pointer" /> */}

        {/* Profile Dropdown */}
        <div className="relative ">
          <div
            className="flex items-center cursor-pointer space-x-2"
            onClick={toggleDropdown}
          >
            <User className="w-5 h-5 text-gray-300" />
            <span className="hidden sm:inline text-sm font-medium">
              {user?.full_name || user?.first_name || "User"}
            </span>
            <ChevronDown
              size={14}
              className={`hidden sm:block transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute z-40 backdrop-blur-lg right-0 mt-3 w-56 bg-[#1C1E2A] border border-gray-800 rounded-lg shadow-lg py-2">
              <div className="px-4 py-2 border-b border-gray-700">
                <p className="text-sm font-semibold text-white">
                  {user?.full_name || "User"}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>

              <div className="px-4 py-2 text-sm text-gray-300">
                <p>Role: <span className="text-white font-medium">{user?.role || "N/A"}</span></p>
                <p>Mobile: <span className="text-gray-400">{user?.mobile}</span></p>
              </div>

              {/* View Profile Button */}
              <button
                onClick={handleViewProfile}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-white/5 transition border-t border-gray-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                View Profile
              </button>

              <button
                onClick={() => {
                  logoutUser();
                  setDropdownOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;