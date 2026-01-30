# ZeuzCrypto Frontend

A modern, high-performance React application for the ZeuzCrypto trading platform.

## 🚀 Project Overview

The frontend provides a seamless interface for:
- **Crypto Trading** (Real-time charts, order placement)
- **Dashboard & Portfolio Management**
- **Admin Panels** (User management, B2B/B2C controls)
- **Gamification** (Challenges, Leaderboards, Achievements)

## 📂 Project Structure

The project is built with Vite + React.

| Directory | Description | Documentation |
|---|---|---|
| **src/pages** | Main view components (pages). | [View Routes](docs/routes.md) |
| **src/components** | Reusable UI components. | [View Structure](docs/structure.md) |
| **src/contexts** | Global state (Auth, Wallet, PnL). | [View Structure](docs/structure.md) |
| **src/layouts** | Page layouts (Dashboard, Admin). | - |

## 🛠️ Setup & Requirements

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd Crypto-Frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env` file in the root:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api/v1/
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   ```

## 📖 Documentation

- **[Project Structure](docs/structure.md)**: Detailed breakdown of components and state management.
- **[Routing & Access](docs/routes.md)**: List of all application routes and permission levels.
