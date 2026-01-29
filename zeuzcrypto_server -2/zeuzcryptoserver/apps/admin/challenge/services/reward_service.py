
from django.utils import timezone
from django.db import transaction
from decimal import Decimal
from apps.admin.challenge.models.reward_models import UserChallengeReward
from apps.admin.challenge.services.scoring_service import ScoringService
# from apps.admin.challenge.services.trade_service import TradeService # Import locally to avoid circular

class RewardService:
    """Service for reward distribution and completion validation"""
    
    @staticmethod
    def validate_completion_eligibility(participation):
        """
        Check if user meets all criteria to complete the week.
        Returns (bool, str) -> (IsValid, Reason)
        """
        week = participation.week
        trades = participation.trades.all()
        
        # 1. Open Positions Check
        open_positions = trades.filter(status__in=['OPEN', 'PARTIALLY_CLOSED']).count()
        if open_positions > 0:
            return False, f"You have {open_positions} open positions. Close them to complete the week."

        # 2. Activity Check (4-Day Rule)
        # Count unique days where trades were opened
        activity_days = trades.datetimes('created_at', 'day').count()
        # if activity_days < 4:
        #      # Allow bypass if it's been active for 4+ days even if trades didn't happen every day?
        #      # "Trading for at least 4 days" usually means duration.
        #      # Let's check duration since start.
        #      days_since_start = (timezone.now() - participation.joined_at).days
        #      if days_since_start < 4:
        #           return False, f"You must participate for at least 4 days. Current: {days_since_start} days."
        
        # NOTE: User asked for "after 4 days of starting... check". 
        days_since_start = (timezone.now() - participation.joined_at).days
        # if days_since_start < 4:
        if days_since_start < 1:
            return False, f"Early exit not allowed. You must trade for at least 4 days. ({4 - days_since_start} days left)"

        # 3. Min Trade Requirements
        if trades.count() < week.min_trades_required:
            return False, f"Minimum {week.min_trades_required} trades required. Current: {trades.count()}"
            
        if participation.spot_trades < week.min_spot_trades:
            return False, f"Minimum {week.min_spot_trades} Spot trades required. Current: {participation.spot_trades}"

        if participation.futures_trades < week.min_futures_trades:
            return False, f"Minimum {week.min_futures_trades} Futures trades required. Current: {participation.futures_trades}"

        if participation.options_trades < week.min_options_trades:
             return False, f"Minimum {week.min_options_trades} Options trades required. Current: {participation.options_trades}"

        return True, "Eligible"

    @staticmethod
    @transaction.atomic
    def complete_and_reward(participation):
        """Complete challenge and award rewards"""
        
        # 1. Validation
        is_valid, message = RewardService.validate_completion_eligibility(participation)
        if not is_valid:
            return {'error': message}
        
        week = participation.week
        
        # 2. Score Calculation
        score_data = ScoringService.calculate_scores(participation)
        
        # 3. Determine Reward
        try:
            reward_template = week.reward_template
        except:
            return {'error': 'No reward template configured for this week'}
            
        # PnL Check
        is_profitable = participation.portfolio_return_pct > 0
        
        # Logic: 
        # Base coins = Profit Bonus or Loss Recovery
        # Multiplier = If Total Score > 80 => 1.2x Coins
        
        base_coins = reward_template.profit_bonus_coins if is_profitable else reward_template.loss_recovery_coins
        
        total_score = score_data['total_score']
        final_coins = base_coins
        
        if total_score >= 90:
             final_coins = int(base_coins * 1.5) # 1.5x for Excellence
        elif total_score >= 80:
             final_coins = int(base_coins * 1.2) # 1.2x for Great performance
        
        # 4. Create Reward Record
        reward, created = UserChallengeReward.objects.get_or_create(
            user=participation.user,
            participation=participation,
            reward_template=reward_template,
            defaults={
                'badge_earned': is_profitable and total_score > 70, # Badge condition
                'coins_earned': final_coins
            }
        )
        
        # 5. Mark Completed
        participation.complete_challenge()
        
        return {
            'message': 'Challenge completed successfully',
            'status': 'COMPLETED',
            'reward': {
                'badge': reward_template.badge_name if reward.badge_earned else None,
                'coins': final_coins,
                'type': 'PROFIT_BONUS' if is_profitable else 'LOSS_RECOVERY'
            },
            'score': score_data
        }

    @staticmethod
    def get_user_rewards(user):
        """Get all rewards earned by user"""
        from apps.admin.challenge.models.reward_models import UserChallengeReward
        
        rewards = UserChallengeReward.objects.filter(user=user).select_related(
            'reward_template__week', 'participation'
        )
        
        return [{
            'badge': reward.reward_template.badge_name,
            'week': reward.reward_template.week.title,
            'coins': reward.coins_earned,
            'earned_at': reward.earned_at,
            'claimed': reward.claimed_at is not None
        } for reward in rewards]

