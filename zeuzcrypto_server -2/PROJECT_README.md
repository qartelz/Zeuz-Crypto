# ZeuzCrypto Backend Server

Professional, scalable, and modular backend for the ZeuzCrypto platform. Built with Django REST Framework.

## 🚀 Project Overview

This backend services the ZeuzCrypto platform, handling:
- **User Authentication & Management** (B2C & B2B)
- **Crypto Trading Simulation** (Spot, Futures, Options)
- **Challenge & Reward Systems**
- **Subscription & Plan Management**
- **Wallet & Portfolio Tracking**

## 📂 Project Structure

The project follows a modular app-based structure within `zeuzcryptoserver/apps/`:

| App | Description | Documentation |
|BC|---|---|
| **accounts** | User auth, profiles, and role management. | [View Docs](docs/api/accounts.md) |
| **client/trading** | Trading engine, order management, and PnL. | [View Docs](docs/api/trading.md) |
| **admin/challenge** | Challenge programs, tasks, and analytics. | [View Docs](docs/api/challenges.md) |
| **admin/subscriptions** | Plans, coupons, and subscription logic. | [View Docs](docs/api/subscriptions.md) |

## 🛠️ Setup & Requirements

### Prerequisites
- Python 3.10+
- PostgreSQL
- Redis (for caching/tasks)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd zeuzcrypto_server
   ```

2. **Create Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables**
   Create a `.env` file in the root directory:
   ```
   DEBUG=True
   SECRET_KEY=your_secret_key
   DATABASE_URL=postgres://user:pass@localhost:5432/zeuzcrypto
   ```

5. **Run Migrations**
   ```bash
   python manage.py migrate
   ```

6. **Start Server**
   ```bash
   python manage.py runserver
   ```

## 📖 API Documentation

Detailed API documentation is separated by module. Please refer to the `docs/api/` directory for specifics on endpoints, request/response formats, and usage.

- **[Accounts API](docs/api/accounts.md)**: Authenticate users, manage profiles.
- **[Trading API](docs/api/trading.md)**: Place orders, view history, manage portfolio.
- **[Challenges API](docs/api/challenges.md)**: Join challenges, track progress, earn rewards.
- **[Subscriptions API](docs/api/subscriptions.md)**: Manage plans and payments.
