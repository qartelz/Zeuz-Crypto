
# ==================== FILE: apps/challenges/services/admin_service.py ====================

from django.db.models import Sum, Count, Avg, Q
from django.core.paginator import Paginator
from django.http import HttpResponse
import csv

# from apps.challenges.models import (
#     ChallengeProgram, ChallengeWeek, ChallengeStatistics,
#     UserChallengeParticipation, UserChallengeReward, ChallengeScore
# )
from apps.admin.challenge.models.challenge_models import ChallengeProgram,ChallengeStatistics,ChallengeWeek
from apps.admin.challenge.models.analytics_models import  ChallengeScore
from apps.admin.challenge.models.challenge_models import UserChallengeParticipation
from apps.admin.challenge.models.reward_models import UserChallengeReward


class AdminService:
    """Service for admin operations"""
    
    @staticmethod
    def get_all_programs_with_stats():
        """Get all programs with statistics"""
        programs = ChallengeProgram.objects.all()
        
        data = []
        for program in programs:
            total_participants = UserChallengeParticipation.objects.filter(
                week__program=program
            ).count()
            
            total_coins = UserChallengeReward.objects.filter(
                participation__week__program=program
            ).aggregate(total=Sum('coins_earned'))['total'] or 0
            
            data.append({
                'id': str(program.id),
                'name': program.name,
                'difficulty': program.difficulty,
                'is_active': program.is_active,
                'weeks_count': program.weeks.count(),
                'total_participants': total_participants,
                'total_coins_distributed': total_coins,
                'created_at': program.created_at,
            })
        
        return data
    
    @staticmethod
    def get_program_details(program):
        """Get detailed program information"""
        weeks_data = []
        for week in program.weeks.all():
            participants = UserChallengeParticipation.objects.filter(week=week)
            completed = participants.filter(status='COMPLETED').count()
            
            weeks_data.append({
                'id': str(week.id),
                'title': week.title,
                'week_number': week.week_number,
                'trading_type': week.trading_type,
                'participants': participants.count(),
                'completions': completed,
                'completion_rate': (completed / max(participants.count(), 1)) * 100,
            })
        
        return {
            'id': str(program.id),
            'name': program.name,
            'description': program.description,
            'difficulty': program.difficulty,
            'weeks': weeks_data,
        }
    
    @staticmethod
    def get_week_participants(week, page=1, page_size=20):
        """Get all participants for a week"""
        participants = UserChallengeParticipation.objects.filter(week=week).select_related(
            'user', 'score'
        ).prefetch_related('earned_rewards')
        
        paginator = Paginator(participants, page_size)
        page_obj = paginator.get_page(page)
        
        data = []
        for participation in page_obj:
            score = participation.score if hasattr(participation, 'score') else None
            rewards = participation.earned_rewards.first()
            
            data.append({
                'user_email': participation.user.email,
                'user_id': str(participation.user.id),
                'status': participation.status,
                'portfolio_return_pct': str(participation.portfolio_return_pct),
                'total_trades': participation.total_trades,
                'pnl_score': str(score.pnl_score) if score else '0',
                'total_score': str(score.total_score) if score else '0',
                'behavioral_tag': score.behavioral_tag if score else 'N/A',
                'badge_earned': rewards.badge_earned if rewards else False,
                'coins_earned': rewards.coins_earned if rewards else 0,
            })
        
        return {
            'count': paginator.count,
            'pages': paginator.num_pages,
            'current_page': page,
            'results': data
        }
    
    @staticmethod
    def get_week_statistics(week):
        """Get week statistics"""
        try:
            stats = week.statistics
            from apps.admin.challenge.serializers.admin_serializers import ChallengeStatisticsSerializer
            return ChallengeStatisticsSerializer(stats).data
        except:
            return None
    
    @staticmethod
    def calculate_week_statistics(week):
        """Calculate and update statistics for a week"""
        from decimal import Decimal
        
        participations = UserChallengeParticipation.objects.filter(week=week)
        scores = ChallengeScore.objects.filter(participation__week=week)
        
        total_enrollments = participations.count()
        completions = participations.filter(status='COMPLETED').count()
        abandonments = participations.filter(status='ABANDONED').count()
        
        completion_rate = (completions / total_enrollments * 100) if total_enrollments > 0 else 0
        
        # Calculate averages
        avg_return = participations.aggregate(avg=Avg('portfolio_return_pct'))['avg'] or 0
        avg_score = scores.aggregate(avg=Avg('total_score'))['avg'] or 0
        avg_trades = participations.aggregate(avg=Avg('total_trades'))['avg'] or 0
        
        # Count behavioral tags
        behavior_counts = scores.values('behavioral_tag').annotate(count=Count('id'))
        behavior_dict = {item['behavioral_tag']: item['count'] for item in behavior_counts}
        
        # Calculate coin distribution
        total_coins = UserChallengeReward.objects.filter(
            participation__week=week
        ).aggregate(total=Sum('coins_earned'))['total'] or 0
        
        badges_awarded = UserChallengeReward.objects.filter(
            participation__week=week,
            badge_earned=True
        ).count()
        
        stats, created = ChallengeStatistics.objects.update_or_create(
            week=week,
            defaults={
                'total_enrollments': total_enrollments,
                'completions': completions,
                'abandonments': abandonments,
                'completion_rate': Decimal(str(completion_rate)),
                'avg_portfolio_return': Decimal(str(avg_return)),
                'avg_total_score': Decimal(str(avg_score)),
                'avg_trades_per_user': Decimal(str(avg_trades)),
                'disciplined_traders': behavior_dict.get('DISCIPLINED', 0),
                'balanced_traders': behavior_dict.get('BALANCED', 0),
                'aggressive_traders': behavior_dict.get('AGGRESSIVE', 0),
                'reckless_traders': behavior_dict.get('RECKLESS', 0),
                'total_coins_distributed': total_coins,
                'badges_awarded': badges_awarded,
            }
        )
        
        from apps.admin.challenge.serializers.admin_serializers import ChallengeStatisticsSerializer
        return ChallengeStatisticsSerializer(stats).data
    
    @staticmethod
    def export_participants_csv(week):
        """Export participants to CSV"""
        participants = UserChallengeParticipation.objects.filter(week=week).select_related(
            'user', 'score'
        ).prefetch_related('earned_rewards')
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="week_{week.week_number}_participants.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Email', 'Status', 'Starting Balance', 'Current Balance', 'Return %',
            'Total Trades', 'Spot', 'Futures', 'Options',
            'PnL Score', 'MM Score', 'CA Score', 'Total Score', 'Behavioral Tag',
            'Badge', 'Coins', 'Joined At', 'Completed At'
        ])
        
        for participation in participants:
            score = participation.score if hasattr(participation, 'score') else None
            rewards = participation.earned_rewards.first()
            
            writer.writerow([
                participation.user.email,
                participation.status,
                participation.starting_balance,
                participation.current_balance,
                participation.portfolio_return_pct,
                participation.total_trades,
                participation.spot_trades,
                participation.futures_trades,
                participation.options_trades,
                score.pnl_score if score else 0,
                score.money_management_score if score else 0,
                score.capital_allocation_score if score else 0,
                score.total_score if score else 0,
                score.behavioral_tag if score else 'N/A',
                rewards.reward_template.badge_name if rewards else 'N/A',
                rewards.coins_earned if rewards else 0,
                participation.joined_at,
                participation.completed_at,
            ])
        
        return response

