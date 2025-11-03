# ==================== FILE: apps/challenges/serializers/challenge_serializers.py ====================

from rest_framework import serializers
# from apps.admin.challenge import (
#     ChallengeProgram, ChallengeWeek, ChallengeTask,
#     UserChallengeParticipation, ChallengeScore, ChallengeReward
# )
from apps.admin.challenge.models.challenge_models import ChallengeProgram, ChallengeWeek, ChallengeTask
from apps.admin.challenge.models.challenge_models import UserChallengeParticipation
from apps.admin.challenge.models.analytics_models import ChallengeScore
from apps.admin.challenge.models.challenge_models import ChallengeReward



class ChallengeProgramSerializer(serializers.ModelSerializer):
    weeks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChallengeProgram
        fields = [
            'id', 'name', 'description', 'difficulty',
            'is_active', 'weeks_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_weeks_count(self, obj):
        return obj.weeks.count()

#
# class ChallengeTaskSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = ChallengeTask
#         fields = [
#             'id', 'title', 'description', 'task_type',
#             'target_value', 'is_mandatory', 'order'
#         ]
#         read_only_fields = ['id']
#
class ChallengeTaskSerializer(serializers.ModelSerializer):
    # Allow passing week as an ID
    week = serializers.PrimaryKeyRelatedField(
        queryset=ChallengeWeek.objects.all(),
        required=True
    )

    class Meta:
        model = ChallengeTask
        fields = [
            'id', 'week', 'title', 'description',
            'task_type', 'target_value',
            'is_mandatory', 'order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        """Extra validation for task creation and update"""
        task_type = data.get('task_type')
        target_value = data.get('target_value')

        # Enforce target_value for numeric tasks
        if task_type in ['TRADE_COUNT', 'PORTFOLIO_BALANCE', 'PROFIT_TARGET', 'HOLDING_PERIOD']:
            if target_value is None:
                raise serializers.ValidationError({
                    "target_value": f"Target value is required for {task_type} tasks."
                })
            if target_value <= 0:
                raise serializers.ValidationError({
                    "target_value": "Target value must be greater than zero."
                })

        # Optional: enforce unique order per week
        week = data.get('week')
        order = data.get('order')
        if week and order is not None:
            if ChallengeTask.objects.filter(week=week, order=order).exists():
                raise serializers.ValidationError({
                    "order": "A task with this order already exists in the same week."
                })

        return data
class ChallengeRewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeReward
        fields = [
            'id', 'badge_name', 'badge_description', 'badge_icon',
            'profit_bonus_coins', 'loss_recovery_coins', 'is_active'
        ]
        read_only_fields = ['id']


class ChallengeWeekSerializer(serializers.ModelSerializer):
    tasks = ChallengeTaskSerializer(many=True, read_only=True)
    reward = ChallengeRewardSerializer(source='reward_template', read_only=True)
    is_ongoing = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    program_name = serializers.CharField(source='program.name', read_only=True)
    
    class Meta:
        model = ChallengeWeek
        fields = [
            'id', 'program', 'program_name', 'title', 'week_number',
            'trading_type', 'description', 'learning_outcome',
            'target_goal', 'min_trades_required', 'start_date', 'end_date',
            'is_active', 'tasks', 'reward', 'is_ongoing', 'is_completed',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_is_ongoing(self, obj):
        return obj.is_ongoing()
    
    def get_is_completed(self, obj):
        return obj.is_completed()


class ChallengeScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeScore
        fields = [
            'pnl_score', 'money_management_score',
            'capital_allocation_score', 'total_score',
            'behavioral_tag', 'calculated_at'
        ]
        read_only_fields = '__all__'


class UserChallengeParticipationSerializer(serializers.ModelSerializer):
    week_details = ChallengeWeekSerializer(source='week', read_only=True)
    score_details = serializers.SerializerMethodField()
    wallet_balance = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = UserChallengeParticipation
        fields = [
            'id', 'user', 'user_email', 'week', 'week_details', 'status',
            'starting_balance', 'current_balance', 'total_trades',
            'spot_trades', 'futures_trades', 'options_trades',
            'portfolio_return_pct', 'joined_at', 'completed_at',
            'score_details', 'wallet_balance'
        ]
        read_only_fields = ['id', 'user', 'joined_at', 'completed_at']
    
    def get_score_details(self, obj):
        try:
            score = obj.score
            return ChallengeScoreSerializer(score).data
        except:
            return None
    
    def get_wallet_balance(self, obj):
        try:
            wallet = obj.wallet
            return {
                'initial': str(wallet.initial_balance),
                'available': str(wallet.available_balance),
                'locked': str(wallet.locked_balance),
                'earned': str(wallet.earned_balance),
                'total': str(wallet.total_balance)
            }
        except:
            return None


class UserChallengeParticipationListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    week_title = serializers.CharField(source='week.title', read_only=True)
    week_number = serializers.IntegerField(source='week.week_number', read_only=True)
    program_name = serializers.CharField(source='week.program.name', read_only=True)
    
    class Meta:
        model = UserChallengeParticipation
        fields = [
            'id', 'program_name', 'week_title', 'week_number', 'status',
            'portfolio_return_pct', 'total_trades', 'joined_at', 'completed_at'
        ]
        read_only_fields = '__all__'

