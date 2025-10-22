# ==================== FILE: apps/challenges/services/reward_service.py ====================

from django.utils import timezone
from django.db import transaction
# from apps.admin.challenge.models.reward.models import UserChallengeReward
# from apps.admin.challenge.models.reward.models import UserChallengeReward
from apps.admin.challenge.models.reward_models import UserChallengeReward
from apps.admin.challenge.services.scoring_service import ScoringService



class RewardService:
    """Service for reward distribution"""
    
    @staticmethod
    @transaction.atomic
    def complete_and_reward(participation):
        """Complete challenge and award rewards"""
        week = participation.week
        
        # Calculate final score
        score_data = ScoringService.calculate_scores(participation)
        
        # Get reward template
        try:
            reward_template = week.reward_template
        except:
            return {
                'error': 'No reward template configured for this week'
            }
        
        # Determine coins based on profitability
        is_profitable = participation.portfolio_return_pct > 0
        coins = (
            reward_template.profit_bonus_coins 
            if is_profitable 
            else reward_template.loss_recovery_coins
        )
        
        # Create reward record
        reward, created = UserChallengeReward.objects.get_or_create(
            user=participation.user,
            participation=participation,
            reward_template=reward_template,
            defaults={
                'badge_earned': True,
                'coins_earned': coins
            }
        )
        
        # Mark participation as completed
        participation.complete_challenge()
        
        return {
            'message': 'Challenge completed successfully',
            'badge': reward_template.badge_name,
            'coins_earned': coins,
            'total_score': score_data['total_score'],
            'behavioral_tag': score_data['behavioral_tag'],
        }
    
    @staticmethod
    def get_user_rewards(user):
        """Get all rewards earned by user"""
        # from apps.challenges.models import UserChallengeReward
        # from apps.admin.challenge.models.reward.models import UserChallengeReward
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

