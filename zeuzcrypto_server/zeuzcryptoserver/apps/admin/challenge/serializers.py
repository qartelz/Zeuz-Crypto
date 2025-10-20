from rest_framework import serializers
from decimal import Decimal
from .models import *


# ============================================================================
# WALLET SERIALIZERS
# ============================================================================

class ChallengeWalletSerializer(serializers.ModelSerializer):
    total_balance = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    challenge_week = serializers.CharField(source='participation.week.title', read_only=True)
    
    class Meta:
        model = ChallengeWallet
        fields = ['id', 'user', 'user_email', 'participation', 'challenge_week',
                  'initial_balance', 'available_balance', 'locked_balance', 
                  'earned_balance', 'total_balance', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'available_balance', 'locked_balance', 'earned_balance', 'created_at', 'updated_at']


class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeWalletTransaction
        fields = ['id', 'wallet', 'transaction_type', 'amount', 'balance_before', 
                  'balance_after', 'description', 'trade', 'created_at']
        read_only_fields = ['id', 'created_at']


# ============================================================================
# TRADE SERIALIZERS
# ============================================================================

class FuturesDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeFuturesDetails
        fields = ['leverage', 'margin_required', 'expiry_date']


class OptionsDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeOptionsDetails
        fields = ['option_type', 'position', 'strike_price', 'expiry_date', 'premium']


class ChallengeTradeSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    challenge_week_title = serializers.CharField(source='challenge_week.title', read_only=True)
    total_pnl = serializers.DecimalField(max_digits=20, decimal_places=8, read_only=True)
    holding_duration_hours = serializers.FloatField(read_only=True)
    futures_details = FuturesDetailsSerializer(required=False, allow_null=True)
    options_details = OptionsDetailsSerializer(required=False, allow_null=True)
    
    class Meta:
        model = ChallengeTrade
        fields = ['id', 'user', 'user_email', 'participation', 'wallet', 'challenge_week',
                  'challenge_week_title', 'asset_symbol', 'asset_name', 'trade_type', 
                  'direction', 'status', 'total_quantity', 'remaining_quantity', 
                  'average_entry_price', 'current_price', 'entry_amount', 'exit_price',
                  'realized_pnl', 'unrealized_pnl', 'total_pnl', 'allocation_percentage',
                  'holding_duration_hours', 'opened_at', 'closed_at', 'updated_at',
                  'futures_details', 'options_details']
        read_only_fields = ['id', 'user', 'realized_pnl', 'unrealized_pnl', 'remaining_quantity',
                            'entry_amount', 'allocation_percentage', 'opened_at', 'closed_at', 'updated_at']


class PlaceTradeSerializer(serializers.Serializer):
    """Place new trade"""
    participation_id = serializers.UUIDField()
    asset_symbol = serializers.CharField(max_length=20)
    asset_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    trade_type = serializers.ChoiceField(choices=['SPOT', 'FUTURES', 'OPTIONS'])
    direction = serializers.ChoiceField(choices=['BUY', 'SELL'])
    quantity = serializers.DecimalField(max_digits=20, decimal_places=8)
    price = serializers.DecimalField(max_digits=20, decimal_places=8)
    
    # Futures fields
    leverage = serializers.DecimalField(max_digits=5, decimal_places=2, required=False)
    margin_required = serializers.DecimalField(max_digits=20, decimal_places=8, required=False)
    futures_expiry_date = serializers.DateField(required=False)
    
    # Options fields
    option_type = serializers.ChoiceField(choices=['CALL', 'PUT'], required=False)
    option_position = serializers.ChoiceField(choices=['LONG', 'SHORT'], required=False)
    strike_price = serializers.DecimalField(max_digits=20, decimal_places=8, required=False)
    options_expiry_date = serializers.DateField(required=False)
    premium = serializers.DecimalField(max_digits=20, decimal_places=8, required=False)


class CloseTradeSerializer(serializers.Serializer):
    """Close trade (full or partial)"""
    exit_price = serializers.DecimalField(max_digits=20, decimal_places=8)
    exit_quantity = serializers.DecimalField(max_digits=20, decimal_places=8)


class UpdatePriceSerializer(serializers.Serializer):
    """Update current market price"""
    current_price = serializers.DecimalField(max_digits=20, decimal_places=8)


class TradeHistorySerializer(serializers.ModelSerializer):
    asset_symbol = serializers.CharField(source='trade.asset_symbol', read_only=True)
    
    class Meta:
        model = ChallengeTradeHistory
        fields = ['id', 'trade', 'user', 'asset_symbol', 'action', 'quantity', 
                  'price', 'amount', 'realized_pnl', 'created_at']
        read_only_fields = ['id', 'created_at']


# ============================================================================
# ANALYTICS SERIALIZERS
# ============================================================================

class AnalyticsSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    challenge_week = serializers.CharField(source='participation.week.title', read_only=True)
    
    class Meta:
        model = ChallengeTradeAnalytics
        fields = ['id', 'participation', 'user', 'user_email', 'challenge_week',
                  'total_trades', 'open_trades', 'closed_trades', 'profitable_trades', 
                  'losing_trades', 'spot_trades', 'futures_trades', 'options_trades',
                  'total_realized_pnl', 'total_unrealized_pnl', 'win_rate', 'profit_factor',
                  'initial_portfolio_value', 'current_portfolio_value', 'portfolio_return_percentage',
                  'average_allocation_per_trade', 'max_allocation_per_trade',
                  'pnl_score', 'money_management_score', 'capital_allocation_score',
                  'total_score', 'behavioral_tag', 'last_calculated_at', 'created_at']
        read_only_fields = ['id', 'created_at', 'last_calculated_at']


# ============================================================================
# LEADERBOARD SERIALIZERS
# ============================================================================

class LeaderboardSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source='user.id', read_only=True)
    
    class Meta:
        model = ChallengeLeaderboard
        fields = ['id', 'challenge_week', 'participation', 'user', 'user_id', 
                  'rank', 'total_score', 'portfolio_return_percentage', 'total_trades',
                  'win_rate', 'behavioral_tag', 'user_display_name', 'last_updated']
        read_only_fields = ['id', 'last_updated']


# ============================================================================
# REWARD SERIALIZERS
# ============================================================================

class RewardDistributionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    challenge_week = serializers.CharField(source='participation.week.title', read_only=True)
    processed_by_email = serializers.EmailField(source='processed_by.email', read_only=True, allow_null=True)
    
    class Meta:
        model = ChallengeRewardDistribution
        fields = ['id', 'user', 'user_email', 'participation', 'challenge_week',
                  'reward_type', 'coin_amount', 'description', 'status',
                  'wallet_transaction', 'processed_by', 'processed_by_email',
                  'error_message', 'created_at', 'processed_at']
        read_only_fields = ['id', 'wallet_transaction', 'processed_by', 
                            'error_message', 'created_at', 'processed_at']


class CreateRewardSerializer(serializers.Serializer):
    """Create reward (admin)"""
    participation_id = serializers.UUIDField()
    reward_type = serializers.ChoiceField(choices=['COMPLETION_BONUS', 'PROFIT_BONUS', 'LEADERBOARD_PRIZE'])
    coin_amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    description = serializers.CharField(max_length=500)