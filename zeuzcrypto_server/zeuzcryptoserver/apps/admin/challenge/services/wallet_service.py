# ==================== FILE: apps/challenges/services/wallet_service.py ====================

from decimal import Decimal
from django.db import transaction
from apps.admin.challenge.models.wallet_models   import ChallengeWallet, ChallengeWalletTransaction


class WalletService:
    """Service for wallet operations"""
    
    @staticmethod
    @transaction.atomic
    def create_wallet_for_participation(participation, initial_balance):
        """Create a new wallet when user joins a challenge"""
        wallet, created = ChallengeWallet.objects.get_or_create(
            user=participation.user,
            participation=participation,
            defaults={
                'initial_balance': initial_balance,
                'available_balance': initial_balance,
            }
        )
        
        if created:
            ChallengeWalletTransaction.objects.create(
                wallet=wallet,
                transaction_type='INITIAL_DEPOSIT',
                amount=initial_balance,
                balance_before=Decimal('0'),
                balance_after=initial_balance,
                description=f'Challenge wallet created with {initial_balance} coins'
            )
        
        return wallet
    
    @staticmethod
    @transaction.atomic
    def award_bonus_coins(wallet, bonus_amount, description="Reward bonus"):
        """Award bonus coins to wallet"""
        wallet.earned_balance += bonus_amount
        wallet.save()
        
        ChallengeWalletTransaction.objects.create(
            wallet=wallet,
            transaction_type='REWARD_BONUS',
            amount=bonus_amount,
            balance_before=wallet.current_balance - bonus_amount,
            balance_after=wallet.current_balance,
            description=description
        )
    
    @staticmethod
    def get_wallet_summary(wallet):
        """Get comprehensive wallet summary"""
        return {
            'wallet_id': str(wallet.id),
            'user_email': wallet.user.email,
            'week': wallet.participation.week.title,
            'initial_balance': str(wallet.initial_balance),
            'available_balance': str(wallet.available_balance),
            'locked_balance': str(wallet.locked_balance),
            'earned_balance': str(wallet.earned_balance),
            'total_balance': str(wallet.total_balance),
            'current_balance': str(wallet.current_balance),
            'usage_percentage': float(
                (wallet.locked_balance / wallet.initial_balance * 100)
                if wallet.initial_balance > 0 else 0
            ),
            'profit_percentage': float(
                (wallet.earned_balance / wallet.initial_balance * 100)
                if wallet.initial_balance > 0 else 0
            ),
        }
    
    @staticmethod
    def validate_sufficient_balance(wallet, amount):
        """Validate wallet has sufficient balance"""
        if not wallet.check_sufficient_balance(amount):
            raise ValueError(
                f"Insufficient balance. Available: {wallet.available_balance}, Required: {amount}"
            )
        return True

