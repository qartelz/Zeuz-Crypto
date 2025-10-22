
# ==================== FILE: apps/challenges/services/leaderboard_service.py ====================

from django.db.models import Avg, Sum
from apps.admin.challenge.models.challenge_models import  UserChallengeParticipation
from apps.admin.challenge.models.analytics_models import ChallengeLeaderboard, ChallengeScore
from apps.accounts.models import User

class LeaderboardService:
    """Service for leaderboard operations"""
    
    @staticmethod
    def get_week_leaderboard(week_id, limit=10, sort_by='total_score'):
        """Get top performers for a specific week"""
        scores = ChallengeScore.objects.filter(
            participation__week_id=week_id
        ).select_related('participation__user').order_by(f'-{sort_by}')[:limit]
        
        data = []
        rank = 1
        for score in scores:
            participation = score.participation
            data.append({
                'rank': rank,
                'user_email': participation.user.email,
                'user_id': str(participation.user.id),
                'portfolio_return_pct': str(participation.portfolio_return_pct),
                'total_score': str(score.total_score),
                'behavioral_tag': score.behavioral_tag,
                'pnl_score': str(score.pnl_score),
                'total_trades': participation.total_trades,
            })
            rank += 1
        
        return data
    
    @staticmethod
    def get_program_leaderboard(program_id, limit=10):
        """Get top performers across entire program (cumulative)"""
        user_scores = ChallengeScore.objects.filter(
            participation__week__program_id=program_id
        ).values('participation__user').annotate(
            avg_score=Avg('total_score'),
            avg_return=Avg('participation__portfolio_return_pct'),
            total_coins=Sum('participation__earned_rewards__coins_earned')
        ).order_by('-avg_score')[:limit]
        
        data = []
        rank = 1
        for item in user_scores:
            user = User.objects.get(id=item['participation__user'])
            data.append({
                'rank': rank,
                'user_email': user.email,
                'user_id': str(user.id),
                'avg_score': str(item['avg_score']),
                'avg_return': str(item['avg_return']),
                'total_coins': item['total_coins'] or 0,
            })
            rank += 1
        
        return data
    
    @staticmethod
    def get_behavioral_leaderboard(week_id, behavioral_tag='DISCIPLINED', limit=10):
        """Get users grouped by behavioral tag"""
        scores = ChallengeScore.objects.filter(
            behavioral_tag=behavioral_tag,
            participation__week_id=week_id
        ).select_related('participation__user').order_by('-total_score')[:limit]
        
        data = []
        for score in scores:
            participation = score.participation
            data.append({
                'user_email': participation.user.email,
                'user_id': str(participation.user.id),
                'total_score': str(score.total_score),
                'portfolio_return': str(participation.portfolio_return_pct),
                'capital_allocation_score': str(score.capital_allocation_score),
            })
        
        return data
    
    @staticmethod
    def update_cached_leaderboard(week):
        """Update cached leaderboard entries for a week"""
        # Clear existing entries
        ChallengeLeaderboard.objects.filter(week=week).delete()
        
        # Get sorted participations
        scores = ChallengeScore.objects.filter(
            participation__week=week
        ).select_related('participation__user', 'participation').order_by('-total_score')
        
        # Create leaderboard entries
        rank = 1
        for score in scores:
            participation = score.participation
            
            # Get analytics if available
            try:
                analytics = participation.trade_analytics
                win_rate = analytics.win_rate
            except:
                win_rate = 0
            
            ChallengeLeaderboard.objects.create(
                week=week,
                participation=participation,
                user=participation.user,
                rank=rank,
                total_score=score.total_score,
                portfolio_return_pct=participation.portfolio_return_pct,
                total_trades=participation.total_trades,
                win_rate=win_rate,
                behavioral_tag=score.behavioral_tag
            )
            rank += 1