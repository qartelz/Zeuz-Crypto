
# # ==================== FILE: apps/challenges/models/trade_models.py ====================

# import uuid
# from decimal import Decimal
# from django.db import models, transaction
# from django.utils import timezone
# from apps.accounts.models import User


# class ChallengeTrade(models.Model):
#     """Challenge-specific trade model"""
#     TRADE_TYPES = [('SPOT', 'Spot'), ('FUTURES', 'Futures'), ('OPTIONS', 'Options')]
#     DIRECTIONS = [('BUY', 'Buy'), ('SELL', 'Sell')]
#     STATUSES = [('OPEN', 'Open'), ('CLOSED', 'Closed'), ('PARTIALLY_CLOSED', 'Partially Closed')]
    
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenge_trades')
#     participation = models.ForeignKey('UserChallengeParticipation', on_delete=models.CASCADE, related_name='trades')
#     wallet = models.ForeignKey('ChallengeWallet', on_delete=models.CASCADE, related_name='trades')
    
#     asset_symbol = models.CharField(max_length=20)
#     asset_name = models.CharField(max_length=100, blank=True)
#     trade_type = models.CharField(max_length=10, choices=TRADE_TYPES)
#     direction = models.CharField(max_length=4, choices=DIRECTIONS)
#     status = models.CharField(max_length=20, choices=STATUSES, default='OPEN')
#     holding_type = models.CharField(max_length=10, default='INTRADAY')
    
#     total_quantity = models.DecimalField(max_digits=20, decimal_places=8)
#     remaining_quantity = models.DecimalField(max_digits=20, decimal_places=8)
#     average_entry_price = models.DecimalField(max_digits=20, decimal_places=8)
#     current_price = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
#     total_invested = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
    
#     realized_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
#     unrealized_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
#     allocation_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    
#     opened_at = models.DateTimeField(auto_now_add=True)
#     closed_at = models.DateTimeField(null=True, blank=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         db_table = 'challenge_trades'
#         indexes = [
#             models.Index(fields=['user', 'status']),
#             models.Index(fields=['participation', 'status']),
#             models.Index(fields=['asset_symbol', 'trade_type']),
#         ]
    
#     def __str__(self):
#         return f"{self.user.email} - {self.asset_symbol} {self.direction}"
    
#     def save(self, *args, **kwargs):
#         if self.remaining_quantity is None:
#             self.remaining_quantity = self.total_quantity
        
#         if not self.total_invested or self.total_invested == 0:
#             self.total_invested = self.total_quantity * self.average_entry_price
        
#         if self.wallet and self.total_invested:
#             self.allocation_percentage = (self.total_invested / self.wallet.initial_balance) * 100
        
#         super().save(*args, **kwargs)
    
#     @property
#     def total_pnl(self):
#         return self.realized_pnl + self.unrealized_pnl
    
#     @property
#     def pnl_percentage(self):
#         if self.total_invested == 0:
#             return Decimal('0')
#         return (self.total_pnl / self.total_invested) * 100
    
#     @property
#     def is_profitable(self):
#         return self.total_pnl > 0
    
#     def calculate_unrealized_pnl(self, current_price):
#         if self.status == 'CLOSED':
#             return Decimal('0')
        
#         if self.direction == 'BUY':
#             pnl = (current_price - self.average_entry_price) * self.remaining_quantity
#         else:
#             pnl = (self.average_entry_price - current_price) * self.remaining_quantity
        
#         self.unrealized_pnl = pnl
#         self.current_price = current_price
#         self.save(update_fields=['unrealized_pnl', 'current_price', 'updated_at'])
#         return self.unrealized_pnl
    
#     def close_trade(self, exit_price, exit_quantity=None):
#         if exit_quantity is None:
#             exit_quantity = self.remaining_quantity
        
#         if exit_quantity > self.remaining_quantity:
#             raise ValueError(f"Cannot close more than remaining quantity")
        
#         if self.direction == 'BUY':
#             pnl = (exit_price - self.average_entry_price) * exit_quantity
#         else:
#             pnl = (self.average_entry_price - exit_price) * exit_quantity
        
#         self.remaining_quantity -= exit_quantity
#         self.realized_pnl += pnl
        
#         if self.remaining_quantity == 0:
#             self.status = 'CLOSED'
#             self.closed_at = timezone.now()
#         else:
#             self.status = 'PARTIALLY_CLOSED'
        
#         self.save()
#         return pnl


# class ChallengeFuturesDetails(models.Model):
#     """Futures-specific details"""
#     trade = models.OneToOneField(ChallengeTrade, on_delete=models.CASCADE, related_name='futures_details')
#     leverage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('1'))
#     margin_required = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
#     expiry_date = models.DateField()
#     contract_size = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('1'))
    
#     class Meta:
#         db_table = 'challenge_futures_details'


# class ChallengeOptionsDetails(models.Model):
#     """Options-specific details"""
#     OPTION_TYPES = [('CALL', 'Call'), ('PUT', 'Put')]
#     POSITIONS = [('LONG', 'Long'), ('SHORT', 'Short')]
    
#     trade = models.OneToOneField(ChallengeTrade, on_delete=models.CASCADE, related_name='options_details')
#     option_type = models.CharField(max_length=4, choices=OPTION_TYPES)
#     position = models.CharField(max_length=5, choices=POSITIONS)
#     strike_price = models.DecimalField(max_digits=20, decimal_places=8)
#     expiry_date = models.DateField()
#     premium = models.DecimalField(max_digits=20, decimal_places=8)
    
#     class Meta:
#         db_table = 'challenge_options_details'


# class ChallengeTradeHistory(models.Model):
#     """Trade action history"""
#     ACTIONS = [('BUY', 'Buy'), ('SELL', 'Sell'), ('PARTIAL_SELL', 'Partial Sell'), ('CANCEL', 'Cancel'), ('MODIFY', 'Modify')]
    
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     trade = models.ForeignKey(ChallengeTrade, on_delete=models.CASCADE, related_name='history')
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
#     action = models.CharField(max_length=15, choices=ACTIONS)
#     order_type = models.CharField(max_length=15, default='MARKET')
#     quantity = models.DecimalField(max_digits=20, decimal_places=8)
#     price = models.DecimalField(max_digits=20, decimal_places=8)
#     amount = models.DecimalField(max_digits=20, decimal_places=2)
#     realized_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
#     created_at = models.DateTimeField(auto_now_add=True)
    
#     class Meta:
#         db_table = 'challenge_trade_history'
#         ordering = ['-created_at']
#         indexes = [
#             models.Index(fields=['trade', 'created_at']),
#             models.Index(fields=['user', 'created_at']),
#         ]

