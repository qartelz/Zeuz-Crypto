
# ==================== FILE: apps/challenges/serializers/wallet_serializers.py ====================

from rest_framework import serializers
from apps.admin.challenge import ChallengeWallet, ChallengeWalletTransaction


class ChallengeWalletSerializer(serializers.ModelSerializer):
    total_balance = serializers.ReadOnlyField()
    current_balance = serializers.ReadOnlyField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    week_title = serializers.CharField(source='participation.week.title', read_only=True)
    participation_id = serializers.UUIDField(source='participation.id', read_only=True)
    
    class Meta:
        model = ChallengeWallet
        fields = [
            'id', 'user_email', 'participation_id', 'week_title',
            'initial_balance', 'available_balance', 'locked_balance',
            'earned_balance', 'total_balance', 'current_balance',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user_email', 'participation_id', 'week_title',
            'total_balance', 'current_balance', 'created_at', 'updated_at'
        ]


class ChallengeWalletTransactionSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    
    class Meta:
        model = ChallengeWalletTransaction
        fields = [
            'id', 'transaction_type', 'transaction_type_display',
            'amount', 'balance_before', 'balance_after',
            'description', 'created_at'
        ]
        read_only_fields = '__all__'

