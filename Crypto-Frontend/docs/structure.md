# Project Structure & components

## 📂 Directory Breakdown

### `src/components`
Reusable UI elements organized by function.

- **common/**: Generic components used across the app (Buttons, Inputs, Modals).
  - `Trading.jsx`: Main trading interface component.
  - `SubscriptionIdleAlert.jsx`: User alert for inactive subscriptions.
- **charts/**: Recharts/Chart.js wrappers for financial data.

### `src/contexts`
Global state management using React Context API.

- **AuthContext**: Manages user login state, tokens, and role-based access.
- **WalletContext**: Tracks real-time wallet balance and currency.
- **PnLContext**: Manages real-time Profit and Loss logic for the trading interface.

### `src/layouts`
Wrapper components that define the page structure.

- **DashboardLayout**: Standard user layout with sidebar and navbar.
- **AdminLayout**: Admin-specific layout with management tools.
- **B2bAdminLayout**: Layout for B2B administrators.

## 🧩 Key Components

### Trading Interface (`pages/Trading.jsx` or `components/common/Trading.jsx`)
The core of the application. It integrates:
- **Price Chart**: Visualizes market data.
- **Order Form**: Allows placing Limit/Market orders.
- **Positions Table**: Shows active trades and PnL.

### Challenges (`pages/Challenges.jsx`)
Gamification hub where users can:
- View active challenge weeks.
- See progress bars and tiers.
- Claim rewards.

### Admin Dashboard (`pages/admin/AdminDashboard.jsx`)
Overview for administrators to:
- Monitor total users and system health.
- Manage subscriptions and plans.
