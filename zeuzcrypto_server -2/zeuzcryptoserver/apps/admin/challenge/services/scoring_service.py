
from decimal import Decimal
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from apps.admin.challenge.models.analytics_models import ChallengeScore, ChallengeTradeAnalytics

class ScoringService:
    """Service for calculating challenge scores and behavioral analysis"""
    
    @staticmethod
    def calculate_scores(participation):
        """
        Calculate comprehensive scores across 4 pillars:
        1. PnL (30%)
        2. Risk Management (30%)
        3. Consistency & Discipline (20%)
        4. Strategy Execution (20%)
        """
        analytics, _ = ChallengeTradeAnalytics.objects.get_or_create(participation=participation)
        analytics.recalculate()
        
        trades = participation.trades.all()
        week = participation.week
        wallet = participation.wallet
        
        # 1. PnL Score (30%)
        pnl_score = ScoringService._calculate_pnl_score(participation, week)
        
        # 2. Risk Management Score (30%)
        risk_score = ScoringService._calculate_risk_score(trades, wallet)
        
        # 3. Consistency Score (20%)
        consistency_score = ScoringService._calculate_consistency_score(trades, analytics)
        
        # 4. Strategy Execution Score (20%)
        strategy_score = ScoringService._calculate_strategy_score(participation, week)
        
        # Weighted Total
        total_score = (
            (pnl_score * Decimal('0.30')) +
            (risk_score * Decimal('0.30')) +
            (consistency_score * Decimal('0.20')) +
            (strategy_score * Decimal('0.20'))
        )
        
        # Behavioral Tagging
        behavioral_tag = ScoringService._determine_behavioral_tag(
            total_score, risk_score, pnl_score, analytics.win_rate
        )
        
        # Save Score
        score, _ = ChallengeScore.objects.update_or_create(
            participation=participation,
            defaults={
                'pnl_score': pnl_score,
                'money_management_score': risk_score,
                'capital_allocation_score': strategy_score, # Mapping Strategy to allocation field for now
                'total_score': total_score,
                'behavioral_tag': behavioral_tag
            }
        )
        
        return {
            'total_score': total_score,
            'pnl_score': pnl_score,
            'risk_score': risk_score,
            'consistency_score': consistency_score,
            'strategy_score': strategy_score,
            'behavioral_tag': behavioral_tag
        }

    # ==================== SCORING PILLARS ====================

    @staticmethod
    def _calculate_pnl_score(participation, week):
        """
        Score based on profitability vs target.
        Target Hit = 100
        Profitable = 50-90
        Loss = 0-40 (Scaled)
        """
        target_pct = Decimal(str(week.target_goal)) # E.g., 5.00%
        actual_pct = participation.portfolio_return_pct
        
        if actual_pct >= target_pct:
            return Decimal('100.00')
        elif actual_pct > 0:
            # Scale between 50 and 90 based on progress to target
            progress = actual_pct / target_pct
            return Decimal('50.00') + (progress * Decimal('40.00'))
        else:
            # Loss scenario: Scale 40 down to 0 for losses up to -20%
            loss_depth = abs(actual_pct)
            if loss_depth > 20:
                return Decimal('0.00')
            return Decimal('40.00') * (1 - (loss_depth / Decimal('20.00')))

    @staticmethod
    def _calculate_risk_score(trades, wallet):
        """
        Score based on risk habits.
        - Position Sizing (Did trades exceed 30% capital?)
        - Drawdowns (Did any trade lose > 15%?)
        """
        base_score = Decimal('100.00')
        
        # Check Position Sizing
        # We enforced 30% hard limit, but reward conservative < 10%
        high_risk_allocation = trades.filter(allocation_percentage__gt=20).count()
        if high_risk_allocation > 0:
             base_score -= Decimal(str(high_risk_allocation * 5)) # -5 pts per high risk trade
             
        # Check Big Losers (Stop Loss failure)
        # Assuming losing > 15% of invested amount in a single trade is bad risk mgmt
        for trade in trades:
            if trade.realized_pnl < 0:
                 loss_pct = (abs(trade.realized_pnl) / trade.total_invested) * 100
                 if loss_pct > 15:
                      base_score -= Decimal('10.00') # -10 pts per blown trade
                      
        return max(Decimal('0.00'), base_score)

    @staticmethod
    def _calculate_consistency_score(trades, analytics):
        """
        Score based on discipline.
        - Overtrading (> 50 trades/week?)
        - Activity Spread (Traded on at least 4 unique days?)
        """
        base_score = Decimal('100.00')
        
        # 1. Overtrading
        if analytics.total_trades > 50:
             base_score -= Decimal('20.00')
             
        # 2. Daily Activity (Consistency)
        dates = trades.datetimes('created_at', 'day')
        unique_days = len(set(dates))
        if unique_days < 4:
             # Major penalty if less than 4 days (unless completed early? 
             # No, 4 days is checking requirement)
             base_score -= Decimal('30.00')
             
        # 3. Win Rate Deviation (Consistency)
        # Extreme win rates (e.g. 100% or 0%) often imply luck or giving up
        if analytics.win_rate == 0 or analytics.win_rate == 100:
             if analytics.total_trades > 5: # If sustained
                  pass # Actually 100% is fine if sustained, let's keep it simple.
                  
        return max(Decimal('0.00'), base_score)

    @staticmethod
    def _calculate_strategy_score(participation, week):
        """
        Score based on following the specific challenge type.
        """
        base_score = Decimal('100.00')
        
        # Check Mix for Combo Challenges
        if week.trading_type == 'SPOT_FUTURES':
             # Expect balance
             spot_count = participation.spot_trades
             fut_count = participation.futures_trades
             total = spot_count + fut_count
             if total > 0:
                  spot_ratio = spot_count / total
                  # If skewed < 10% on either side, penalty
                  if spot_ratio < 0.1 or spot_ratio > 0.9:
                       base_score -= Decimal('25.00') # "Strategy Imbalance"
                       
        elif week.trading_type == 'SPOT_FUTURES_OPTIONS':
             # Expect roughly 33% each or at least absence of 0
             if participation.spot_trades == 0 or participation.futures_trades == 0 or participation.options_trades == 0:
                  base_score -= Decimal('30.00') # "Strategy Failure"

        return max(Decimal('0.00'), base_score)

    @staticmethod
    def _determine_behavioral_tag(total, risk, pnl, win_rate):
        """Assign personality tag based on metrics"""
        if risk < 50:
             return 'RECKLESS'
        if total > 85 and risk > 80:
             return 'DISCIPLINED'
        if pnl > 80 and risk < 70:
             return 'AGGRESSIVE'
        
        return 'BALANCED'
