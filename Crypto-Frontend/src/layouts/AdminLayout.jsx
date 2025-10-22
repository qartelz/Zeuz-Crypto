import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import AdminSidebar from "../components/admin/AdminSidebar";

function AdminLayout() {
  const navigate = useNavigate();

  // useEffect(() => {
  //   const accessToken = localStorage.getItem("admin_access_token");
  //   console.log(accessToken,"the acess token")

  //   const adminUser = JSON.parse(localStorage.getItem("admin_user"));
  //   console.log(adminUser,"the admin acess")


  //   if (!accessToken || !adminUser || adminUser.role !== "admin") {
  //     // 🚫 Not authenticated or not admin
  //     navigate("/admin-login");
  //   }
  // }, [navigate]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar fixed */}
      <div className="w-64">
        <AdminSidebar />
      </div>

      {/* Main content with gradient background */}
      <main className="flex-1 p-6 overflow-y-auto bg-gradient-to-br from-[#0F0F1E] to-[#4733A6]">
        <div className=" rounded-xl shadow-lg p-6 min-h-screen text-gray-100">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
