
# ==================== FILE: apps/challenges/services/scoring_service.py ====================

from decimal import Decimal
# from apps.challenges.models import ChallengeScore
from apps.admin.challenge.models.analytics_models import ChallengeScore


class ScoringService:
    """Service for calculating challenge scores"""
    
    @staticmethod
    def calculate_pnl_score(return_pct):
        """Calculate PnL score based on return percentage (0-10 scale)"""
        return_pct = float(return_pct)
        
        if return_pct <= 0:
            return Decimal('0')
        elif return_pct <= 5:
            return Decimal('1')
        elif return_pct <= 15:
            return Decimal('2')
        elif return_pct <= 25:
            return Decimal('3')
        elif return_pct <= 40:
            return Decimal('4')
        elif return_pct <= 60:
            return Decimal('5')
        elif return_pct <= 80:
            return Decimal('6')
        elif return_pct <= 100:
            return Decimal('7')
        elif return_pct <= 150:
            return Decimal('8')
        elif return_pct <= 250:
            return Decimal('9')
        else:
            return Decimal('10')
    
    @staticmethod
    def calculate_capital_allocation_score(avg_allocation_pct):
        """Calculate capital allocation score based on % of capital used per trade"""
        avg_pct = float(avg_allocation_pct)
        
        if avg_pct >= 76:
            return Decimal('0.5')  # Firecracker
        elif avg_pct >= 51:
            return Decimal('3')    # Wave Hopper
        elif avg_pct >= 26:
            return Decimal('6')    # Coin Scout
        elif avg_pct >= 15:
            return Decimal('10')   # Byte Bouncer (Ideal)
        elif avg_pct >= 11:
            return Decimal('9')    # Byte Bouncer
        elif avg_pct >= 5:
            return Decimal('8')    # Byte Bouncer
        else:
            return Decimal('0.25') # Too conservative
    
    @staticmethod
    def calculate_money_management_score(participation):
        """Calculate money management score based on portfolio stability"""
        # Simplified version - in production, analyze daily balance volatility
        return Decimal('5')
    
    @staticmethod
    def assign_behavioral_tag(total_score):
        """Assign behavioral tag based on total score"""
        score_val = float(total_score)
        
        if score_val >= 8:
            return 'DISCIPLINED'
        elif score_val >= 5:
            return 'BALANCED'
        elif score_val >= 2:
            return 'AGGRESSIVE'
        else:
            return 'RECKLESS'
    
    @staticmethod
    def calculate_scores(participation):
        """Calculate all scores for participation"""
        # from apps.challenges.services.trade_service import TradeService
        from apps.admin.challenge.services.trade_service import TradeService
        
        score, created = ChallengeScore.objects.get_or_create(
            participation=participation
        )
        
        # PnL score
        score.pnl_score = ScoringService.calculate_pnl_score(
            participation.portfolio_return_pct
        )
        
        # Money management score
        score.money_management_score = ScoringService.calculate_money_management_score(
            participation
        )
        
        # Capital allocation score
        avg_allocation = TradeService.calculate_average_allocation(participation)
        score.capital_allocation_score = ScoringService.calculate_capital_allocation_score(
            avg_allocation
        )
        
        # Total score (weighted average)
        score.total_score = (
            (score.pnl_score * Decimal('0.6')) +
            (score.money_management_score * Decimal('0.25')) +
            (score.capital_allocation_score * Decimal('0.15'))
        )
        
        # Behavioral tag
        score.behavioral_tag = ScoringService.assign_behavioral_tag(score.total_score)
        
        score.save()
        
        return {
            'pnl_score': str(score.pnl_score),
            'money_management_score': str(score.money_management_score),
            'capital_allocation_score': str(score.capital_allocation_score),
            'total_score': str(score.total_score),
            'behavioral_tag': score.behavioral_tag,
        }

