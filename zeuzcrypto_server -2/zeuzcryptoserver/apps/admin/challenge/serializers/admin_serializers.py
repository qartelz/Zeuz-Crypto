
# ==================== FILE: apps/challenges/serializers/admin_serializers.py ====================

from rest_framework import serializers
# from apps.admin.challenge.models import (
#     ChallengeProgram, ChallengeWeek, ChallengeStatistics,
#     UserChallengeParticipation, ChallengeLeaderboard
# )
from apps.admin.challenge.models.challenge_models import ChallengeProgram, ChallengeWeek, ChallengeStatistics
from apps.admin.challenge.models.challenge_models import UserChallengeParticipation
from apps.admin.challenge.models.analytics_models import ChallengeLeaderboard
class ChallengeProgramAdminSerializer(serializers.ModelSerializer):
    weeks = serializers.SerializerMethodField()
    total_participants = serializers.SerializerMethodField()
    
    class Meta:
        model = ChallengeProgram
        fields = '__all__'
    

    def validate(self, attrs):
        difficulty = attrs.get("difficulty")
        is_active = attrs.get("is_active", True)

        # Check if another active challenge of same difficulty exists
        if is_active and ChallengeProgram.objects.filter(difficulty=difficulty, is_active=True).exists():
            raise serializers.ValidationError(
                f"An active challenge with difficulty '{difficulty}' already exists. "
                "Please deactivate it before creating another one."
            )
        return attrs
    
    def get_weeks(self, obj):
        return obj.weeks.count()
    
    def get_total_participants(self, obj):
        return UserChallengeParticipation.objects.filter(week__program=obj).count()


class ChallengeWeekAdminSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)
    participants_count = serializers.SerializerMethodField()
    completions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChallengeWeek
        fields = '__all__'
    
    def validate(self, attrs):
        trading_type = attrs.get('trading_type')
        if not trading_type and self.instance:
            trading_type = self.instance.trading_type
            
        min_spot = attrs.get('min_spot_trades', 0)
        min_futures = attrs.get('min_futures_trades', 0)
        min_options = attrs.get('min_options_trades', 0)
        
        # If updating, use existing values if not provided
        if self.instance:
            min_spot = attrs.get('min_spot_trades', self.instance.min_spot_trades)
            min_futures = attrs.get('min_futures_trades', self.instance.min_futures_trades)
            min_options = attrs.get('min_options_trades', self.instance.min_options_trades)
            
        total_required = attrs.get('min_trades_required')
        if total_required is None and self.instance:
            total_required = self.instance.min_trades_required

        # Validate specific requirements based on trading type
        if trading_type == 'SPOT':
            if min_spot <= 0:
                raise serializers.ValidationError({
                    "min_spot_trades": "For SPOT trading type, minimum spot trades must be greater than 0."
                })
            if min_futures > 0 or min_options > 0:
                raise serializers.ValidationError({
                    "trading_type": "SPOT trading type cannot have futures or options requirements."
                })
                
        elif trading_type == 'SPOT_FUTURES':
            if min_spot <= 0:
                raise serializers.ValidationError({
                    "min_spot_trades": "For SPOT_FUTURES trading type, minimum spot trades must be greater than 0."
                })
            if min_futures <= 0:
                raise serializers.ValidationError({
                    "min_futures_trades": "For SPOT_FUTURES trading type, minimum futures trades must be greater than 0."
                })
            if min_options > 0:
                raise serializers.ValidationError({
                    "trading_type": "SPOT_FUTURES trading type cannot have options requirements."
                })
                
        elif trading_type == 'SPOT_FUTURES_OPTIONS' or trading_type == 'PORTFOLIO':
            if min_spot <= 0:
                raise serializers.ValidationError({
                    "min_spot_trades": f"For {trading_type} trading type, minimum spot trades must be greater than 0."
                })
            if min_futures <= 0:
                raise serializers.ValidationError({
                    "min_futures_trades": f"For {trading_type} trading type, minimum futures trades must be greater than 0."
                })
            if min_options <= 0:
                raise serializers.ValidationError({
                    "min_options_trades": f"For {trading_type} trading type, minimum options trades must be greater than 0."
                })

        # Validate total trades match sum of specific requirements
        calculated_total = min_spot + min_futures + min_options
        if total_required < calculated_total:
             raise serializers.ValidationError({
                "min_trades_required": f"Total required trades ({total_required}) cannot be less than the sum of specific requirements ({calculated_total})."
            })
            
        return attrs

    def get_participants_count(self, obj):
        return obj.participants.count()
    
    def get_completions_count(self, obj):
        return obj.participants.filter(status='COMPLETED').count()


class ChallengeStatisticsSerializer(serializers.ModelSerializer):
    week_title = serializers.CharField(source='week.title', read_only=True)
    week_number = serializers.IntegerField(source='week.week_number', read_only=True)
    
    class Meta:
        model = ChallengeStatistics
        fields = [
            'id', 'week', 'week_title', 'week_number',
            'total_enrollments', 'completions', 'abandonments',
            'completion_rate', 'avg_portfolio_return', 'avg_total_score',
            'avg_trades_per_user', 'disciplined_traders', 'balanced_traders',
            'aggressive_traders', 'reckless_traders',
            'total_coins_distributed', 'badges_awarded', 'calculated_at'
        ]
        read_only_fields = '__all__'


class ChallengeParticipantReportSerializer(serializers.Serializer):
    """Report serializer for participant data"""
    user_email = serializers.EmailField()
    user_id = serializers.UUIDField()
    week_title = serializers.CharField()
    status = serializers.CharField()
    starting_balance = serializers.DecimalField(max_digits=20, decimal_places=2)
    current_balance = serializers.DecimalField(max_digits=20, decimal_places=2)
    portfolio_return_pct = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_trades = serializers.IntegerField()
    spot_trades = serializers.IntegerField()
    futures_trades = serializers.IntegerField()
    options_trades = serializers.IntegerField()
    pnl_score = serializers.DecimalField(max_digits=5, decimal_places=2)
    money_management_score = serializers.DecimalField(max_digits=5, decimal_places=2)
    capital_allocation_score = serializers.DecimalField(max_digits=5, decimal_places=2)
    total_score = serializers.DecimalField(max_digits=5, decimal_places=2)
    behavioral_tag = serializers.CharField()
    badge_earned = serializers.BooleanField()
    coins_earned = serializers.IntegerField()
    joined_at = serializers.DateTimeField()
    completed_at = serializers.DateTimeField(allow_null=True)


class ChallengeLeaderboardSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    week_title = serializers.CharField(source='week.title', read_only=True)
    
    class Meta:
        model = ChallengeLeaderboard
        fields = [
            'rank', 'user_email', 'week_title', 'total_score',
            'portfolio_return_pct', 'total_trades', 'win_rate',
            'behavioral_tag', 'last_updated'
        ]
        read_only_fields = '__all__'