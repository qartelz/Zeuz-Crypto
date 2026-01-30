# Routes & Access Control

The application uses `react-router-dom` for navigation and `PrivateRoute` for role-based security.

## 🌍 Public Routes
Accessible by anyone without authentication.

| Path | Component | Description |
|---|---|---|
| `/` | `Home` | Landing page. |
| `/login` | `LoginPage` | User login. |
| `/register` | `RegisterPage` | User registration. |
| `/admin-login` | `AdminLoginPage` | Super Admin login. |
| `/b2badmin-login` | `B2bAdminLoginPage` | B2B Admin login. |

## 🔒 User Routes (Protected)
**Allowed Roles**: `b2c_user`, `b2b_user`

| Path | Component | Description |
|---|---|---|
| `/trading` | `Trading` | Main trading terminal. |
| `/history` | `OrderHistory` | Past trades and order logs. |
| `/challenges` | `Challenges` | Active challenges and progress. |
| `/achievements` | `Achievements` | Earned badges and rewards. |
| `/profile` | `ProfilePage` | User settings and profile. |
| `/settings` | `Settings` | Account configuration. |

## 🛡️ Admin Routes (Protected)
**Allowed Roles**: `admin`

| Path | Component | Description |
|---|---|---|
| `/admin/dashboard` | `AdminDashboard` | System overview. |
| `/admin/userspage` | `UsersListPage` | Manage all B2C/B2B users. |
| `/admin/adminspage` | `B2bAdminsListPage` | Manage B2B Admins. |
| `/admin/plans` | `PlansManagement` | Create/Edit subscription plans. |
| `/admin/coupons` | `CouponsManagement` | Create/Edit coupons. |
| `/admin/challenges` | `ChallengesManagement` | Create/Edit challenge programs. |

## 🏢 B2B Admin Routes (Protected)
**Allowed Roles**: `b2b_admin`

| Path | Component | Description |
|---|---|---|
| `/b2b/dashboard` | `B2bDashboard` | Overview of B2B user group. |
| `/b2b/batches` | `BatchesList` | Manage user batches. |
