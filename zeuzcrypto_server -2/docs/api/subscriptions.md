# Subscriptions API

Plan management, coupons, and subscription handling.

**Base URL**: `/api/v1/subscriptions/`

## Plans

### List Plans
- **Endpoint**: `GET /plans/`
- **Description**: List all available subscription plans.

### Get Active Plans
- **Endpoint**: `GET /plans/active/`
- **Parameters**: `?user_type=B2B|B2C`
- **Description**: Get plans available for purchase.

### Plan Details
- **Endpoint**: `GET /plans/{id}/`
- **Description**: Get full details of a plan.

## Coupons

### Validate Coupon
- **Endpoint**: `POST /coupons/{id}/validate_coupon/`
- **Body**: `{ "plan_id": "uuid" }`
- **Description**: Check if a coupon is valid for a selected plan.

## Subscriptions (User)

### Create Subscription
- **Endpoint**: `POST /subscriptions/`
- **Body**:
  ```json
  {
    "plan_id": "uuid",
    "coupon_code": "OPTIONAL",
    "start_date": "2023-01-01" // Optional
  }
  ```

### My Subscriptions
- **Endpoint**: `GET /subscriptions/`
- **Description**: List user's subscriptions.

### Active Subscription
- **Endpoint**: `GET /subscriptions/active/`
- **Description**: Get the user's currently active subscription.

### Cancel Subscription
- **Endpoint**: `POST /subscriptions/{id}/cancel/`
- **Description**: Cancel a specific subscription.
