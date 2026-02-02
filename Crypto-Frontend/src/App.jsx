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
import OrderHistory from "./pages/OrderHistory";
import "react-toastify/dist/ReactToastify.css";
import { Toaster } from "react-hot-toast";
import { WalletProvider } from "./contexts/WalletContext";
import Achievements from "./pages/Achievements";
import { PnLProvider } from "./contexts/PnLContext";
import ProfilePage from "./pages/ProfilePage";
import SubscriptionPage from "./pages/admin/SubscriptionPage";
import ChallengesManagement from "./pages/admin/ChallengesManagement";
import B2bAdminDetailsPage from "./pages/admin/B2bAdminDetailsPage";
import B2bDashboard from "./pages/b2badmin/B2bDashboard";
import B2bStudentDetails from "./pages/b2badmin/B2bStudentDetails";

function App() {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <AuthProvider>
        <WalletProvider>
          <PnLProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/admin-login" element={<AdminLoginPage />} />
              <Route path="/b2badmin-login" element={<B2bAdminLoginPage />} />
              <Route path="/reset-password" element={<PasswordReset />} />

              {/*Protected Routes - User */}
              <Route
                element={
                  <PrivateRoute allowedRoles={["b2c_user", "b2b_user"]} />
                }
              >
                <Route element={<DashboardLayout />}>
                  <Route path="/trading" element={<Trading />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/history" element={<OrderHistory />} />
                  <Route path="/challenges" element={<Challenges />} />
                  <Route path="/achievements" element={<Achievements />} />
                  <Route path="/profile" element={<ProfilePage />} />
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
                  <Route path="subscriptions" element={<SubscriptionPage />} />
                  <Route path="challenges" element={<ChallengesManagement />} />
                  <Route
                    path="adminspage/b2b-admin-details/:adminId"
                    element={<B2bAdminDetailsPage />}
                  />

                  <Route
                    path="userspage/user-profile/:userId"
                    element={<UserProfile />}
                  />
                  <Route
                    path="adminspage/user-profile/:userId"
                    element={<UserProfile />}
                  />
                </Route>
              </Route>

              <Route element={<PrivateRoute allowedRoles={["b2b_admin"]} />}>
                <Route path="/b2b" element={<B2bAdminLayout />}>
                  <Route path="dashboard" element={<B2bDashboard />} />
                  <Route path="batches" element={<BatchesList />} />
                  <Route path="batches/student/:userId" element={<B2bStudentDetails />} />
                </Route>
              </Route>
            </Routes>
          </PnLProvider>
        </WalletProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
