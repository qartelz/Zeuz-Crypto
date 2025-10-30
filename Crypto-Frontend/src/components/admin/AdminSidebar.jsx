import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Crown,
  DollarSign,
  Tag,
  CreditCard,
  Flag,
} from "lucide-react";
import { useContext, useState } from "react";
import {AuthContext} from "../../contexts/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutUser } = useContext(AuthContext);
  const [loggingOut, setLoggingOut] = useState(false); 

  const links = [
    { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/challenges", label: "Challenges", icon: Flag },  
    { to: "/admin/userspage", label: "B2C Users", icon: Users },
    { to: "/admin/adminspage", label: "Admins", icon: Crown },
    { to: "/admin/plans", label: "Plans", icon: DollarSign },
    { to: "/admin/coupons", label: "Coupons", icon: Tag },
    { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  ];

  const handleLogout = () => {
    setLoggingOut(true);   
    logoutUser();
    setTimeout(() => {
      navigate("/admin-login");
      setLoggingOut(false); // Reset state (optional)
    }, 2000);
    

    toast.info('👋 Logged out successfully!', {
      position: 'top-right',
      autoClose: 2000,
      hideProgressBar: false,
      theme: 'dark',
      style: { borderRadius: '8px', fontWeight: 500 }
    });

    setTimeout(() => {
      navigate("/admin-login"); 
    }, 1500);
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-gray-900 text-gray-200 shadow-2xl flex flex-col">
      <div className="p-6 shadow-md">
        <h2 className="text-2xl font-bold text-white tracking-wide">
          Admin Panel
        </h2>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {links.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition font-medium
                ${isActive
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
          disabled={loggingOut}
          className={`flex items-center gap-3 px-4 py-2 w-full rounded-lg transition shadow-md
            ${loggingOut ? "bg-gray-600 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white"}`}
        >
          <LogOut size={20} />
          {loggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>

      {/* Local ToastContainer */}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
      />
    </aside>
  );
}

export default AdminSidebar;
