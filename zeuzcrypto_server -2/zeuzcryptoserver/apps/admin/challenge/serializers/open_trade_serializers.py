# serializers.py
from rest_framework import serializers
# from models.trade_models import ChallengeTrade, ChallengeFuturesDetails, ChallengeOptionsDetails
from apps.admin.challenge.models.trade_models import ChallengeTrade, ChallengeFuturesDetails, ChallengeOptionsDetails
class ChallengeFuturesDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeFuturesDetails
        fields = ['leverage', 'margin_required', 'expiry_date', 'contract_size']

class ChallengeOptionsDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChallengeOptionsDetails
        fields = ['option_type', 'position', 'strike_price', 'expiry_date', 'premium']

class ChallengeTradeSerializer(serializers.ModelSerializer):
    futures_details = ChallengeFuturesDetailsSerializer(read_only=True)
    options_details = ChallengeOptionsDetailsSerializer(read_only=True)

    class Meta:
        model = ChallengeTrade
        fields = [
            'id', 'asset_symbol', 'asset_name', 'trade_type', 'direction', 'status',
            'total_quantity', 'remaining_quantity', 'average_entry_price', 'current_price',
            'realized_pnl', 'unrealized_pnl', 'allocation_percentage',
            'opened_at', 'closed_at',
            'futures_details', 'options_details'
        ]
