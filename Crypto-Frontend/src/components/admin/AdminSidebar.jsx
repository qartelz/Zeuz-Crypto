// import { Link, useLocation, useNavigate } from "react-router-dom";
// import {
//   LayoutDashboard,
//   Users,
//   LogOut,
//   Crown,
//   DollarSign,
//   Tag,
//   CreditCard,
//   Flag,
// } from "lucide-react";
// import { useContext, useState } from "react";
// import { AuthContext } from "../../contexts/AuthContext";
// import { ToastContainer, toast } from "react-toastify";
// import 'react-toastify/dist/ReactToastify.css';

// function AdminSidebar() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { logoutUser } = useContext(AuthContext);
//   const [loggingOut, setLoggingOut] = useState(false); 

//   const links = [
//     { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
//     { to: "/admin/challenges", label: "Challenges", icon: Flag },   
//     { to: "/admin/userspage", label: "B2C Users", icon: Users },
//     { to: "/admin/adminspage", label: "Admins", icon: Crown },
//     { to: "/admin/plans", label: "Plans", icon: DollarSign },
//     { to: "/admin/coupons", label: "Coupons", icon: Tag },
//     { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
//   ];

//   const handleLogout = () => {
//     setLoggingOut(true);   
//     logoutUser();
    
//     toast.info('👋 Logged out successfully!', {
//       position: 'top-right',
//       autoClose: 2000,
//       hideProgressBar: false,
//       theme: 'dark',
//       style: { borderRadius: '8px', fontWeight: 500, background: '#160C26', border: '1px solid rgba(168, 85, 247, 0.3)' }
//     });

//     setTimeout(() => {
//       navigate("/admin-login"); 
//       setLoggingOut(false); // Reset state after navigation
//     }, 1500);
//   };

//   return (
//     <>
//       <aside className="fixed top-0 left-0 h-screen w-64 bg-[#160C26] text-purple-300/70 border-r border-purple-500/20 flex flex-col">
//         {/* Header */}
//         <div className="p-5 border-b border-purple-500/20">
//           <h2 className="text-xl font-bold text-white tracking-wide">
//             Admin Panel
//           </h2>
//         </div>

//         {/* Navigation Links */}
//         <nav className="flex-1 p-4 space-y-2">
//           {links.map(({ to, label, icon: Icon }) => {
//             const isActive = location.pathname.startsWith(to);
//             return (
//               <Link
//                 key={to}
//                 to={to}
//                 className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium
//                   ${isActive
//                     ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
//                     : "text-purple-300/70 hover:bg-purple-500/10 hover:text-white"
//                   }`}
//               >
//                 <Icon size={20} />
//                 {label}
//               </Link>
//             );
//           })}
//         </nav>

//         {/* Footer Logout Button */}
//         <div className="p-4 border-t border-purple-500/20">
//           <button
//             onClick={handleLogout}
//             disabled={loggingOut}
//             className={`flex items-center justify-center gap-3 px-4 py-2.5 w-full rounded-lg transition-all duration-200 font-medium
//               ${loggingOut 
//                 ? "bg-gray-700/50 text-gray-500 cursor-not-allowed" 
//                 : "bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/20"
//               }`}
//           >
//             <LogOut size={20} />
//             {loggingOut ? "Logging out..." : "Logout"}
//           </button>
//         </div>
//       </aside>

//       {/* Local ToastContainer for logout message */}
//       <ToastContainer
//         position="top-right"
//         autoClose={2000}
//         hideProgressBar={false}
//         newestOnTop
//         closeOnClick
//         pauseOnHover
//         theme="dark"
//         bodyClassName={() => "text-sm font-medium"}
//       />
//     </>
//   );
// }

// export default AdminSidebar;
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
  X,
} from "lucide-react";
import { useContext, useState } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AdminSidebar({ closeSidebar }) {
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

    toast.info("👋 Logged out successfully!", {
      position: "top-right",
      autoClose: 2000,
      theme: "dark",
      style: {
        borderRadius: "8px",
        fontWeight: 500,
        background: "#160C26",
        border: "1px solid rgba(168, 85, 247, 0.3)",
      },
    });

    setTimeout(() => {
      navigate("/admin-login");
      setLoggingOut(false);
    }, 1500);
  };

  return (
    <>
      <aside className="h-screen w-64 bg-[#160C26] text-purple-300/70 border-r border-purple-500/20 flex flex-col relative">
        {/* Mobile close button */}
        <button
          onClick={closeSidebar}
          className="absolute top-4 right-4 text-gray-400 hover:text-white lg:hidden"
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div className="p-5 border-b border-purple-500/20">
          <h2 className="text-xl font-bold text-white tracking-wide">
            Admin Panel
          </h2>
        </div>

        {/* Links */}
        <nav className="flex-1 p-4 space-y-2">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium ${
                  isActive
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                    : "text-purple-300/70 hover:bg-purple-500/10 hover:text-white"
                }`}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-purple-500/20">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={`flex items-center justify-center gap-3 px-4 py-2.5 w-full rounded-lg transition-all duration-200 font-medium ${
              loggingOut
                ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                : "bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border border-red-500/20"
            }`}
          >
            <LogOut size={20} />
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
        bodyClassName={() => "text-sm font-medium"}
      />
    </>
  );
}

export default AdminSidebar;
