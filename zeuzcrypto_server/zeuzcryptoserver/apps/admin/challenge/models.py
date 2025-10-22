# import uuid
# from decimal import Decimal
# from django.db import models
# from django.core.validators import MinValueValidator, MaxValueValidator
# from django.utils import timezone
# from django.db import transaction


# # ============================================================================
# # CHALLENGE WALLET MODELS
# # ============================================================================

# class ChallengeWallet(models.Model):
#     """Isolated wallet for each challenge participation"""
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='challenge_wallets')
#     participation = models.OneToOneField(
#         'UserChallengeParticipation', 
#         on_delete=models.CASCADE, 
#         related_name='wallet'
#     )
    
#     # Balance tracking
#     initial_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('10000.00'))
#     available_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('10000.00'))
#     locked_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
#     earned_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
#     is_active = models.BooleanField(default=True)
    
#     class Meta:
#         db_table = 'challenge_wallets'
#         indexes = [
#             models.Index(fields=['user', 'participation']),
#             models.Index(fields=['user', 'is_active']),
#         ]
#         unique_together = [['user', 'participation']]
    
#     def __str__(self):
#         return f"{self.user.email} - {self.total_balance} coins"
    
#     @property
#     def total_balance(self):
#         return self.available_balance + self.locked_balance + self.earned_balance
    
#     def check_sufficient_balance(self, amount):
#         return self.available_balance >= amount
    
#     @transaction.atomic
#     def lock_coins(self, amount, description="Trade entry"):
#         if not self.check_sufficient_balance(amount):
#             raise ValueError(f"Insufficient balance. Available: {self.available_balance}, Required: {amount}")
        
#         balance_before = self.available_balance
#         self.available_balance -= amount
#         self.locked_balance += amount
#         self.save(update_fields=['available_balance', 'locked_balance', 'updated_at'])
        
#         ChallengeWalletTransaction.objects.create(
#             wallet=self, transaction_type='TRADE_LOCK', amount=amount,
#             balance_before=balance_before, balance_after=self.available_balance,
#             description=description
#         )
#         return True
    
#     @transaction.atomic
#     def unlock_coins(self, amount, description="Trade exit"):
#         if self.locked_balance < amount:
#             raise ValueError(f"Cannot unlock more than locked balance")
        
#         balance_before = self.available_balance
#         self.locked_balance -= amount
#         self.available_balance += amount
#         self.save(update_fields=['available_balance', 'locked_balance', 'updated_at'])
        
#         ChallengeWalletTransaction.objects.create(
#             wallet=self, transaction_type='TRADE_UNLOCK', amount=amount,
#             balance_before=balance_before, balance_after=self.available_balance,
#             description=description
#         )
#         return True
    
#     @transaction.atomic
#     def add_profit(self, profit_amount, description="Trade profit"):
#         balance_before = self.earned_balance
#         self.earned_balance += profit_amount
#         self.available_balance += profit_amount
#         self.save(update_fields=['earned_balance', 'available_balance', 'updated_at'])
        
#         ChallengeWalletTransaction.objects.create(
#             wallet=self, transaction_type='PROFIT_ADD', amount=profit_amount,
#             balance_before=balance_before, balance_after=self.earned_balance,
#             description=description
#         )
#         return True
    
#     @transaction.atomic
#     def deduct_loss(self, loss_amount, description="Trade loss"):
#         balance_before = self.earned_balance
#         self.earned_balance -= loss_amount
#         self.save(update_fields=['earned_balance', 'updated_at'])
        
#         ChallengeWalletTransaction.objects.create(
#             wallet=self, transaction_type='LOSS_DEDUCT', amount=loss_amount,
#             balance_before=balance_before, balance_after=self.earned_balance,
#             description=description
#         )
#         return True


# class ChallengeWalletTransaction(models.Model):
#     """Audit trail for wallet transactions"""
#     TRANSACTION_TYPES = [
#         ('INITIAL_DEPOSIT', 'Initial Deposit'),
#         ('TRADE_LOCK', 'Trade Lock'),
#         ('TRADE_UNLOCK', 'Trade Unlock'),
#         ('PROFIT_ADD', 'Profit Added'),
#         ('LOSS_DEDUCT', 'Loss Deducted'),
#         ('REWARD_BONUS', 'Reward Bonus'),
#         ('RESET', 'Wallet Reset'),
#     ]
    
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     wallet = models.ForeignKey(ChallengeWallet, on_delete=models.CASCADE, related_name='transactions')
#     transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
#     amount = models.DecimalField(max_digits=15, decimal_places=2)
#     balance_before = models.DecimalField(max_digits=15, decimal_places=2)
#     balance_after = models.DecimalField(max_digits=15, decimal_places=2)
#     description = models.CharField(max_length=255)
#     trade = models.ForeignKey('ChallengeTrade', on_delete=models.SET_NULL, null=True, blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)
    
#     class Meta:
#         db_table = 'challenge_wallet_transactions'
#         ordering = ['-created_at']
#         indexes = [
#             models.Index(fields=['wallet', 'created_at']),
#             models.Index(fields=['transaction_type', 'created_at']),
#         ]


# # ============================================================================
# # CHALLENGE TRADE MODELS
# # ============================================================================

# class ChallengeTrade(models.Model):
#     """Challenge-specific trade model"""
#     TRADE_TYPES = [('SPOT', 'Spot'), ('FUTURES', 'Futures'), ('OPTIONS', 'Options')]
#     DIRECTIONS = [('BUY', 'Buy'), ('SELL', 'Sell')]
#     STATUSES = [('OPEN', 'Open'), ('CLOSED', 'Closed'), ('PARTIALLY_CLOSED', 'Partially Closed')]
    
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='challenge_trades')
#     participation = models.ForeignKey('UserChallengeParticipation', on_delete=models.CASCADE, related_name='trades')
#     wallet = models.ForeignKey(ChallengeWallet, on_delete=models.CASCADE, related_name='trades')
#     challenge_week = models.ForeignKey('ChallengeWeek', on_delete=models.CASCADE, related_name='trades')
    
#     # Asset details
#     asset_symbol = models.CharField(max_length=20)
#     asset_name = models.CharField(max_length=100, blank=True)
    
#     # Trade details
#     trade_type = models.CharField(max_length=10, choices=TRADE_TYPES)
#     direction = models.CharField(max_length=4, choices=DIRECTIONS)
#     status = models.CharField(max_length=20, choices=STATUSES, default='OPEN')
    
#     # Position details
#     total_quantity = models.DecimalField(max_digits=20, decimal_places=8)
#     remaining_quantity = models.DecimalField(max_digits=20, decimal_places=8)
#     average_entry_price = models.DecimalField(max_digits=20, decimal_places=8)
#     current_price = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
#     entry_amount = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    
#     # Exit details
#     exit_price = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    
#     # P&L tracking
#     realized_pnl = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
#     unrealized_pnl = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    
#     # Capital allocation
#     allocation_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    
#     # Timestamps
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
        
#         if not self.entry_amount or self.entry_amount == 0:
#             self.entry_amount = self.total_quantity * self.average_entry_price
        
#         if self.wallet and self.entry_amount:
#             self.allocation_percentage = (self.entry_amount / self.wallet.initial_balance) * 100
        
#         super().save(*args, **kwargs)
    
#     @property
#     def total_pnl(self):
#         return self.realized_pnl + self.unrealized_pnl
    
#     @property
#     def holding_duration_hours(self):
#         if self.closed_at:
#             duration = self.closed_at - self.opened_at
#         else:
#             duration = timezone.now() - self.opened_at
#         return duration.total_seconds() / 3600
    
#     def calculate_unrealized_pnl(self, current_price):
#         """Update unrealized P&L"""
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
    
#     @transaction.atomic
#     def close_position(self, exit_price, exit_quantity):
#         """Close trade (full or partial)"""
#         if exit_quantity > self.remaining_quantity:
#             raise ValueError(f"Cannot close more than remaining quantity")
        
#         # Calculate P&L
#         if self.direction == 'BUY':
#             pnl = (exit_price - self.average_entry_price) * exit_quantity
#         else:
#             pnl = (self.average_entry_price - exit_price) * exit_quantity
        
#         # Update trade
#         self.remaining_quantity -= exit_quantity
#         self.realized_pnl += pnl
#         self.exit_price = exit_price
        
#         if self.remaining_quantity == 0:
#             self.status = 'CLOSED'
#             self.closed_at = timezone.now()
#         else:
#             self.status = 'PARTIALLY_CLOSED'
        
#         self.save(update_fields=['remaining_quantity', 'realized_pnl', 'exit_price', 'status', 'closed_at', 'updated_at'])
        
#         # Update wallet
#         locked_amount = exit_quantity * self.average_entry_price
#         self.wallet.unlock_coins(locked_amount, description=f"Close {self.asset_symbol}")
        
#         if pnl > 0:
#             self.wallet.add_profit(pnl, description=f"Profit from {self.asset_symbol}")
#         else:
#             self.wallet.deduct_loss(abs(pnl), description=f"Loss from {self.asset_symbol}")
        
#         # Create history
#         ChallengeTradeHistory.objects.create(
#             trade=self,
#             user=self.user,
#             action='SELL' if self.direction == 'BUY' else 'BUY',
#             quantity=exit_quantity,
#             price=exit_price,
#             amount=exit_quantity * exit_price,
#             realized_pnl=pnl
#         )
        
#         return pnl


# class ChallengeFuturesDetails(models.Model):
#     """Futures-specific details"""
#     trade = models.OneToOneField(ChallengeTrade, on_delete=models.CASCADE, related_name='futures_details')
#     leverage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('1'))
#     margin_required = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
#     expiry_date = models.DateField()
    
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
#     ACTIONS = [('BUY', 'Buy'), ('SELL', 'Sell'), ('PARTIAL_SELL', 'Partial Sell')]
    
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     trade = models.ForeignKey(ChallengeTrade, on_delete=models.CASCADE, related_name='history')
#     user = models.ForeignKey('User', on_delete=models.CASCADE)
#     action = models.CharField(max_length=15, choices=ACTIONS)
#     quantity = models.DecimalField(max_digits=20, decimal_places=8)
#     price = models.DecimalField(max_digits=20, decimal_places=8)
#     amount = models.DecimalField(max_digits=20, decimal_places=8)
#     realized_pnl = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
#     created_at = models.DateTimeField(auto_now_add=True)
    
#     class Meta:
#         db_table = 'challenge_trade_history'
#         ordering = ['-created_at']


# # ============================================================================
# # ANALYTICS & SCORING
# # ============================================================================

# class ChallengeTradeAnalytics(models.Model):
#     """Aggregated analytics"""
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     participation = models.OneToOneField('UserChallengeParticipation', on_delete=models.CASCADE, related_name='analytics')
#     user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='challenge_analytics')
    
#     # Trade stats
#     total_trades = models.IntegerField(default=0)
#     open_trades = models.IntegerField(default=0)
#     closed_trades = models.IntegerField(default=0)
#     profitable_trades = models.IntegerField(default=0)
#     losing_trades = models.IntegerField(default=0)
    
#     # Trade types
#     spot_trades = models.IntegerField(default=0)
#     futures_trades = models.IntegerField(default=0)
#     options_trades = models.IntegerField(default=0)
    
#     # P&L metrics
#     total_realized_pnl = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
#     total_unrealized_pnl = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
#     win_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
#     profit_factor = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    
#     # Portfolio metrics
#     initial_portfolio_value = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'))
#     current_portfolio_value = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0'))
#     portfolio_return_percentage = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    
#     # Capital allocation
#     average_allocation_per_trade = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
#     max_allocation_per_trade = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    
#     # Scores (0-10)
#     pnl_score = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('0'))
#     money_management_score = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('0'))
#     capital_allocation_score = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('0'))
#     total_score = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('0'))
#     behavioral_tag = models.CharField(max_length=50, blank=True)
    
#     last_calculated_at = models.DateTimeField(auto_now=True)
#     created_at = models.DateTimeField(auto_now_add=True)
    
#     class Meta:
#         db_table = 'challenge_trade_analytics'
#         indexes = [
#             models.Index(fields=['user', 'participation']),
#             models.Index(fields=['-total_score']),
#         ]


# class ChallengeLeaderboard(models.Model):
#     """Cached leaderboard"""
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     challenge_week = models.ForeignKey('ChallengeWeek', on_delete=models.CASCADE, related_name='leaderboard_entries')
#     participation = models.ForeignKey('UserChallengeParticipation', on_delete=models.CASCADE)
#     user = models.ForeignKey('User', on_delete=models.CASCADE)
    
#     rank = models.IntegerField()
#     total_score = models.DecimalField(max_digits=4, decimal_places=2)
#     portfolio_return_percentage = models.DecimalField(max_digits=10, decimal_places=2)
#     total_trades = models.IntegerField()
#     win_rate = models.DecimalField(max_digits=5, decimal_places=2)
#     behavioral_tag = models.CharField(max_length=50)
#     user_display_name = models.CharField(max_length=100)
    
#     last_updated = models.DateTimeField(auto_now=True)
#     created_at = models.DateTimeField(auto_now_add=True)
    
#     class Meta:
#         db_table = 'challenge_leaderboard'
#         ordering = ['rank']
#         unique_together = [['challenge_week', 'participation']]


# # ============================================================================
# # REWARD DISTRIBUTION
# # ============================================================================

# class ChallengeRewardDistribution(models.Model):
#     """Reward distribution to main wallet"""
#     REWARD_TYPES = [
#         ('COMPLETION_BONUS', 'Completion Bonus'),
#         ('PROFIT_BONUS', 'Profit Bonus'),
#         ('LEADERBOARD_PRIZE', 'Leaderboard Prize'),
#     ]
#     STATUS_CHOICES = [('PENDING', 'Pending'), ('COMPLETED', 'Completed'), ('FAILED', 'Failed')]
    
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='challenge_rewards')
#     participation = models.ForeignKey('UserChallengeParticipation', on_delete=models.CASCADE)
#     reward_type = models.CharField(max_length=20, choices=REWARD_TYPES)
#     coin_amount = models.DecimalField(max_digits=15, decimal_places=2)
#     description = models.TextField()
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
#     wallet_transaction = models.ForeignKey('WalletTransaction', on_delete=models.SET_NULL, null=True, blank=True)
#     processed_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_rewards')
#     error_message = models.TextField(blank=True)
    
#     created_at = models.DateTimeField(auto_now_add=True)
#     processed_at = models.DateTimeField(null=True, blank=True)
    
#     class Meta:
#         db_table = 'challenge_reward_distributions'
#         ordering = ['-created_at']
    
#     @transaction.atomic
#     def process_reward(self, processed_by=None):
#         """Add reward to main wallet"""
#         if self.status != 'PENDING':
#             raise ValueError(f"Cannot process reward with status: {self.status}")
        
#         try:
#             from apps.accounts.models import UserWallet, WalletTransaction
            
#             wallet, _ = UserWallet.objects.get_or_create(user=self.user)
#             balance_before = wallet.balance
#             wallet.balance += self.coin_amount
#             wallet.save(update_fields=['balance'])
            
#             wallet_txn = WalletTransaction.objects.create(
#                 user=self.user,
#                 amount=self.coin_amount,
#                 transaction_type='CREDIT',
#                 description=f"Challenge Reward: {self.description}",
#                 balance_before=balance_before,
#                 balance_after=wallet.balance
#             )
            
#             self.wallet_transaction = wallet_txn
#             self.status = 'COMPLETED'
#             self.processed_by = processed_by
#             self.processed_at = timezone.now()
#             self.save()
            
#             return True
#         except Exception as e:
#             self.status = 'FAILED'
#             self.error_message = str(e)
#             self.save()
#             raise

# # ==================== CHALLENGE WALLET MODELS ====================

# import uuid
# from decimal import Decimal
# from django.db import models
# from django.utils import timezone
# from django.core.validators import MinValueValidator
# from apps.accounts.models import User


# class ChallengeWallet(models.Model):
#     """
#     Wallet for each challenge participation.
#     Users receive virtual coins to trade within a specific challenge.
#     All trading is done with these challenge coins only.
#     """
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenge_wallets')
#     participation = models.OneToOneField(
#         'ChallengeParticipation',  # Reference from challenges app
#         on_delete=models.CASCADE,
#         related_name='wallet'
#     )
    
#     # Wallet balance tracking
#     initial_balance = models.DecimalField(
#         max_digits=20,
#         decimal_places=2,
#         validators=[MinValueValidator(Decimal('0'))],
#         help_text="Initial coins allocated for this challenge"
#     )
    
#     available_balance = models.DecimalField(
#         max_digits=20,
#         decimal_places=2,
#         validators=[MinValueValidator(Decimal('0'))],
#         default=Decimal('0'),
#         help_text="Coins available for trading (initial - locked in open positions)"
#     )
    
#     locked_balance = models.DecimalField(
#         max_digits=20,
#         decimal_places=2,
#         default=Decimal('0'),
#         help_text="Coins locked in open/pending trades"
#     )
    
#     earned_balance = models.DecimalField(
#         max_digits=20,
#         decimal_places=2,
#         default=Decimal('0'),
#         help_text="Profit earned from successful trades"
#     )
    
#     # Status
#     is_active = models.BooleanField(default=True)
    
#     # Timestamps
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         db_table = 'challenge_wallets'
#         indexes = [
#             models.Index(fields=['user', 'participation']),
#             models.Index(fields=['is_active']),
#         ]
    
#     def __str__(self):
#         return f"{self.user.email} - Challenge Wallet"
    
#     @property
#     def total_balance(self):
#         """Total wallet balance (available + locked + earned)"""
#         return self.available_balance + self.locked_balance + self.earned_balance
    
#     @property
#     def current_balance(self):
#         """Current spendable balance (available + earned)"""
#         return self.available_balance + self.earned_balance
    
#     def check_sufficient_balance(self, amount):
#         """Check if wallet has sufficient coins for a trade"""
#         return self.available_balance >= amount
    
#     def lock_coins(self, amount):
#         """Lock coins when opening a position"""
#         if amount > self.available_balance:
#             raise ValueError(f"Insufficient available balance. Available: {self.available_balance}, Required: {amount}")
        
#         self.available_balance -= amount
#         self.locked_balance += amount
#         self.save()
    
#     def unlock_coins(self, amount):
#         """Unlock coins when position is closed"""
#         if amount > self.locked_balance:
#             raise ValueError(f"Cannot unlock more than locked. Locked: {self.locked_balance}, Requested: {amount}")
        
#         self.locked_balance -= amount
#         self.available_balance += amount
#         self.save()
    
#     def add_profit(self, profit_amount):
#         """Add profit to earned balance"""
#         self.earned_balance += profit_amount
#         self.save()
    
#     def deduct_loss(self, loss_amount):
#         """Deduct loss from earned balance or available balance"""
#         if self.earned_balance >= loss_amount:
#             self.earned_balance -= loss_amount
#         else:
#             remaining_loss = loss_amount - self.earned_balance
#             self.earned_balance = Decimal('0')
#             self.available_balance -= remaining_loss
        
#         self.save()
    
#     def reset_wallet(self):
#         """Reset wallet to initial state (used for challenge restart)"""
#         self.available_balance = self.initial_balance
#         self.locked_balance = Decimal('0')
#         self.earned_balance = Decimal('0')
#         self.save()


# class ChallengeWalletTransaction(models.Model):
#     """
#     Log of all wallet transactions for audit trail and analytics.
#     """
#     TRANSACTION_TYPES = [
#         ('INITIAL_DEPOSIT', 'Initial Deposit'),
#         ('TRADE_LOCK', 'Trade Lock'),
#         ('TRADE_UNLOCK', 'Trade Unlock'),
#         ('PROFIT_ADD', 'Profit Added'),
#         ('LOSS_DEDUCT', 'Loss Deducted'),
#         ('REFUND', 'Refund'),
#         ('RESET', 'Reset'),
#         ('REWARD_BONUS', 'Reward Bonus'),
#     ]
    
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     wallet = models.ForeignKey(
#         ChallengeWallet,
#         on_delete=models.CASCADE,
#         related_name='transactions'
#     )
    
#     transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
#     amount = models.DecimalField(max_digits=20, decimal_places=2)
    
#     # Balance before and after
#     balance_before = models.DecimalField(max_digits=20, decimal_places=2)
#     balance_after = models.DecimalField(max_digits=20, decimal_places=2)
    
#     # Reference to related trade (if applicable)
#     trade = models.ForeignKey(
#         'ChallengeTrade',
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name='wallet_transactions'
#     )
    
#     description = models.TextField(blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)
    
#     class Meta:
#         db_table = 'challenge_wallet_transactions'
#         indexes = [
#             models.Index(fields=['wallet', 'created_at']),
#             models.Index(fields=['transaction_type', 'created_at']),
#         ]
#         ordering = ['-created_at']
    
#     def __str__(self):
#         return f"{self.wallet.user.email} - {self.transaction_type}"


# # ==================== CHALLENGE TRADE DATA MODELS ====================

# class ChallengeTrade(models.Model):
#     """
#     Trades executed within a challenge using challenge wallet coins.
#     Separate from main Trade model to isolate challenge trading data.
#     """
#     TRADE_TYPES = [
#         ('SPOT', 'Spot'),
#         ('FUTURES', 'Futures'),
#         ('OPTIONS', 'Options'),
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
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenge_trades')
#     participation = models.ForeignKey(
#         'ChallengeParticipation',
#         on_delete=models.CASCADE,
#         related_name='trades'
#     )
#     wallet = models.ForeignKey(
#         ChallengeWallet,
#         on_delete=models.CASCADE,
#         related_name='trades'
#     )
    
#     # Asset information
#     asset_symbol = models.CharField(max_length=20)
#     asset_name = models.CharField(max_length=100, blank=True)
#     asset_exchange = models.CharField(max_length=50, blank=True, null=True)
    
#     # Trade type and direction
#     trade_type = models.CharField(max_length=10, choices=TRADE_TYPES)
#     direction = models.CharField(max_length=4, choices=DIRECTIONS)
#     status = models.CharField(max_length=20, choices=STATUSES, default='PENDING')
#     holding_type = models.CharField(max_length=10, choices=HOLDING_TYPES, default='INTRADAY')
    
#     # Position details
#     total_quantity = models.DecimalField(
#         max_digits=20,
#         decimal_places=8,
#         validators=[MinValueValidator(Decimal('0'))]
#     )
#     remaining_quantity = models.DecimalField(max_digits=20, decimal_places=8)
#     average_entry_price = models.DecimalField(
#         max_digits=20,
#         decimal_places=8,
#         validators=[MinValueValidator(Decimal('0'))]
#     )
#     current_price = models.DecimalField(
#         max_digits=20,
#         decimal_places=8,
#         null=True,
#         blank=True
#     )
    
#     # Cost and P&L
#     total_invested = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
#     realized_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
#     unrealized_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
    
#     # Commission and fees
#     entry_commission = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
#     exit_commission = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
    
#     # Allocation info for scoring
#     allocation_percentage = models.DecimalField(
#         max_digits=5,
#         decimal_places=2,
#         default=Decimal('0'),
#         help_text="Percentage of wallet used for this trade (0-100)"
#     )
    
#     # Timestamps
#     opened_at = models.DateTimeField(auto_now_add=True)
#     closed_at = models.DateTimeField(null=True, blank=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         db_table = 'challenge_trades'
#         indexes = [
#             models.Index(fields=['user', 'participation']),
#             models.Index(fields=['participation', 'status']),
#             models.Index(fields=['asset_symbol', 'trade_type']),
#             models.Index(fields=['opened_at', 'closed_at']),
#         ]
    
#     def __str__(self):
#         return f"{self.user.email} - {self.asset_symbol} {self.direction} {self.total_quantity}"
    
#     def save(self, *args, **kwargs):
#         if self.remaining_quantity is None:
#             self.remaining_quantity = self.total_quantity
        
#         # Calculate allocation percentage
#         if self.wallet and self.wallet.initial_balance > 0 and self.status != 'CLOSED':
#             self.allocation_percentage = (self.total_invested / self.wallet.initial_balance) * 100
        
#         super().save(*args, **kwargs)
    
#     @property
#     def total_pnl(self):
#         """Total P&L including realized and unrealized"""
#         return self.realized_pnl + self.unrealized_pnl
    
#     @property
#     def net_pnl(self):
#         """Net P&L after commissions"""
#         return self.total_pnl - self.entry_commission - self.exit_commission
    
#     @property
#     def pnl_percentage(self):
#         """P&L as percentage"""
#         if self.total_invested == 0:
#             return Decimal('0')
#         return (self.total_pnl / self.total_invested) * 100
    
#     @property
#     def is_profitable(self):
#         """Check if trade is profitable"""
#         return self.net_pnl > 0
    
#     def calculate_unrealized_pnl(self, current_price):
#         """Calculate unrealized P&L based on current market price"""
#         if self.status in ['CLOSED', 'CANCELLED']:
#             return Decimal('0')
        
#         if self.direction == 'BUY':
#             self.unrealized_pnl = (current_price - self.average_entry_price) * self.remaining_quantity
#         else:  # SELL
#             self.unrealized_pnl = (self.average_entry_price - current_price) * self.remaining_quantity
        
#         self.current_price = current_price
#         self.save(update_fields=['unrealized_pnl', 'current_price', 'updated_at'])
#         return self.unrealized_pnl
    
#     def close_trade(self, exit_price, exit_quantity=None):
#         """
#         Close a trade or partial close.
#         Returns the P&L for this closure.
#         """
#         if self.status == 'CLOSED':
#             raise ValueError("Trade already closed")
        
#         if exit_quantity is None:
#             exit_quantity = self.remaining_quantity
        
#         if exit_quantity > self.remaining_quantity:
#             raise ValueError(f"Cannot close {exit_quantity}, only {self.remaining_quantity} remaining")
        
#         # Calculate realized P&L for this portion
#         if self.direction == 'BUY':
#             pnl = (exit_price - self.average_entry_price) * exit_quantity
#         else:
#             pnl = (self.average_entry_price - exit_price) * exit_quantity
        
#         self.realized_pnl += pnl
#         self.remaining_quantity -= exit_quantity
        
#         # Update status
#         if self.remaining_quantity == 0:
#             self.status = 'CLOSED'
#             self.closed_at = timezone.now()
#         else:
#             self.status = 'PARTIALLY_CLOSED'
        
#         self.save()
#         return pnl


# class ChallengeTradeHistory(models.Model):
#     """
#     Detailed history of all orders/actions for a challenge trade.
#     Tracks buy/sell/modify/cancel events.
#     """
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
#     trade = models.ForeignKey(
#         ChallengeTrade,
#         on_delete=models.CASCADE,
#         related_name='history'
#     )
#     user = models.ForeignKey(User, on_delete=models.CASCADE)
    
#     action = models.CharField(max_length=15, choices=ACTIONS)
#     order_type = models.CharField(max_length=15, choices=ORDER_TYPES, default='MARKET')
    
#     quantity = models.DecimalField(max_digits=20, decimal_places=8)
#     price = models.DecimalField(max_digits=20, decimal_places=8)
#     amount = models.DecimalField(max_digits=20, decimal_places=2)  # quantity * price
    
#     # Commission and P&L
#     commission = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
#     realized_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
    
#     created_at = models.DateTimeField(auto_now_add=True)
    
#     class Meta:
#         db_table = 'challenge_trade_history'
#         indexes = [
#             models.Index(fields=['trade', 'created_at']),
#             models.Index(fields=['user', 'created_at']),
#             models.Index(fields=['action', 'created_at']),
#         ]
#         ordering = ['-created_at']
    
#     def __str__(self):
#         return f"{self.trade.asset_symbol} - {self.action}"


# class ChallengeTradeAnalytics(models.Model):
#     """
#     Aggregated analytics for a user's trades within a challenge.
#     Recalculated when trades are added/closed.
#     """
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     participation = models.OneToOneField(
#         'ChallengeParticipation',
#         on_delete=models.CASCADE,
#         related_name='trade_analytics'
#     )
    
#     # Trade counts
#     total_trades = models.PositiveIntegerField(default=0)
#     open_trades = models.PositiveIntegerField(default=0)
#     closed_trades = models.PositiveIntegerField(default=0)
#     profitable_trades = models.PositiveIntegerField(default=0)
#     losing_trades = models.PositiveIntegerField(default=0)
    
#     # P&L metrics
#     total_realized_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
#     total_unrealized_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
#     total_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
    
#     # Win/loss ratios
#     win_rate = models.DecimalField(
#         max_digits=5,
#         decimal_places=2,
#         default=Decimal('0'),
#         help_text="Percentage of profitable trades"
#     )
#     profit_factor = models.DecimalField(
#         max_digits=10,
#         decimal_places=2,
#         default=Decimal('0'),
#         help_text="Ratio of gross profit to gross loss"
#     )
    
#     # Trade type breakdown
#     spot_trades_count = models.PositiveIntegerField(default=0)
#     futures_trades_count = models.PositiveIntegerField(default=0)
#     options_trades_count = models.PositiveIntegerField(default=0)
    
#     # Holding analysis
#     avg_holding_time = models.DurationField(null=True, blank=True)
#     longest_trade = models.DurationField(null=True, blank=True)
#     shortest_trade = models.DurationField(null=True, blank=True)
    
#     # Commission and costs
#     total_commissions = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
    
#     # Capital usage
#     total_capital_deployed = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
#     avg_allocation_per_trade = models.DecimalField(
#         max_digits=5,
#         decimal_places=2,
#         default=Decimal('0'),
#         help_text="Average capital allocation % per trade"
#     )
    
#     # Best and worst trades
#     best_trade_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
#     worst_trade_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
    
#     # Updated timestamp
#     last_calculated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         db_table = 'challenge_trade_analytics'
    
#     def __str__(self):
#         return f"Analytics - {self.participation.user.email}"
    
#     def recalculate(self):
#         """Recalculate all analytics from trades"""
#         from django.db.models import Sum, Count, Avg, Q, Max, Min
#         from datetime import timedelta
        
#         trades = self.participation.trades.all()
        
#         # Trade counts
#         self.total_trades = trades.count()
#         self.open_trades = trades.filter(status__in=['OPEN', 'PARTIALLY_CLOSED']).count()
#         self.closed_trades = trades.filter(status='CLOSED').count()
#         self.profitable_trades = trades.filter(realized_pnl__gt=0).count()
#         self.losing_trades = trades.filter(realized_pnl__lt=0).count()
        
#         # P&L metrics
#         pnl_stats = trades.aggregate(
#             realized=Sum('realized_pnl'),
#             unrealized=Sum('unrealized_pnl')
#         )
        
#         self.total_realized_pnl = pnl_stats['realized'] or Decimal('0')
#         self.total_unrealized_pnl = pnl_stats['unrealized'] or Decimal('0')
#         self.total_pnl = self.total_realized_pnl + self.total_unrealized_pnl
        
#         # Win rate
#         if self.total_trades > 0:
#             self.win_rate = (self.profitable_trades / self.total_trades) * 100
        
#         # Profit factor
#         gross_loss = abs(trades.filter(realized_pnl__lt=0).aggregate(Sum('realized_pnl'))['realized_pnl__sum'] or 0)
#         if gross_loss > 0:
#             self.profit_factor = self.total_realized_pnl / gross_loss
        
#         # Trade type breakdown
#         self.spot_trades_count = trades.filter(trade_type='SPOT').count()
#         self.futures_trades_count = trades.filter(trade_type='FUTURES').count()
#         self.options_trades_count = trades.filter(trade_type='OPTIONS').count()
        
#         # Holding time analysis
#         closed_trades = trades.filter(status='CLOSED', closed_at__isnull=False)
#         if closed_trades.exists():
#             holding_times = []
#             for trade in closed_trades:
#                 holding_time = trade.closed_at - trade.opened_at
#                 holding_times.append(holding_time)
            
#             avg_seconds = sum([t.total_seconds() for t in holding_times]) / len(holding_times)
#             self.avg_holding_time = timedelta(seconds=avg_seconds)
#             self.longest_trade = max(holding_times)
#             self.shortest_trade = min(holding_times)
        
#         # Commissions
#         self.total_commissions = trades.aggregate(
#             total=Sum('entry_commission') + Sum('exit_commission')
#         )['total'] or Decimal('0')
        
#         # Capital deployment
#         self.total_capital_deployed = trades.aggregate(Sum('total_invested'))['total_invested__sum'] or Decimal('0')
#         if self.total_trades > 0:
#             self.avg_allocation_per_trade = trades.aggregate(Avg('allocation_percentage'))['allocation_percentage__avg'] or Decimal('0')
        
#         # Best and worst trades
#         best = trades.aggregate(Max('realized_pnl'))['realized_pnl__max']
#         worst = trades.aggregate(Min('realized_pnl'))['realized_pnl__min']
        
#         self.best_trade_pnl = best or Decimal('0')
#         self.worst_trade_pnl = worst or Decimal('0')
        
#         self.save()
