# serializers.py
from rest_framework import serializers
from decimal import Decimal
from .models import Trade, FuturesDetails, OptionsDetails, TradeHistory, Portfolio


class FuturesDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = FuturesDetails
        fields = ['leverage', 'margin_required', 'margin_used', 'expiry_date', 
                 'contract_size', 'is_hedged']


class OptionsDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptionsDetails
        fields = ['option_type', 'position', 'strike_price', 'expiry_date', 'premium']


class TradeHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TradeHistory
        fields = ['id', 'action', 'order_type', 'quantity', 'price', 'amount', 
                 'realized_pnl', 'created_at']
        read_only_fields = ['id', 'created_at']


class TradeSerializer(serializers.ModelSerializer):
    futures_details = FuturesDetailsSerializer(required=False)
    options_details = OptionsDetailsSerializer(required=False)
    history = TradeHistorySerializer(many=True, read_only=True)
    total_pnl = serializers.ReadOnlyField()
    pnl_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Trade
        fields = ['id', 'asset_symbol', 'asset_name', 'asset_exchange', 'trade_type', 
                 'direction', 'status', 'holding_type', 'total_quantity', 'remaining_quantity',
                 'average_price', 'realized_pnl', 'unrealized_pnl', 'total_invested',
                 'opened_at', 'closed_at', 'updated_at', 'futures_details', 'options_details',
                 'history', 'total_pnl', 'pnl_percentage']
        read_only_fields = ['id', 'opened_at', 'closed_at', 'updated_at', 'realized_pnl',
                          'unrealized_pnl', 'total_invested', 'remaining_quantity']


class PlaceOrderSerializer(serializers.Serializer):
    # Basic order info
    asset_symbol = serializers.CharField(max_length=20)
    asset_name = serializers.CharField(max_length=100, required=False)
    asset_exchange = serializers.CharField(max_length=50, required=False)
    trade_type = serializers.ChoiceField(choices=Trade.TRADE_TYPES)
    direction = serializers.ChoiceField(choices=Trade.DIRECTIONS)
    holding_type = serializers.ChoiceField(choices=Trade.HOLDING_TYPES)
    
    # Order details
    quantity = serializers.DecimalField(max_digits=20, decimal_places=8, min_value=Decimal('0'))
    price = serializers.DecimalField(max_digits=20, decimal_places=8, min_value=Decimal('0'))
    order_type = serializers.ChoiceField(choices=TradeHistory.ORDER_TYPES, default='MARKET')
    
    # Futures specific fields
    leverage = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=Decimal('1'))
    expiry_date = serializers.DateField(required=False)
    contract_size = serializers.DecimalField(max_digits=20, decimal_places=8, required=False, default=Decimal('1'))
    is_hedged = serializers.BooleanField(required=False, default=False)
    
    # Options specific fields
    option_type = serializers.ChoiceField(choices=OptionsDetails.OPTION_TYPES, required=False)
    option_position = serializers.ChoiceField(choices=OptionsDetails.POSITIONS, required=False)
    strike_price = serializers.DecimalField(max_digits=20, decimal_places=8, required=False)
    premium = serializers.DecimalField(max_digits=20, decimal_places=8, required=False)

    def validate(self, data):
        trade_type = data.get('trade_type')
        
        # Validate futures fields
        if trade_type == 'FUTURES':
            required_fields = ['expiry_date']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError(f"{field} is required for futures trades")
        
        # Validate options fields
        elif trade_type == 'OPTIONS':
            required_fields = ['option_type', 'option_position', 'strike_price', 'expiry_date', 'premium']
            for field in required_fields:
                if not data.get(field):
                    raise serializers.ValidationError(f"{field} is required for options trades")
        
        # Validate long-term trades can only be BUY for SPOT
        if trade_type == 'SPOT' and data.get('holding_type') == 'LONGTERM' and data.get('direction') != 'BUY':
            raise serializers.ValidationError("Long-term spot trades can only be BUY orders")
        
        return data


class PartialCloseSerializer(serializers.Serializer):
    quantity = serializers.DecimalField(max_digits=20, decimal_places=8, min_value=Decimal('0'))
    price = serializers.DecimalField(max_digits=20, decimal_places=8, min_value=Decimal('0'), required=False)
    order_type = serializers.ChoiceField(choices=TradeHistory.ORDER_TYPES, default='MARKET')

    def validate_quantity(self, value):
        trade = self.context.get('trade')
        if trade and value > trade.remaining_quantity:
            raise serializers.ValidationError("Cannot close more than remaining quantity")
        return value


class CloseTradeSerializer(serializers.Serializer):
    price = serializers.DecimalField(max_digits=20, decimal_places=8, min_value=Decimal('0'), required=False)
    order_type = serializers.ChoiceField(choices=TradeHistory.ORDER_TYPES, default='MARKET')


class PortfolioSerializer(serializers.ModelSerializer):
    win_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = Portfolio
        fields = ['total_value', 'total_invested', 'total_realized_pnl', 'total_unrealized_pnl',
                 'total_return_percentage', 'day_pnl', 'day_pnl_percentage', 'active_trades_count',
                 'total_trades_count', 'winning_trades_count', 'losing_trades_count',
                 'max_drawdown', 'sharpe_ratio', 'win_rate', 'last_updated']


class ActivePositionSerializer(serializers.ModelSerializer):
    total_pnl = serializers.ReadOnlyField()
    pnl_percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Trade
        fields = ['id', 'asset_symbol', 'asset_name', 'trade_type', 'direction', 'status',
                 'remaining_quantity', 'average_price', 'unrealized_pnl', 'total_pnl', 
                 'pnl_percentage', 'opened_at']


class PnLReportSerializer(serializers.Serializer):
    period = serializers.ChoiceField(choices=['today', 'week', 'month', 'year'], default='today')
    trade_type = serializers.ChoiceField(choices=Trade.TRADE_TYPES, required=False)
    asset_symbol = serializers.CharField(max_length=20, required=False)


class RiskCheckSerializer(serializers.Serializer):
    asset_symbol = serializers.CharField(max_length=20)
    trade_type = serializers.ChoiceField(choices=Trade.TRADE_TYPES)
    direction = serializers.ChoiceField(choices=Trade.DIRECTIONS)
    quantity = serializers.DecimalField(max_digits=20, decimal_places=8)
    price = serializers.DecimalField(max_digits=20, decimal_places=8)
    leverage = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=Decimal('1'))


class UpdatePricesSerializer(serializers.Serializer):
    prices = serializers.DictField(
        child=serializers.DecimalField(max_digits=20, decimal_places=8)
    )