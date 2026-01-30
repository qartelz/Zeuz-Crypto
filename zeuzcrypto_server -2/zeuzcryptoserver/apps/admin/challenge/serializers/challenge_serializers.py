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
            'target_goal', 'min_trades_required', 
            'min_spot_trades', 'min_futures_trades', 'min_options_trades',
            'start_date', 'end_date',
            'is_active', 'tasks', 'reward', 'is_ongoing', 'is_completed',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Set default values for trade count fields if not provided"""
        # Set defaults for trade count fields
        if 'min_spot_trades' not in data or data['min_spot_trades'] is None:
            data['min_spot_trades'] = 0
        if 'min_futures_trades' not in data or data['min_futures_trades'] is None:
            data['min_futures_trades'] = 0
        if 'min_options_trades' not in data or data['min_options_trades'] is None:
            data['min_options_trades'] = 0
        
        return data
    
    def create(self, validated_data):
        """Override create to ensure trade count fields are set"""
        # Ensure these fields are never None
        validated_data.setdefault('min_spot_trades', 0)
        validated_data.setdefault('min_futures_trades', 0)
        validated_data.setdefault('min_options_trades', 0)
        
        return super().create(validated_data)
    
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
    tier_info = serializers.SerializerMethodField()
    current_level_info = serializers.SerializerMethodField()
    tier_info = serializers.SerializerMethodField()
    current_level_info = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    reward_earned = serializers.SerializerMethodField()
    
    class Meta:
        model = UserChallengeParticipation
        fields = [
            'id', 'user', 'user_email', 'week', 'week_details', 'status',
            'starting_balance', 'current_balance', 'total_trades',
            'spot_trades', 'futures_trades', 'options_trades',
            'portfolio_return_pct', 'joined_at', 'completed_at',
            'score_details', 'wallet_balance', 'tier_info', 'current_level_info', 'reward_earned'
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
                'id': str(wallet.id),
                'initial': str(wallet.initial_balance),
                'available': str(wallet.available_balance),
                'locked': str(wallet.locked_balance),
                'earned': str(wallet.earned_balance),
                'total': str(wallet.total_balance),
                'current': str(wallet.current_balance)
            }
        except:
            return None

    def get_tier_info(self, obj):
        try:
            score = float(obj.score.total_score)
            if score >= 76:
                return {'name': 'Firecracker', 'color': 'text-orange-400', 'range': '76 - 100%'}
            elif score >= 51:
                return {'name': 'Wave Hopper', 'color': 'text-yellow-400', 'range': '51 - 75%'}
            elif score >= 26:
                return {'name': 'Coin Scout', 'color': 'text-blue-400', 'range': '26 - 50%'}
            else:
                return {'name': 'Byte Bouncer', 'color': 'text-purple-400', 'range': '0 - 25%'}
        except:
             return {'name': 'Byte Bouncer', 'color': 'text-purple-400', 'range': '0 - 25%'}

    def get_current_level_info(self, obj):
        try:
            week_num = obj.week.week_number
            # Simple mapping based on week number
            tiers = [
                {'week': 1, 'name': 'Bronze', 'level': 'Beginner - Level 1'},
                {'week': 2, 'name': 'Silver', 'level': 'Intermediate - Level 2'},
                {'week': 3, 'name': 'Gold', 'level': 'Advanced - Level 3'},
                {'week': 4, 'name': 'Platinum', 'level': 'Master - Level 4'},
            ]
            current = next((t for t in tiers if t['week'] == week_num), tiers[0])
            return current
        except:
            return {'name': 'Bronze', 'level': 'Beginner - Level 1'}

    def get_reward_earned(self, obj):
        try:
            # Check related UserChallengeReward via related_name='earned_rewards'
            reward = obj.earned_rewards.first()
            if reward:
                return {
                    'badge_name': reward.reward_template.badge_name,
                    'badge_icon': reward.reward_template.badge_icon,
                    'coins_earned': reward.coins_earned,
                    'earned_at': reward.earned_at
                }
            return None
        except Exception:
            return None


from apps.admin.challenge.models.evaluation_models import ChallengeEvaluationReport
from apps.admin.challenge.models.reward_models import UserChallengeReward

class ChallengeEvaluationReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeEvaluationReport
        fields = [
            'task_discipline_score', 'trading_discipline_score', 
            'profit_outcome_score', 'consistency_bonus_score',
            'final_score', 'tier_name', 'behavioral_tag', 
            'key_issue', 'next_challenge_focus'
        ]

class UserChallengeRewardDetailSerializer(serializers.ModelSerializer):
    """Detailed user reward with full evaluation report and portfolio context"""
    # Week Info
    week_title = serializers.CharField(source='reward_template.week.title', read_only=True)
    week_id = serializers.UUIDField(source='reward_template.week.id', read_only=True)
    week_number = serializers.IntegerField(source='reward_template.week.week_number', read_only=True)
    week_target_goal = serializers.DecimalField(source='reward_template.week.target_goal', max_digits=10, decimal_places=2, read_only=True)
    
    # Badge Info
    badge_name = serializers.CharField(source='reward_template.badge_name', read_only=True)
    badge_description = serializers.CharField(source='reward_template.badge_description', read_only=True)
    badge_icon = serializers.URLField(source='reward_template.badge_icon', read_only=True)
    
    # Portfolio Metrics (from Participation)
    starting_balance = serializers.DecimalField(source='participation.starting_balance', max_digits=20, decimal_places=8, read_only=True)
    current_balance = serializers.DecimalField(source='participation.current_balance', max_digits=20, decimal_places=8, read_only=True)
    portfolio_return_pct = serializers.DecimalField(source='participation.portfolio_return_pct', max_digits=10, decimal_places=2, read_only=True)
    
    # Trade Counts
    total_trades = serializers.IntegerField(source='participation.total_trades', read_only=True)
    spot_trades = serializers.IntegerField(source='participation.spot_trades', read_only=True)
    futures_trades = serializers.IntegerField(source='participation.futures_trades', read_only=True)
    options_trades = serializers.IntegerField(source='participation.options_trades', read_only=True)
    
    # Wallet Info
    wallet_data = serializers.SerializerMethodField()
    
    # Evaluation
    evaluation = serializers.SerializerMethodField()
    
    # Calculated Fields
    total_pnl = serializers.SerializerMethodField()
    capital_usage_pct = serializers.SerializerMethodField()
    
    class Meta:
        model = UserChallengeReward
        fields = [
            'id', 'week_title', 'week_id', 'week_number', 'week_target_goal',
            'badge_name', 'badge_description', 'badge_icon',
            'coins_earned', 'badge_earned', 'reward_type',
            'total_score', 'behavioral_tag', 'earned_at',
            'starting_balance', 'current_balance', 'portfolio_return_pct',
            'total_pnl', 'total_trades', 'spot_trades', 'futures_trades', 'options_trades',
            'wallet_data', 'capital_usage_pct',
            'evaluation'
        ]
        
    def get_total_pnl(self, obj):
        try:
            return obj.participation.current_balance - obj.participation.starting_balance
        except:
            return 0
            
    def get_capital_usage_pct(self, obj):
        try:
            # Calculate capital usage based on locked vs initial balance if available, 
            # or some other metric. For now, let's use (initial - available) / initial
            wallet = obj.participation.wallet
            if wallet.initial_balance > 0:
                used = wallet.initial_balance - wallet.available_balance
                # Ensure we don't return negative usage if something is weird
                return max(0, (used / wallet.initial_balance) * 100)
            return 0
        except:
            return 0
            
    def get_wallet_data(self, obj):
        try:
            wallet = obj.participation.wallet
            return {
                'initial': str(wallet.initial_balance),
                'available': str(wallet.available_balance),
                'locked': str(wallet.locked_balance),
                'earned': str(wallet.earned_balance),
                'total': str(wallet.total_balance)
            }
        except:
            return None
            
    def get_evaluation(self, obj):
        try:
            # Join via Participation -> Evaluation
            report = obj.participation.evaluation_report
            return ChallengeEvaluationReportSerializer(report).data
        except:
            return None

class UserChallengeParticipationListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views"""
    week_title = serializers.CharField(source='week.title', read_only=True)
    week_number = serializers.IntegerField(source='week.week_number', read_only=True)
    program_name = serializers.CharField(source='week.program.name', read_only=True)
    week_id = serializers.UUIDField(source='week.id', read_only=True)
    program_id = serializers.UUIDField(source='week.program.id', read_only=True)
    
    class Meta:
        model = UserChallengeParticipation
        fields = [
            'id', 'program_name', 'program_id', 
            'week_title', 'week_number', 'week_id',
            'status', 'portfolio_return_pct', 'total_trades', 
            'joined_at', 'completed_at'
        ]
        # read_only_fields must be a list or tuple
        read_only_fields = fields

