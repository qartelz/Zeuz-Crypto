
# ==================== FILE: apps/challenges/models/reward_models.py ====================

import uuid
from decimal import Decimal
from django.db import models
from django.utils import timezone
from apps.accounts.models import User


class UserChallengeReward(models.Model):
    """Track rewards earned by users"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenge_rewards_earned')
    participation = models.ForeignKey('UserChallengeParticipation', on_delete=models.CASCADE, related_name='earned_rewards')
    reward_template = models.ForeignKey('ChallengeReward', on_delete=models.CASCADE)
    badge_earned = models.BooleanField(default=False)
    coins_earned = models.PositiveIntegerField(default=0)
    earned_at = models.DateTimeField(auto_now_add=True)
    claimed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'user_challenge_rewards'
        indexes = [models.Index(fields=['user', 'earned_at'])]


class ChallengeRewardDistribution(models.Model):
    """Reward distribution to main wallet"""
    REWARD_TYPES = [
        ('COMPLETION_BONUS', 'Completion Bonus'),
        ('PROFIT_BONUS', 'Profit Bonus'),
        ('LEADERBOARD_PRIZE', 'Leaderboard Prize'),
    ]
    STATUS_CHOICES = [('PENDING', 'Pending'), ('COMPLETED', 'Completed'), ('FAILED', 'Failed')]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='challenge_reward_distributions')
    participation = models.ForeignKey('UserChallengeParticipation', on_delete=models.CASCADE)
    reward_type = models.CharField(max_length=20, choices=REWARD_TYPES)
    coin_amount = models.DecimalField(max_digits=15, decimal_places=2)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    error_message = models.TextField(blank=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_challenge_rewards')
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'challenge_reward_distributions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', 'created_at']),
        ]


# ==================== COMPLETE DIRECTORY STRUCTURE ====================
"""
apps/challenges/
├── __init__.py
├── apps.py
├── models/
│   ├── __init__.py
│   ├── challenge_models.py
│   ├── wallet_models.py
│   ├── trade_models.py
│   ├── analytics_models.py
│   └── reward_models.py
├── serializers/
│   ├── __init__.py
│   ├── challenge_serializers.py
│   ├── wallet_serializers.py
│   ├── trade_serializers.py
│   └── admin_serializers.py
├── views/
│   ├── __init__.py
│   ├── challenge_views.py
│   ├── wallet_views.py
│   ├── trade_views.py
│   ├── admin_views.py
│   └── leaderboard_views.py
├── services/
│   ├── __init__.py
│   ├── wallet_service.py
│   ├── trade_service.py
│   ├── scoring_service.py
│   ├── reward_service.py
│   ├── task_verification.py
│   ├── admin_service.py
│   └── leaderboard_service.py
├── admin.py
├── urls.py
└── tests/
    ├── __init__.py
    ├── test_models.py
    └── test_services.py
"""


# ==================== MODEL RELATIONSHIP SUMMARY ====================
"""
USER → UserChallengeParticipation → ChallengeWeek → ChallengeProgram
                ↓
        ChallengeWallet (1:1)
                ↓
        ChallengeWalletTransaction (1:many)
                ↓
        ChallengeTrade (1:many)
                ↓
        ChallengeTradeHistory (1:many)
                ↓
        ChallengeScore (1:1)
                ↓
        ChallengeTradeAnalytics (1:1)
                ↓
        UserChallengeReward (1:many)

KEY FEATURES:
✅ No commission fields (removed as requested)
✅ Isolated challenge data (separate from main trades)
✅ Virtual wallet system with lock/unlock mechanism
✅ Complete P&L tracking
✅ Analytics and scoring system
✅ Reward distribution
✅ Leaderboard support
✅ Task completion tracking
"""


# ==================== NEXT STEPS ====================
"""
1. Run migrations:
   python manage.py makemigrations challenges
   python manage.py migrate challenges

2. Create serializers (next artifact)
3. Create views (next artifact)
4. Create services (next artifact)
5. Set up admin interface
6. Configure URLs
7. Write tests

Ready to proceed with serializers, views, and services!
"""