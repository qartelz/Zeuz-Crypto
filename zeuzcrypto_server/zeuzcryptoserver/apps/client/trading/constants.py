from decimal import Decimal

# Trading limits
MAX_TRADE_AMOUNT = Decimal('1000000.00')  # $1M per trade
MIN_TRADE_AMOUNT = Decimal('1.00')        # $1 minimum

# Precision settings
PRICE_PRECISION = 8
QUANTITY_PRECISION = 8

# Status codes
TRADE_STATUS_CODES = {
    'PENDING': 'Order placed, waiting for execution',
    'OPEN': 'Position is active',
    'CLOSED': 'Position closed',
    'PARTIALLY_CLOSED': 'Position partially closed',
    'CANCELLED': 'Order cancelled',
}

# Asset categories
CRYPTO_ASSETS = ['BTC', 'ETH', 'ADA', 'DOT', 'LINK', 'UNI']
EQUITY_ASSETS = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA']

# Risk levels
RISK_LEVELS = {
    'LOW': {'max_leverage': 2, 'max_concentration': 10},
    'MEDIUM': {'max_leverage': 5, 'max_concentration': 20},
    'HIGH': {'max_leverage': 10, 'max_concentration': 30},
}

