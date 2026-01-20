


# ==================== FILE: apps/challenges/models/wallet_models.py ====================

import uuid
from decimal import Decimal
from django.db import models, transaction
from apps.accounts.models import User


class ChallengeWallet(models.Model):
    """Isolated wallet for each challenge participation"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenge_wallets')
    participation = models.OneToOneField('UserChallengeParticipation', on_delete=models.CASCADE, related_name='wallet')
    initial_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('10000.00'))
    available_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('10000.00'))
    locked_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    earned_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'challenge_wallets'
        indexes = [
            models.Index(fields=['user', 'participation']),
            models.Index(fields=['user', 'is_active']),
        ]
        unique_together = [['user', 'participation']]
    
    def __str__(self):
        return f"{self.user.email} - {self.total_balance} coins"
    
    @property
    def total_balance(self):
        return self.available_balance + self.locked_balance + self.earned_balance
    
    @property
    def current_balance(self):
        return self.available_balance + self.earned_balance
    
    def check_sufficient_balance(self, amount):
        return self.available_balance >= amount
    
    @transaction.atomic
    def lock_coins(self, amount):
        if not self.check_sufficient_balance(amount):
            raise ValueError(f"Insufficient balance. Available: {self.available_balance}, Required: {amount}")
        
        balance_before = self.available_balance
        self.available_balance -= amount
        self.locked_balance += amount
        self.save(update_fields=['available_balance', 'locked_balance', 'updated_at'])
        
        ChallengeWalletTransaction.objects.create(
            wallet=self, transaction_type='TRADE_LOCK', amount=amount,
            balance_before=balance_before, balance_after=self.available_balance,
            description=f"Locked {amount} coins for trade"
        )
    
    @transaction.atomic
    def unlock_coins(self, amount):
        if self.locked_balance < amount:
            raise ValueError(f"Cannot unlock more than locked balance")
        
        balance_before = self.available_balance
        self.locked_balance -= amount
        self.available_balance += amount
        self.save(update_fields=['available_balance', 'locked_balance', 'updated_at'])
        
        ChallengeWalletTransaction.objects.create(
            wallet=self, transaction_type='TRADE_UNLOCK', amount=amount,
            balance_before=balance_before, balance_after=self.available_balance,
            description=f"Unlocked {amount} coins from trade"
        )
    
    @transaction.atomic
    def add_profit(self, profit_amount):
        balance_before = self.earned_balance
        self.earned_balance += profit_amount
        self.save(update_fields=['earned_balance', 'updated_at'])
        
        ChallengeWalletTransaction.objects.create(
            wallet=self, transaction_type='PROFIT_ADD', amount=profit_amount,
            balance_before=balance_before, balance_after=self.earned_balance,
            description=f"Added {profit_amount} profit"
        )
    
    @transaction.atomic
    def deduct_loss(self, loss_amount):
        balance_before = self.earned_balance
        self.earned_balance -= loss_amount
        self.save(update_fields=['earned_balance', 'updated_at'])
        
        ChallengeWalletTransaction.objects.create(
            wallet=self, transaction_type='LOSS_DEDUCT', amount=loss_amount,
            balance_before=balance_before, balance_after=self.earned_balance,
            description=f"Deducted {loss_amount} loss"
        )
    
    def reset_wallet(self):
        self.available_balance = self.initial_balance
        self.locked_balance = Decimal('0')
        self.earned_balance = Decimal('0')
        self.save()


class ChallengeWalletTransaction(models.Model):
    """Audit trail for wallet transactions"""
    TRANSACTION_TYPES = [
        ('INITIAL_DEPOSIT', 'Initial Deposit'),
        ('TRADE_LOCK', 'Trade Lock'),
        ('TRADE_UNLOCK', 'Trade Unlock'),
        ('PROFIT_ADD', 'Profit Added'),
        ('LOSS_DEDUCT', 'Loss Deducted'),
        ('REWARD_BONUS', 'Reward Bonus'),
        ('RESET', 'Wallet Reset'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    wallet = models.ForeignKey(ChallengeWallet, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    balance_before = models.DecimalField(max_digits=15, decimal_places=2)
    balance_after = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.CharField(max_length=255)
    trade = models.ForeignKey('ChallengeTrade', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'challenge_wallet_transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['wallet', 'created_at']),
            models.Index(fields=['transaction_type', 'created_at']),
        ]




# import uuid
# from decimal import Decimal
# from django.db import models
# from django.utils import timezone
# from apps.accounts.models import User

# class ChallengeWallet(models.Model):
#     """Virtual wallet for challenge trading"""

#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     participation = models.OneToOneField(
#         'admin.UserChallengeParticipation', on_delete=models.CASCADE, related_name="wallet"
#     )

#     balance = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal("0"))
#     locked_balance = models.DecimalField(
#         max_digits=20, decimal_places=8, default=Decimal("0")
#     )

#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = "challenge_wallets"

#     def __str__(self):
#         return f"Challenge Wallet - {self.participation.user.email}"


# class ChallengeWalletTransaction(models.Model):
#     """Transaction history for challenge wallets"""

#     TRANSACTION_TYPES = [
#         ("DEPOSIT", "Initial Deposit"),
#         ("TRADE", "Trade Settlement"),
#         ("FEE", "Trading Fee"),
#         ("ADJUSTMENT", "Balance Adjustment"),
#     ]

#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     wallet = models.ForeignKey(
#         ChallengeWallet, on_delete=models.CASCADE, related_name="transactions"
#     )

#     transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
#     amount = models.DecimalField(max_digits=20, decimal_places=8)

#     balance_before = models.DecimalField(max_digits=20, decimal_places=8)
#     balance_after = models.DecimalField(max_digits=20, decimal_places=8)

#     description = models.TextField(blank=True)
#     reference_id = models.UUIDField(null=True, blank=True)

#     created_at = models.DateTimeField(auto_now_add=True)

#     class Meta:
#         db_table = "challenge_wallet_transactions"
#         indexes = [
#             models.Index(fields=["wallet", "transaction_type"]),
#             models.Index(fields=["created_at"]),
#         ]

#     def __str__(self):
#         return f"{self.wallet.participation.user.email} - {self.transaction_type} - {self.amount}"
