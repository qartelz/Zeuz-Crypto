import uuid
from decimal import Decimal
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from apps.accounts.models import User


class Trade(models.Model):
    """Enhanced trade model with better asset handling"""
    TRADE_TYPES = [
        ('SPOT', 'Spot'),
        ('FUTURES', 'Futures'),
        ('OPTIONS', 'Options'),
        ('CFD', 'Contract for Difference'),
    ]
    
    DIRECTIONS = [
        ('BUY', 'Buy'),
        ('SELL', 'Sell'),
    ]
    
    STATUSES = [
        ('PENDING', 'Pending'),
        ('OPEN', 'Open'),
        ('CLOSED', 'Closed'),
        ('PARTIALLY_CLOSED', 'Partially Closed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    HOLDING_TYPES = [
        ('INTRADAY', 'Intraday'),
        ('SWING', 'Swing'),
        ('LONGTERM', 'Long Term'),
    ]

    MARGIN_MODES = [
        ('ISOLATED', 'Isolated'),
        ('CROSS', 'Cross'),
    ]

    ORDER_TYPES = [
        ('MARKET', 'Market'),
        ('LIMIT', 'Limit'),
        ('STOP', 'Stop Loss'),
        ('STOP_LIMIT', 'Stop Limit'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trades')
    
    # Trade metadata - store asset info at trade time
    asset_symbol = models.CharField(max_length=20)  # Snapshot of symbol
    asset_name = models.CharField(max_length=100, blank=True)  # Snapshot of name
    asset_exchange = models.CharField(max_length=50, blank=True, null=True)
    
    trade_type = models.CharField(max_length=10, choices=TRADE_TYPES)
    direction = models.CharField(max_length=4, choices=DIRECTIONS)
    status = models.CharField(max_length=20, choices=STATUSES, default='PENDING')
    holding_type = models.CharField(max_length=10, choices=HOLDING_TYPES, default='INTRADAY')
    margin_mode = models.CharField(max_length=10, choices=MARGIN_MODES, default='ISOLATED')
    order_type = models.CharField(max_length=15, choices=ORDER_TYPES, default='MARKET')

    # Limit / Stop Order Details
    limit_price = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    trigger_price = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    is_triggered = models.BooleanField(default=False)  # For Stop orders
    
    # Position details
    total_quantity = models.DecimalField(max_digits=20, decimal_places=8, validators=[MinValueValidator(Decimal('0'))])
    remaining_quantity = models.DecimalField(max_digits=20, decimal_places=8)
    average_price = models.DecimalField(max_digits=20, decimal_places=8, validators=[MinValueValidator(Decimal('0'))])
    
    # P&L
    realized_pnl = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    unrealized_pnl = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    total_invested = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    
    # Add current_price field (referenced in calculate_unrealized_pnl method)
    current_price = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)

    # Timestamps
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'user_trades'
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['asset_symbol', 'trade_type']),  # Fixed: changed 'asset' to 'asset_symbol'
            models.Index(fields=['user', 'asset_symbol', 'trade_type', 'status']),  # Fixed: changed 'asset' to 'asset_symbol'
            models.Index(fields=['user', 'opened_at']),
            models.Index(fields=['asset_symbol', 'status']),
        ]

    def save(self, *args, **kwargs):
        # Set remaining_quantity if not set
        if self.remaining_quantity is None:
            self.remaining_quantity = self.total_quantity
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email} - {self.asset_symbol} {self.direction} {self.total_quantity}"

    def calculate_unrealized_pnl(self, current_price):
        """Calculate unrealized P&L based on current market price"""
        if self.status in ['CLOSED', 'CANCELLED']:
            return Decimal('0')
        
        if self.direction == 'BUY':
            self.unrealized_pnl = (current_price - self.average_price) * self.remaining_quantity
        else:  # SELL (for futures short positions)
            self.unrealized_pnl = (self.average_price - current_price) * self.remaining_quantity
        
        self.current_price = current_price
        self.save(update_fields=['unrealized_pnl', 'current_price', 'updated_at'])
        return self.unrealized_pnl

    @property
    def total_pnl(self):
        """Total P&L including both realized and unrealized"""
        return self.realized_pnl + self.unrealized_pnl

    @property
    def pnl_percentage(self):
        """P&L as percentage of invested amount"""
        if self.total_invested == 0:
            return Decimal('0')
        return (self.total_pnl / self.total_invested) * 100


class FuturesDetails(models.Model):
    """Additional details for futures trades"""
    trade = models.OneToOneField(Trade, on_delete=models.CASCADE, related_name='futures_details')
    leverage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('1'))
    margin_required = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    margin_used = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    
    expiry_date = models.DateField()
    contract_size = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('1'))
    is_hedged = models.BooleanField(default=False)

    class Meta:
        db_table = 'futures_details'


class OptionsDetails(models.Model):
    """Additional details for options trades"""
    OPTION_TYPES = [
        ('CALL', 'Call'),
        ('PUT', 'Put'),
    ]
    
    POSITIONS = [
        ('LONG', 'Long'),   # Buying options
        ('SHORT', 'Short'), # Writing/Selling options
    ]

    trade = models.OneToOneField(Trade, on_delete=models.CASCADE, related_name='options_details')
    option_type = models.CharField(max_length=4, choices=OPTION_TYPES)
    position = models.CharField(max_length=5, choices=POSITIONS)
    strike_price = models.DecimalField(max_digits=20, decimal_places=8)
    expiry_date = models.DateField()
    premium = models.DecimalField(max_digits=20, decimal_places=8)

    class Meta:
        db_table = 'options_details'


class PriceHistory(models.Model):
    symbol = models.CharField(max_length=20)
    mark_price = models.DecimalField(max_digits=15, decimal_places=8)
    ltp = models.DecimalField(max_digits=15, decimal_places=8)
    high = models.DecimalField(max_digits=15, decimal_places=8)
    low = models.DecimalField(max_digits=15, decimal_places=8)
    volume = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'price_history'

class TradeHistory(models.Model):
    """History of all trade actions (buy/sell orders)"""
    ORDER_TYPES = [
        ('MARKET', 'Market'),
        ('LIMIT', 'Limit'),
        ('STOP', 'Stop Loss'),
        ('STOP_LIMIT', 'Stop Limit'),
    ]
    
    ACTIONS = [
        ('BUY', 'Buy'),
        ('SELL', 'Sell'),
        ('PARTIAL_SELL', 'Partial Sell'),
        ('CANCEL', 'Cancel'),
        ('MODIFY', 'Modify'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    trade = models.ForeignKey(Trade, on_delete=models.CASCADE, related_name='history')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    action = models.CharField(max_length=15, choices=ACTIONS)
    order_type = models.CharField(max_length=15, choices=ORDER_TYPES, default='MARKET')
    quantity = models.DecimalField(max_digits=20, decimal_places=8)
    price = models.DecimalField(max_digits=20, decimal_places=8)
    amount = models.DecimalField(max_digits=20, decimal_places=8)  # quantity * price
    
    # P&L for this specific action
    realized_pnl = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'trade_history'
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['trade', 'created_at']),
            models.Index(fields=['action', 'created_at']),
        ]


class Portfolio(models.Model):
    """Enhanced user portfolio summary"""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='portfolio')
    
    # Overall metrics
    total_value = models.DecimalField(max_digits=30, decimal_places=8, default=Decimal('0'))
    total_invested = models.DecimalField(max_digits=30, decimal_places=8, default=Decimal('0'))
    total_realized_pnl = models.DecimalField(max_digits=30, decimal_places=8, default=Decimal('0'))
    total_unrealized_pnl = models.DecimalField(max_digits=30, decimal_places=8, default=Decimal('0'))
    
    # Portfolio performance
    total_return_percentage = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal('0'))
    day_pnl = models.DecimalField(max_digits=30, decimal_places=8, default=Decimal('0'))
    day_pnl_percentage = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal('0'))
    
    # Trading metrics
    active_trades_count = models.IntegerField(default=0)
    total_trades_count = models.IntegerField(default=0)
    winning_trades_count = models.IntegerField(default=0)
    losing_trades_count = models.IntegerField(default=0)
    
    # Risk metrics
    max_drawdown = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal('0'))
    sharpe_ratio = models.DecimalField(max_digits=8, decimal_places=4, blank=True, null=True)
    
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_portfolios'

    def update_portfolio_metrics(self):
        """Update portfolio metrics from active trades"""
        active_trades = self.user.trades.filter(status__in=['OPEN', 'PARTIALLY_CLOSED'])
        all_trades = self.user.trades.all()
        
        self.active_trades_count = active_trades.count()
        self.total_trades_count = all_trades.count()
        
        # Calculate totals
        self.total_invested = sum([trade.total_invested for trade in active_trades])
        self.total_unrealized_pnl = sum([trade.unrealized_pnl for trade in active_trades])
        self.total_realized_pnl = sum([trade.realized_pnl for trade in all_trades])
        
        self.total_value = self.total_invested + self.total_unrealized_pnl
        
        # Calculate win/loss counts
        closed_trades = all_trades.filter(status='CLOSED')
        self.winning_trades_count = closed_trades.filter(realized_pnl__gt=0).count()
        self.losing_trades_count = closed_trades.filter(realized_pnl__lt=0).count()
        
        # Calculate return percentage
        if self.total_invested > 0:
            total_pnl = self.total_realized_pnl + self.total_unrealized_pnl
            self.total_return_percentage = (total_pnl / self.total_invested) * 100
        
        self.save()

    @property
    def win_rate(self):
        """Calculate win rate percentage"""
        total_closed = self.winning_trades_count + self.losing_trades_count
        if total_closed == 0:
            return Decimal('0')
        return (self.winning_trades_count / total_closed) * 100

# import uuid
# from decimal import Decimal
# from django.db import models
# from django.utils import timezone
# from django.core.validators import MinValueValidator
# from django.core.exceptions import ValidationError
# from apps.accounts.models import User

# class AssetManager(models.Manager):
#     """Custom manager for Asset model"""
    
#     def get_or_create_asset(self, symbol, asset_type, **kwargs):
#         """
#         Get existing asset or create new one with dynamic data
#         """
#         try:
#             return self.get(symbol=symbol.upper(), asset_type=asset_type), False
#         except Asset.DoesNotExist:
#             # Create new asset with default values that can be updated later
#             defaults = {
#                 'name': kwargs.get('name', symbol.upper()),
#                 'min_quantity': kwargs.get('min_quantity', Decimal('0.001')),
#                 'tick_size': kwargs.get('tick_size', Decimal('0.01')),
#                 'is_active': True,
#             }
#             asset = self.create(
#                 symbol=symbol.upper(),
#                 asset_type=asset_type,
#                 **defaults
#             )
#             return asset, True


# class Asset(models.Model):
#     """Tradeable assets (Crypto, Stocks, etc)"""
#     ASSET_TYPES = [
#         ('CRYPTO', 'Cryptocurrency'),
#         ('EQUITY', 'Equity'),
#         ('FOREX', 'Forex'),
#         ('COMMODITY', 'Commodity'),
#         ('INDEX', 'Index'),
#         ('ETF', 'ETF'),
#     ]
    
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     symbol = models.CharField(max_length=20, db_index=True)
#     name = models.CharField(max_length=100)
#     asset_type = models.CharField(max_length=20, choices=ASSET_TYPES)
#     is_active = models.BooleanField(default=True)
#     min_quantity = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0.001'))
#     tick_size = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0.01'))
#     exchange = models.CharField(max_length=50, blank=True, null=True)
#     currency = models.CharField(max_length=10, default='USD')
#     market_cap = models.DecimalField(max_digits=30, decimal_places=2, blank=True, null=True)
#     is_system_created = models.BooleanField(default=False)
#     last_price_update = models.DateTimeField(blank=True, null=True)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     objects = AssetManager()

#     class Meta:
#         db_table = 'trading_assets'
#         # Remove unique constraint on symbol alone, make it unique per type
#         unique_together = ['symbol', 'asset_type']
#         indexes = [
#             models.Index(fields=['symbol', 'asset_type']),
#             models.Index(fields=['is_active']),
#             models.Index(fields=['asset_type', 'is_active']),
#         ]

#     def clean(self):
#         """Validate asset data"""
#         self.symbol = self.symbol.upper()
#         if self.min_quantity <= 0:
#             raise ValidationError("Minimum quantity must be positive")
#         if self.tick_size <= 0:
#             raise ValidationError("Tick size must be positive")

#     def save(self, *args, **kwargs):
#         self.full_clean()
#         super().save(*args, **kwargs)

#     def __str__(self):
#         return f"{self.symbol} ({self.asset_type})"


# class Trade(models.Model):
#     """Enhanced trade model with better asset handling"""
#     TRADE_TYPES = [
#         ('SPOT', 'Spot'),
#         ('FUTURES', 'Futures'),
#         ('OPTIONS', 'Options'),
#         ('CFD', 'Contract for Difference'),
#     ]
    
#     DIRECTIONS = [
#         ('BUY', 'Buy'),
#         ('SELL', 'Sell'),
#     ]
    
#     STATUSES = [
#         ('PENDING', 'Pending'),
#         ('OPEN', 'Open'),
#         ('CLOSED', 'Closed'),
#         ('PARTIALLY_CLOSED', 'Partially Closed'),
#         ('CANCELLED', 'Cancelled'),
#     ]
    
#     HOLDING_TYPES = [
#         ('INTRADAY', 'Intraday'),
#         ('SWING', 'Swing'),
#         ('LONGTERM', 'Long Term'),
#     ]

#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='trades')
#     asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='trades')
    
#     # Trade metadata - store asset info at trade time
#     asset_symbol = models.CharField(max_length=20)  # Snapshot of symbol
#     asset_name = models.CharField(max_length=100, blank=True)  # Snapshot of name
#     asset_exchange = models.CharField(max_length=50, blank=True, null=True)
    
#     trade_type = models.CharField(max_length=10, choices=TRADE_TYPES)
#     direction = models.CharField(max_length=4, choices=DIRECTIONS)
#     status = models.CharField(max_length=20, choices=STATUSES, default='PENDING')
#     holding_type = models.CharField(max_length=10, choices=HOLDING_TYPES, default='INTRADAY')
    
#     # Position details
#     total_quantity = models.DecimalField(max_digits=20, decimal_places=8, validators=[MinValueValidator(Decimal('0'))])
#     remaining_quantity = models.DecimalField(max_digits=20, decimal_places=8)
#     average_price = models.DecimalField(max_digits=20, decimal_places=8, validators=[MinValueValidator(Decimal('0'))])
#     current_price = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    
#     # P&L
#     realized_pnl = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
#     unrealized_pnl = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
#     total_invested = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    
#     # Fees
#     entry_fee = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
#     exit_fee = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    
#     # Notes and tags
#     notes = models.TextField(blank=True)
#     tags = models.JSONField(default=list, blank=True)  # For categorization
    
#     # Timestamps
#     opened_at = models.DateTimeField(auto_now_add=True)
#     closed_at = models.DateTimeField(null=True, blank=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = 'user_trades'
#         indexes = [
#             models.Index(fields=['user', 'status']),
#             models.Index(fields=['asset', 'trade_type']),
#             models.Index(fields=['user', 'asset', 'trade_type', 'status']),
#             models.Index(fields=['user', 'opened_at']),
#             models.Index(fields=['asset_symbol', 'status']),
#         ]

#     def save(self, *args, **kwargs):
#         # Store asset snapshot data
#         if self.asset:
#             self.asset_symbol = self.asset.symbol
#             self.asset_name = self.asset.name
#             self.asset_exchange = self.asset.exchange
        
#         # Set remaining_quantity if not set
#         if self.remaining_quantity is None:
#             self.remaining_quantity = self.total_quantity
            
#         super().save(*args, **kwargs)

#     def __str__(self):
#         return f"{self.user.email} - {self.asset_symbol} {self.direction} {self.total_quantity}"

#     def calculate_unrealized_pnl(self, current_price):
#         """Calculate unrealized P&L based on current market price"""
#         if self.status in ['CLOSED', 'CANCELLED']:
#             return Decimal('0')
        
#         if self.direction == 'BUY':
#             self.unrealized_pnl = (current_price - self.average_price) * self.remaining_quantity
#         else:  # SELL (for futures short positions)
#             self.unrealized_pnl = (self.average_price - current_price) * self.remaining_quantity
        
#         self.current_price = current_price
#         self.save(update_fields=['unrealized_pnl', 'current_price', 'updated_at'])
#         return self.unrealized_pnl

#     @property
#     def total_pnl(self):
#         """Total P&L including both realized and unrealized"""
#         return self.realized_pnl + self.unrealized_pnl

#     @property
#     def pnl_percentage(self):
#         """P&L as percentage of invested amount"""
#         if self.total_invested == 0:
#             return Decimal('0')
#         return (self.total_pnl / self.total_invested) * 100


# class FuturesDetails(models.Model):
#     """Additional details for futures trades"""
#     trade = models.OneToOneField(Trade, on_delete=models.CASCADE, related_name='futures_details')
#     leverage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('1'))
#     margin_required = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
#     margin_used = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    
#     expiry_date = models.DateField()
#     contract_size = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('1'))
#     is_hedged = models.BooleanField(default=False)
    
#     # Funding and fees
#     daily_funding_rate = models.DecimalField(max_digits=10, decimal_places=6, default=Decimal('0'))
#     total_funding_paid = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))

#     class Meta:
#         db_table = 'futures_details'


# class OptionsDetails(models.Model):
#     """Additional details for options trades"""
#     OPTION_TYPES = [
#         ('CALL', 'Call'),
#         ('PUT', 'Put'),
#     ]
    
#     POSITIONS = [
#         ('LONG', 'Long'),   # Buying options
#         ('SHORT', 'Short'), # Writing/Selling options
#     ]

#     trade = models.OneToOneField(Trade, on_delete=models.CASCADE, related_name='options_details')
#     option_type = models.CharField(max_length=4, choices=OPTION_TYPES)
#     position = models.CharField(max_length=5, choices=POSITIONS)
#     strike_price = models.DecimalField(max_digits=20, decimal_places=8)
#     expiry_date = models.DateField()
#     premium = models.DecimalField(max_digits=20, decimal_places=8)
    
#     # Greeks (can be updated periodically)
#     delta = models.DecimalField(max_digits=8, decimal_places=6, blank=True, null=True)
#     gamma = models.DecimalField(max_digits=8, decimal_places=6, blank=True, null=True)
#     theta = models.DecimalField(max_digits=8, decimal_places=6, blank=True, null=True)
#     vega = models.DecimalField(max_digits=8, decimal_places=6, blank=True, null=True)
    
#     implied_volatility = models.DecimalField(max_digits=8, decimal_places=4, blank=True, null=True)

#     class Meta:
#         db_table = 'options_details'


# class TradeHistory(models.Model):
#     """History of all trade actions (buy/sell orders)"""
#     ORDER_TYPES = [
#         ('MARKET', 'Market'),
#         ('LIMIT', 'Limit'),
#         ('STOP', 'Stop Loss'),
#         ('STOP_LIMIT', 'Stop Limit'),
#     ]
    
#     ACTIONS = [
#         ('BUY', 'Buy'),
#         ('SELL', 'Sell'),
#         ('PARTIAL_SELL', 'Partial Sell'),
#         ('CANCEL', 'Cancel'),
#         ('MODIFY', 'Modify'),
#     ]

#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     trade = models.ForeignKey(Trade, on_delete=models.CASCADE, related_name='history')
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     asset = models.ForeignKey(Asset, on_delete=models.CASCADE)
    
#     action = models.CharField(max_length=15, choices=ACTIONS)
#     order_type = models.CharField(max_length=15, choices=ORDER_TYPES, default='MARKET')
#     quantity = models.DecimalField(max_digits=20, decimal_places=8)
#     price = models.DecimalField(max_digits=20, decimal_places=8)
#     amount = models.DecimalField(max_digits=20, decimal_places=8)  # quantity * price
    
#     # Fees
#     fee_amount = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
#     fee_currency = models.CharField(max_length=10, default='USD')
    
#     # P&L for this specific action
#     realized_pnl = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    
#     # Market data at time of execution
#     bid_price = models.DecimalField(max_digits=20, decimal_places=8, blank=True, null=True)
#     ask_price = models.DecimalField(max_digits=20, decimal_places=8, blank=True, null=True)
    
#     created_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         db_table = 'trade_history'
#         indexes = [
#             models.Index(fields=['user', 'created_at']),
#             models.Index(fields=['trade', 'created_at']),
#             models.Index(fields=['action', 'created_at']),
#         ]


# class Portfolio(models.Model):
#     """Enhanced user portfolio summary"""
#     user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='portfolio')
    
#     # Overall metrics
#     total_value = models.DecimalField(max_digits=30, decimal_places=8, default=Decimal('0'))
#     total_invested = models.DecimalField(max_digits=30, decimal_places=8, default=Decimal('0'))
#     total_realized_pnl = models.DecimalField(max_digits=30, decimal_places=8, default=Decimal('0'))
#     total_unrealized_pnl = models.DecimalField(max_digits=30, decimal_places=8, default=Decimal('0'))
    
#     # Portfolio performance
#     total_return_percentage = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal('0'))
#     day_pnl = models.DecimalField(max_digits=30, decimal_places=8, default=Decimal('0'))
#     day_pnl_percentage = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal('0'))
    
#     # Trading metrics
#     active_trades_count = models.IntegerField(default=0)
#     total_trades_count = models.IntegerField(default=0)
#     winning_trades_count = models.IntegerField(default=0)
#     losing_trades_count = models.IntegerField(default=0)
    
#     # Risk metrics
#     max_drawdown = models.DecimalField(max_digits=10, decimal_places=4, default=Decimal('0'))
#     sharpe_ratio = models.DecimalField(max_digits=8, decimal_places=4, blank=True, null=True)
    
#     last_updated = models.DateTimeField(auto_now=True)
#     created_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         db_table = 'user_portfolios'

#     def update_portfolio_metrics(self):
#         """Update portfolio metrics from active trades"""
#         active_trades = self.user.trades.filter(status__in=['OPEN', 'PARTIALLY_CLOSED'])
#         all_trades = self.user.trades.all()
        
#         self.active_trades_count = active_trades.count()
#         self.total_trades_count = all_trades.count()
        
#         # Calculate totals
#         self.total_invested = sum([trade.total_invested for trade in active_trades])
#         self.total_unrealized_pnl = sum([trade.unrealized_pnl for trade in active_trades])
#         self.total_realized_pnl = sum([trade.realized_pnl for trade in all_trades])
        
#         self.total_value = self.total_invested + self.total_unrealized_pnl
        
#         # Calculate win/loss counts
#         closed_trades = all_trades.filter(status='CLOSED')
#         self.winning_trades_count = closed_trades.filter(realized_pnl__gt=0).count()
#         self.losing_trades_count = closed_trades.filter(realized_pnl__lt=0).count()
        
#         # Calculate return percentage
#         if self.total_invested > 0:
#             total_pnl = self.total_realized_pnl + self.total_unrealized_pnl
#             self.total_return_percentage = (total_pnl / self.total_invested) * 100
        
#         self.save()

#     @property
#     def win_rate(self):
#         """Calculate win rate percentage"""
#         total_closed = self.winning_trades_count + self.losing_trades_count
#         if total_closed == 0:
#             return Decimal('0')
#         return (self.winning_trades_count / total_closed) * 100
