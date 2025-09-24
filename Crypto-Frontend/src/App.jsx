import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Challenges from "./pages/Challenges";
import Settings from "./pages/Settings";
import LoginPage from "./pages/Login";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import DashboardLayout from "./layouts/DashboardLayout";
import Trading from "./components/common/Trading";
import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserProfile from "./pages/admin/UserProfile";
import PasswordReset from "./pages/ResetPassword";
import UsersListPage from "./pages/admin/UsersListPage";
import { AuthProvider } from "./contexts/AuthContext";
import RegisterPage from "./pages/RegisterPage";
import PrivateRoute from "./routes/PrivateRoute";
import B2bAdminLoginPage from "./pages/b2badmin/b2bAdminLoginPage";
import B2bAdminLayout from "./layouts/B2bAdminLayout";
import BatchesList from "./pages/b2badmin/BatchesList";
import B2bAdminsListPage from "./pages/admin/B2bAdminsListPage";
import PlansManagement from "./pages/admin/PlansManagement";
import PlanDetails from "./pages/admin/PlanDetails";
import CouponsManagement from "./pages/admin/CouponsManagement";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/b2badmin-login" element={<B2bAdminLoginPage />} />
          <Route path="/reset-password" element={<PasswordReset />} />

          {/*Protected Routes - User */}
          <Route element={<PrivateRoute allowedRoles={["user"]} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/trading" element={<Trading />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/challenge" element={<Challenges />} />
            </Route>
          </Route>

          {/*Protected Routes - Admin */}
          <Route element={<PrivateRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="userspage" element={<UsersListPage />} />
              <Route path="adminspage" element={<B2bAdminsListPage />} />
              <Route path="plans" element={<PlansManagement />} />
              <Route path="plans/:id" element={<PlanDetails />} />
              <Route path="coupons" element={<CouponsManagement />} />


              <Route path="user-profile" element={<UserProfile />} />
            </Route>
          </Route>

          <Route element={<PrivateRoute allowedRoles={["b2b_admin"]} />}>
            <Route path="/b2b" element={<B2bAdminLayout />}>
              <Route path="batches" element={<BatchesList />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
