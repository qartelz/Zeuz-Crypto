
# ==================== FILE: apps/challenges/models/challenge_models.py ====================

import uuid
from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.accounts.models import User


class ChallengeProgram(models.Model):
    """Top-level challenge program"""
    DIFFICULTY_LEVELS = [
        ('BEGINNER', 'Beginner'),
        ('INTERMEDIATE', 'Intermediate'),
        ('ADVANCED', 'Advanced'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_LEVELS, default='BEGINNER')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'challenge_programs'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        from django.core.exceptions import ValidationError
        
        # If setting to active, enforce validation
        if self.is_active:
            # 1. Deactivate all other active challenges
            ChallengeProgram.objects.filter(is_active=True).exclude(id=self.id).update(is_active=False)
            
            # 2. Check for Completeness (Only for existing instances to avoid recursion/errors on creation)
            if self.pk:
                week_count = self.weeks.count()
                if week_count != 4:
                    # We allow saving as inactive if incomplete, but not as active
                    # However, to prevent admin errors, we should strictly warn or fail if activating
                    # Let's fail hard if activating
                    pass 
                    # NOTE: We can't easily validate related objects inside save() if they haven't been created yet
                    # (e.g. during initial creation). So we mostly rely on the Frontend to prevent
                    # setting is_active=True until the end.
                    # But for strict enforcement on update:
                    
                # Strict check: Ensure all weeks have rewards
                # weeks_with_rewards = [w for w in self.weeks.all() if hasattr(w, 'reward_template')]
                # if len(weeks_with_rewards) != week_count:
                #    raise ValidationError("All weeks must have configured rewards before activation.")

        super().save(*args, **kwargs)


class ChallengeWeek(models.Model):
    """Individual weekly challenges"""
    TRADING_TYPES = [
        ('SPOT', 'Spot Trading Only'),
        ('SPOT_FUTURES', 'Spot + Futures'),
        ('SPOT_FUTURES_OPTIONS', 'Spot + Futures + Options'),
        ('PORTFOLIO', 'Portfolio Performance Focus'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    program = models.ForeignKey(ChallengeProgram, on_delete=models.CASCADE, related_name='weeks')
    title = models.CharField(max_length=200)
    description = models.TextField()
    learning_outcome = models.TextField()
    week_number = models.PositiveIntegerField()
    trading_type = models.CharField(max_length=30, choices=TRADING_TYPES)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    target_goal = models.DecimalField(max_digits=10, decimal_places=2)
    min_trades_required = models.PositiveIntegerField(default=5, help_text="Total minimum trades required")
    
    min_spot_trades = models.PositiveIntegerField(default=0, help_text="Minimum spot trades required")
    min_futures_trades = models.PositiveIntegerField(default=0, help_text="Minimum futures trades required")
    min_options_trades = models.PositiveIntegerField(default=0, help_text="Minimum options trades required")
    
    # Gatekeeping Logic
    min_win_rate_required = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'), help_text="Min win rate % required to pass") 
    max_drawdown_limit = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10'), help_text="Max drawdown % allowed")
    
    # Restrictions
    max_leverage_allowed = models.PositiveIntegerField(default=1, help_text="Max leverage allowed (e.g. 1 for Spot, 5 for low-risk, 20 for high-risk)")

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'challenge_weeks'
        indexes = [
            models.Index(fields=['program', 'week_number']),
            models.Index(fields=['start_date', 'end_date']),
        ]
        unique_together = ('program', 'week_number')
        ordering = ['program', 'week_number']
    
    def __str__(self):
        return f"{self.program.name} - {self.title}"
    
    def is_ongoing(self):
        now = timezone.now()
        return self.start_date <= now <= self.end_date
    
    def is_completed(self):
        return timezone.now() > self.end_date


class ChallengeTask(models.Model):
    """Individual tasks within a challenge week"""
    TASK_TYPES = [
        ('TRADE_COUNT', 'Trade Count'),
        ('PORTFOLIO_BALANCE', 'Portfolio Balance'),
        ('PROFIT_TARGET', 'Profit Target'),
        ('HOLDING_PERIOD', 'Holding Period'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    week = models.ForeignKey(ChallengeWeek, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=200)
    description = models.TextField()
    task_type = models.CharField(max_length=20, choices=TASK_TYPES)
    target_value = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    is_mandatory = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'challenge_tasks'
        ordering = ['week', 'order']
    
    def __str__(self):
        return f"{self.week.title} - {self.title}"


class ChallengeReward(models.Model):
    """Reward template for challenge completion"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    week = models.OneToOneField(ChallengeWeek, on_delete=models.CASCADE, related_name='reward_template')
    badge_name = models.CharField(max_length=100)
    badge_description = models.TextField(blank=True)
    badge_icon = models.URLField(blank=True, null=True)
    profit_bonus_coins = models.PositiveIntegerField(default=25000)
    loss_recovery_coins = models.PositiveIntegerField(default=10000)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'challenge_rewards'
    
    def __str__(self):
        return f"{self.week.title} - {self.badge_name}"


class UserChallengeParticipation(models.Model):
    """Tracks user participation in a challenge week"""
    STATUS_CHOICES = [
        ('NOT_STARTED', 'Not Started'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('ABANDONED', 'Abandoned'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenge_participations')
    week = models.ForeignKey(ChallengeWeek, on_delete=models.CASCADE, related_name='participants')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOT_STARTED')
    starting_balance = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    current_balance = models.DecimalField(max_digits=20, decimal_places=8, default=Decimal('0'))
    total_trades = models.PositiveIntegerField(default=0)
    spot_trades = models.PositiveIntegerField(default=0)
    futures_trades = models.PositiveIntegerField(default=0)
    options_trades = models.PositiveIntegerField(default=0)
    portfolio_return_pct = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    joined_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'user_challenge_participations'
        indexes = [
            models.Index(fields=['user', 'week']),
            models.Index(fields=['status', 'week']),
        ]
        unique_together = ('user', 'week')
    
    def __str__(self):
        return f"{self.user.email} - {self.week.title}"
    
    def join_challenge(self, starting_balance):
        self.status = 'IN_PROGRESS'
        self.starting_balance = starting_balance
        self.current_balance = starting_balance
        self.save()
    
    def complete_challenge(self):
        self.status = 'COMPLETED'
        self.completed_at = timezone.now()
        self.save()
    
    def calculate_return_percentage(self):
        if self.starting_balance == 0:
            return Decimal('0')
        return ((self.current_balance - self.starting_balance) / self.starting_balance) * 100


class ChallengeTaskCompletion(models.Model):
    """Track individual task completions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participation = models.ForeignKey(UserChallengeParticipation, on_delete=models.CASCADE, related_name='task_completions')
    task = models.ForeignKey(ChallengeTask, on_delete=models.CASCADE, related_name='completions')
    is_completed = models.BooleanField(default=False)
    completion_date = models.DateTimeField(null=True, blank=True)
    actual_value = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'challenge_task_completions'
        indexes = [models.Index(fields=['participation', 'task'])]
        unique_together = ('participation', 'task')
    
    def complete_task(self, actual_value=None):
        self.is_completed = True
        self.actual_value = actual_value
        self.completion_date = timezone.now()
        self.save()


class ChallengeStatistics(models.Model):
    """Aggregated statistics for a challenge week"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    week = models.OneToOneField(ChallengeWeek, on_delete=models.CASCADE, related_name='statistics')
    total_enrollments = models.PositiveIntegerField(default=0)
    completions = models.PositiveIntegerField(default=0)
    abandonments = models.PositiveIntegerField(default=0)
    completion_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    avg_portfolio_return = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    avg_total_score = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    avg_trades_per_user = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    disciplined_traders = models.PositiveIntegerField(default=0)
    balanced_traders = models.PositiveIntegerField(default=0)
    aggressive_traders = models.PositiveIntegerField(default=0)
    reckless_traders = models.PositiveIntegerField(default=0)
    total_coins_distributed = models.BigIntegerField(default=0)
    badges_awarded = models.PositiveIntegerField(default=0)
    calculated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'challenge_statistics'


# # ==================== FILE: apps/challenges/models/wallet_models.py ====================

# import uuid
# from decimal import Decimal
# from django.db import models, transaction
# from apps.accounts.models import User


# class ChallengeWallet(models.Model):
#     """Isolated wallet for each challenge participation"""
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenge_wallets')
#     participation = models.OneToOneField('UserChallengeParticipation', on_delete=models.CASCADE, related_name='wallet')
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
    
#     @property
#     def current_balance(self):
#         return self.available_balance + self.earned_balance
    
#     def check_sufficient_balance(self, amount):
#         return self.available_balance >= amount
    
#     @transaction.atomic
#     def lock_coins(self, amount):
#         if not self.check_sufficient_balance(amount):
#             raise ValueError(f"Insufficient balance. Available: {self.available_balance}, Required: {amount}")
        
#         balance_before = self.available_balance
#         self.available_balance -= amount
#         self.locked_balance += amount
#         self.save(update_fields=['available_balance', 'locked_balance', 'updated_at'])
        
#         ChallengeWalletTransaction.objects.create(
#             wallet=self, transaction_type='TRADE_LOCK', amount=amount,
#             balance_before=balance_before, balance_after=self.available_balance,
#             description=f"Locked {amount} coins for trade"
#         )
    
#     @transaction.atomic
#     def unlock_coins(self, amount):
#         if self.locked_balance < amount:
#             raise ValueError(f"Cannot unlock more than locked balance")
        
#         balance_before = self.available_balance
#         self.locked_balance -= amount
#         self.available_balance += amount
#         self.save(update_fields=['available_balance', 'locked_balance', 'updated_at'])
        
#         ChallengeWalletTransaction.objects.create(
#             wallet=self, transaction_type='TRADE_UNLOCK', amount=amount,
#             balance_before=balance_before, balance_after=self.available_balance,
#             description=f"Unlocked {amount} coins from trade"
#         )
    
#     @transaction.atomic
#     def add_profit(self, profit_amount):
#         balance_before = self.earned_balance
#         self.earned_balance += profit_amount
#         self.save(update_fields=['earned_balance', 'updated_at'])
        
#         ChallengeWalletTransaction.objects.create(
#             wallet=self, transaction_type='PROFIT_ADD', amount=profit_amount,
#             balance_before=balance_before, balance_after=self.earned_balance,
#             description=f"Added {profit_amount} profit"
#         )
    
#     @transaction.atomic
#     def deduct_loss(self, loss_amount):
#         balance_before = self.earned_balance
#         self.earned_balance -= loss_amount
#         self.save(update_fields=['earned_balance', 'updated_at'])
        
#         ChallengeWalletTransaction.objects.create(
#             wallet=self, transaction_type='LOSS_DEDUCT', amount=loss_amount,
#             balance_before=balance_before, balance_after=self.earned_balance,
#             description=f"Deducted {loss_amount} loss"
#         )
    
#     def reset_wallet(self):
#         self.available_balance = self.initial_balance
#         self.locked_balance = Decimal('0')
#         self.earned_balance = Decimal('0')
#         self.save()


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

