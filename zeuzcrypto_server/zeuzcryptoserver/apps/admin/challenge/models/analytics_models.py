
# ==================== FILE: apps/challenges/models/analytics_models.py ====================

import uuid
from decimal import Decimal
from django.db import models
from django.db.models import Sum, Count, Avg, Max, Min
from django.utils import timezone
from datetime import timedelta
from apps.accounts.models import User


class ChallengeScore(models.Model):
    """Detailed scoring breakdown"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participation = models.OneToOneField('UserChallengeParticipation', on_delete=models.CASCADE, related_name='score')
    
    pnl_score = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    money_management_score = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    capital_allocation_score = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    total_score = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    
    behavioral_tag = models.CharField(
        max_length=30,
        choices=[
            ('DISCIPLINED', 'Disciplined Trader'),
            ('BALANCED', 'Balanced Trader'),
            ('AGGRESSIVE', 'Aggressive Trader'),
            ('RECKLESS', 'Reckless Trader'),
        ],
        default='BALANCED'
    )
    
    calculated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'challenge_scores'


class ChallengeTradeAnalytics(models.Model):
    """Aggregated analytics for user's trades"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participation = models.OneToOneField('UserChallengeParticipation', on_delete=models.CASCADE, related_name='trade_analytics')
    
    total_trades = models.PositiveIntegerField(default=0)
    open_trades = models.PositiveIntegerField(default=0)
    closed_trades = models.PositiveIntegerField(default=0)
    profitable_trades = models.PositiveIntegerField(default=0)
    losing_trades = models.PositiveIntegerField(default=0)
    
    total_realized_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
    total_unrealized_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
    total_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
    
    win_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    profit_factor = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0'))
    
    spot_trades_count = models.PositiveIntegerField(default=0)
    futures_trades_count = models.PositiveIntegerField(default=0)
    options_trades_count = models.PositiveIntegerField(default=0)
    
    avg_holding_time = models.DurationField(null=True, blank=True)
    longest_trade = models.DurationField(null=True, blank=True)
    shortest_trade = models.DurationField(null=True, blank=True)
    
    total_capital_deployed = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
    avg_allocation_per_trade = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0'))
    
    best_trade_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
    worst_trade_pnl = models.DecimalField(max_digits=20, decimal_places=2, default=Decimal('0'))
    
    last_calculated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'challenge_trade_analytics'
    
    def recalculate(self):
        """Recalculate all analytics from trades"""
        trades = self.participation.trades.all()
        
        self.total_trades = trades.count()
        self.open_trades = trades.filter(status__in=['OPEN', 'PARTIALLY_CLOSED']).count()
        self.closed_trades = trades.filter(status='CLOSED').count()
        self.profitable_trades = trades.filter(realized_pnl__gt=0).count()
        self.losing_trades = trades.filter(realized_pnl__lt=0).count()
        
        pnl_stats = trades.aggregate(realized=Sum('realized_pnl'), unrealized=Sum('unrealized_pnl'))
        self.total_realized_pnl = pnl_stats['realized'] or Decimal('0')
        self.total_unrealized_pnl = pnl_stats['unrealized'] or Decimal('0')
        self.total_pnl = self.total_realized_pnl + self.total_unrealized_pnl
        
        if self.total_trades > 0:
            self.win_rate = (self.profitable_trades / self.total_trades) * 100
        
        gross_loss = abs(trades.filter(realized_pnl__lt=0).aggregate(Sum('realized_pnl'))['realized_pnl__sum'] or 0)
        if gross_loss > 0:
            self.profit_factor = self.total_realized_pnl / gross_loss
        
        self.spot_trades_count = trades.filter(trade_type='SPOT').count()
        self.futures_trades_count = trades.filter(trade_type='FUTURES').count()
        self.options_trades_count = trades.filter(trade_type='OPTIONS').count()
        
        closed_trades = trades.filter(status='CLOSED', closed_at__isnull=False)
        if closed_trades.exists():
            holding_times = [(trade.closed_at - trade.opened_at) for trade in closed_trades]
            avg_seconds = sum([t.total_seconds() for t in holding_times]) / len(holding_times)
            self.avg_holding_time = timedelta(seconds=avg_seconds)
            self.longest_trade = max(holding_times)
            self.shortest_trade = min(holding_times)
        
        self.total_capital_deployed = trades.aggregate(Sum('total_invested'))['total_invested__sum'] or Decimal('0')
        if self.total_trades > 0:
            self.avg_allocation_per_trade = trades.aggregate(Avg('allocation_percentage'))['allocation_percentage__avg'] or Decimal('0')
        
        self.best_trade_pnl = trades.aggregate(Max('realized_pnl'))['realized_pnl__max'] or Decimal('0')
        self.worst_trade_pnl = trades.aggregate(Min('realized_pnl'))['realized_pnl__min'] or Decimal('0')
        
        self.save()


class ChallengeLeaderboard(models.Model):
    """Cached leaderboard entries"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    week = models.ForeignKey('ChallengeWeek', on_delete=models.CASCADE, related_name='leaderboard_entries')
    participation = models.ForeignKey('UserChallengeParticipation', on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rank = models.IntegerField()
    total_score = models.DecimalField(max_digits=5, decimal_places=2)
    portfolio_return_pct = models.DecimalField(max_digits=10, decimal_places=2)
    total_trades = models.IntegerField()
    win_rate = models.DecimalField(max_digits=5, decimal_places=2)
    behavioral_tag = models.CharField(max_length=50)
    last_updated = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'challenge_leaderboard'
        ordering = ['rank']
        unique_together = [['week', 'participation']]
        indexes = [models.Index(fields=['week', 'rank'])]

