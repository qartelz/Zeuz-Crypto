
# ==================== FILE: apps/challenges/models/evaluation_models.py ====================

import uuid
from decimal import Decimal
from django.db import models
from apps.admin.challenge.models.challenge_models import UserChallengeParticipation

class ChallengeEvaluationReport(models.Model):
    """
    Detailed Prop-Firm style evaluation snapshot.
    Stores the exact breakdown of the 100-point scoring model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participation = models.OneToOneField(UserChallengeParticipation, on_delete=models.CASCADE, related_name='evaluation_report')
    
    # 1. Task Discipline Score (0-30)
    task_discipline_score = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    completed_mandatory_tasks = models.IntegerField(default=0)
    total_mandatory_tasks = models.IntegerField(default=0)
    
    # 2. Trading Discipline Score (0-30)
    trading_discipline_score = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    trade_count_subscore = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    asset_class_subscore = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    overtrading_penalty = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    
    # 3. Profit Outcome Score (0-25)
    profit_outcome_score = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    
    # 4. Consistency Bonus (0-15)
    consistency_bonus_score = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    
    # Results
    final_score = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    
    tier_name = models.CharField(
        max_length=20,
        choices=[
            ('BRONZE', 'Bronze (Beginner)'),
            ('SILVER', 'Silver (Intermediate)'),
            ('GOLD', 'Gold (Advanced)'),
            ('PLATINUM', 'Platinum (Elite)'),
        ]
    )
    
    behavior_tag = models.CharField(
        max_length=50,
        choices=[
            ('DISCIPLINED', 'Disciplined'),
            ('BALANCED', 'Balanced'),
            ('AGGRESSIVE', 'Aggressive'),
            ('EMOTIONAL', 'Emotional'),
            ('RECKLESS', 'Reckless'),
            ('INCONSISTENT', 'Inconsistent'),
        ]
    )
    
    key_issue = models.TextField(blank=True, help_text="One sentence diagnosis")
    next_challenge_focus = models.JSONField(default=list, help_text="List of 3 focus rules for next time")
    
    generated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'challenge_evaluation_reports'
        ordering = ['-generated_at']

