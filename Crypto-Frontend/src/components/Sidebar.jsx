// components/Sidebar.jsx
import { Link } from 'react-router-dom';
import {
  Home,
  History,
  Gamepad2,
  Trophy,
  Settings,
  LogOut,
  BarChart3, // Lucide icon for trading
} from 'lucide-react';

const Sidebar = () => {
  const iconStyle = "text-[#D643BF] w-6 h-6 hover:scale-110 transition-transform duration-150";

  return (
    <div className="flex flex-col justify-between items-center w-[70px] py-6 h-full">
      {/* Top Icons */}
      <div className="flex flex-col items-center space-y-6">
        <Link to="/"><Home className={iconStyle} /></Link>
        {/* <Link to="/dashboard"><History className={iconStyle} /></Link> */}
        <Link to="/trading"><BarChart3 className={iconStyle} /></Link> 
        <Link to="/challenge"><Gamepad2 className={iconStyle} /></Link>
        <Link to="/trophy"><Trophy className={iconStyle} /></Link>
        <Link to="/settings"><Settings className={iconStyle} /></Link>
      </div>

      {/* Logout Icon at Bottom */}
      <div className="flex flex-col items-center">
        <Link to="/logout"><LogOut className={iconStyle} /></Link>
      </div>
    </div>
  );
};

export default Sidebar;
