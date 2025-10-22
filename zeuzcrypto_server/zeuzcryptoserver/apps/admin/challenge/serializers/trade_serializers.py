
# ==================== FILE: apps/challenges/serializers/trade_serializers.py ====================

from rest_framework import serializers
# from apps.admin.challenge.models import (
#     ChallengeTrade, ChallengeTradeHistory, ChallengeTradeAnalytics,
#     ChallengeFuturesDetails, ChallengeOptionsDetails
# )

from apps.admin.challenge.models.analytics_models import ChallengeTradeAnalytics
from apps.admin.challenge.models.trade_models import ChallengeFuturesDetails, ChallengeOptionsDetails,ChallengeTrade,ChallengeTradeHistory

class ChallengeTradeSerializer(serializers.ModelSerializer):
    total_pnl = serializers.ReadOnlyField()
    pnl_percentage = serializers.ReadOnlyField()
    is_profitable = serializers.ReadOnlyField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = ChallengeTrade
        fields = [
            'id', 'user_email', 'participation', 'wallet',
            'asset_symbol', 'asset_name', 'trade_type', 'direction',
            'status', 'holding_type', 'total_quantity', 'remaining_quantity',
            'average_entry_price', 'current_price', 'total_invested',
            'realized_pnl', 'unrealized_pnl', 'total_pnl', 'pnl_percentage',
            'is_profitable', 'allocation_percentage',
            'opened_at', 'closed_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user_email', 'total_pnl', 'pnl_percentage',
            'is_profitable', 'opened_at', 'updated_at'
        ]


class ChallengeTradeCreateSerializer(serializers.Serializer):
    participation_id = serializers.UUIDField()
    asset_symbol = serializers.CharField(max_length=20)
    asset_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    trade_type = serializers.ChoiceField(choices=['SPOT', 'FUTURES', 'OPTIONS'])
    direction = serializers.ChoiceField(choices=['BUY', 'SELL'])
    total_quantity = serializers.DecimalField(max_digits=20, decimal_places=8)
    entry_price = serializers.DecimalField(max_digits=20, decimal_places=8)
    holding_type = serializers.ChoiceField(
        choices=['INTRADAY', 'SWING', 'LONGTERM'],
        default='INTRADAY'
    )
    order_type = serializers.ChoiceField(
        choices=['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'],
        default='MARKET'
    )


class ChallengeTradeCloseSerializer(serializers.Serializer):
    exit_price = serializers.DecimalField(max_digits=20, decimal_places=8)
    exit_quantity = serializers.DecimalField(max_digits=20, decimal_places=8, required=False)
    order_type = serializers.ChoiceField(
        choices=['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'],
        default='MARKET'
    )


class ChallengeTradeHistorySerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    asset_symbol = serializers.CharField(source='trade.asset_symbol', read_only=True)
    
    class Meta:
        model = ChallengeTradeHistory
        fields = [
            'id', 'asset_symbol', 'action', 'action_display',
            'order_type', 'quantity', 'price', 'amount',
            'realized_pnl', 'created_at'
        ]
        read_only_fields = '__all__'


class ChallengeFuturesDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeFuturesDetails
        fields = ['leverage', 'margin_required', 'expiry_date', 'contract_size']


class ChallengeOptionsDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeOptionsDetails
        fields = ['option_type', 'position', 'strike_price', 'expiry_date', 'premium']


class ChallengeTradeDetailSerializer(serializers.ModelSerializer):
    """Detailed trade serializer with history and type-specific details"""
    total_pnl = serializers.ReadOnlyField()
    pnl_percentage = serializers.ReadOnlyField()
    is_profitable = serializers.ReadOnlyField()
    history = ChallengeTradeHistorySerializer(many=True, read_only=True)
    futures_details = ChallengeFuturesDetailsSerializer(read_only=True)
    options_details = ChallengeOptionsDetailsSerializer(read_only=True)
    
    class Meta:
        model = ChallengeTrade
        fields = [
            'id', 'user', 'participation', 'wallet',
            'asset_symbol', 'asset_name', 'trade_type', 'direction',
            'status', 'holding_type', 'total_quantity', 'remaining_quantity',
            'average_entry_price', 'current_price', 'total_invested',
            'realized_pnl', 'unrealized_pnl', 'total_pnl', 'pnl_percentage',
            'is_profitable', 'allocation_percentage',
            'opened_at', 'closed_at', 'updated_at',
            'history', 'futures_details', 'options_details'
        ]
        read_only_fields = '__all__'


class ChallengeTradeAnalyticsSerializer(serializers.ModelSerializer):
    participation_user = serializers.CharField(source='participation.user.email', read_only=True)
    participation_week = serializers.CharField(source='participation.week.title', read_only=True)
    
    class Meta:
        model = ChallengeTradeAnalytics
        fields = [
            'id', 'participation_user', 'participation_week',
            'total_trades', 'open_trades', 'closed_trades',
            'profitable_trades', 'losing_trades',
            'total_realized_pnl', 'total_unrealized_pnl', 'total_pnl',
            'win_rate', 'profit_factor',
            'spot_trades_count', 'futures_trades_count', 'options_trades_count',
            'avg_holding_time', 'longest_trade', 'shortest_trade',
            'total_capital_deployed', 'avg_allocation_per_trade',
            'best_trade_pnl', 'worst_trade_pnl',
            'last_calculated_at'
        ]
        read_only_fields = '__all__'

