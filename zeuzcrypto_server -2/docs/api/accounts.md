# Accounts API

Authentication, user profile management, wallet access, and administrative functions.

**Base URL**: `/api/v1/account/`

## Authentication

### Login
- **Endpoint**: `POST /login/`
- **Description**: Authenticate user and receive JWT tokens.
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: `{ "access": "...", "refresh": "..." }`

### Register
- **Endpoint**: `POST /register/`
- **Description**: Register a new B2C user.
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "first_name": "John",
    "last_name": "Doe"
  }
  ```

### Refresh Token
- **Endpoint**: `POST /token/refresh/`
- **Description**: Get a new access token using a refresh token.

## User Management

### Get Current User
- **Endpoint**: `GET /me/`
- **Description**: Get details of the currently authenticated user.

### User Details (Admin)
- **Endpoint**: `GET /users/{id}/details/`
- **Description**: Get full user details including trades and wallet info (Admin only).

## Wallet

### Get Wallet
- **Endpoint**: `GET /wallet/`
- **Description**: Get current user's wallet balance and stats.

## B2B Administration

### B2B Admin Register
- **Endpoint**: `POST /b2b-admin/register/`
- **Description**: Register a new B2B Administrator.

### Batch Management
- **Description**: APIs for creating and managing user batches.
- **Endpoints**:
  - `POST /batch/create/`
  - `GET /batch/list/`
  - `GET /batch/users/{batch_id}/`
