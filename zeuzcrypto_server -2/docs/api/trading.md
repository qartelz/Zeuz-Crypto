# Trading API

Core trading functionality, order placement, portfolio management, and market data.

**Base URL**: `/api/v1/trading/`

## Orders

### Place Order
- **Endpoint**: `POST /place-order/`
- **Description**: Place a new Spot, Future, or Option order.
- **Body**:
  ```json
  {
    "symbol": "BTC",
    "trade_type": "SPOT", // SPOT, FUTURES, OPTIONS
    "direction": "BUY", // BUY, SELL
    "quantity": 0.1,
    "order_type": "MARKET", // MARKET, LIMIT
    "price": 50000, // Required for LIMIT
    "leverage": 10 // Required for Futures/Options
  }
  ```

### Close Trade
- **Endpoint**: `POST /close-trade/{trade_id}/`
- **Description**: Close an existing open position.

### Partial Close
- **Endpoint**: `POST /partial-close/{trade_id}/`
- **Description**: Partially close an open position.
- **Body**: `{ "quantity": 0.05 }`

### Check Orders (Matching Engine)
- **Endpoint**: `POST /check-orders/`
- **Description**: Trigger order matching engine to process pending limit orders and check for expired options/futures.

## Portfolio & History

### Portfolio Summary
- **Endpoint**: `GET /portfolio/summary/`
- **Description**: Get aggregated portfolio statistics (Total PnL, Invested Amount, etc.).

### Active Positions
- **Endpoint**: `GET /portfolio/positions/`
- **Description**: Get a list of all currently open trades.

### Trade History
- **Endpoint**: `GET /history/`
- **Description**: Get paginated list of past trades.

### Trade Details
- **Endpoint**: `GET /trades/{trade_id}/history/`
- **Description**: Get detailed history/logs for a specific trade.

## Market Data

### Update Prices
- **Endpoint**: `POST /update-prices/`
- **Description**: Trigger a manual price update (Admin/System).

### Risk Check
- **Endpoint**: `POST /risk-check/`
- **Description**: Validate order parameters against risk rules before placement.
