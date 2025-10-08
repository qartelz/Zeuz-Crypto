
from decimal import Decimal
from django.db import transaction
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

from apps.accounts.models import UserWallet, WalletTransaction


class WalletService:
    """Service to handle wallet operations for trading"""
    
    @staticmethod
    def get_balance(user):
        """Get user's current wallet balance"""
        try:
            return user.wallet.balance
        except Exception as e:
            logger.error(f"Error getting balance for {user.email}: {str(e)}")
            return Decimal('0.00')
    
    @staticmethod
    def check_balance(user, required_amount):
        """Check if user has enough coins"""
        balance = WalletService.get_balance(user)
        return balance >= required_amount
    
    @staticmethod
    @transaction.atomic
    def deduct_coins(user, amount, description):
        """
        Deduct coins from wallet (used for BUY orders)
        
        Example: User buys 10 AAPL @ $150 = 1,500 coins deducted
        """
        try:
            wallet = user.wallet
            
            # Check if user has enough coins
            if wallet.balance < amount:
                raise ValidationError(
                    f"Insufficient coins. Need: {amount}, Available: {wallet.balance}"
                )
            
            # Save old balance for logging
            old_balance = wallet.balance
            
            # Deduct coins
            wallet.balance -= amount
            wallet.save()
            
            # Log the transaction
            WalletTransaction.objects.create(
                user=user,
                amount=amount,
                transaction_type='DEBIT',
                description=description,
                balance_before=old_balance,
                balance_after=wallet.balance
            )
            
            logger.info(f"{user.email} - Deducted {amount} coins. New balance: {wallet.balance}")
            return wallet.balance
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error deducting coins for {user.email}: {str(e)}")
            raise ValidationError(f"Wallet transaction failed: {str(e)}")
    
    @staticmethod
    @transaction.atomic
    def credit_coins(user, amount, description):
        """
        Add coins to wallet (used for SELL orders)
        
        Example: User sells 10 AAPL @ $170 = 1,700 coins credited
        """
        try:
            wallet = user.wallet
            
            # Save old balance for logging
            old_balance = wallet.balance
            
            # Add coins
            wallet.balance += amount
            wallet.save()
            
            # Log the transaction
            WalletTransaction.objects.create(
                user=user,
                amount=amount,
                transaction_type='CREDIT',
                description=description,
                balance_before=old_balance,
                balance_after=wallet.balance
            )
            
            logger.info(f"{user.email} - Credited {amount} coins. New balance: {wallet.balance}")
            return wallet.balance
            
        except Exception as e:
            logger.error(f"Error crediting coins for {user.email}: {str(e)}")
            raise ValidationError(f"Wallet transaction failed: {str(e)}")
    
    @staticmethod
    @transaction.atomic
    def block_coins(user, amount, description):
        """
        Block coins for margin (used for FUTURES)
        
        Example: User opens 1 BTC futures with 5x leverage
        Position value: $50,000, Margin: $10,000 (blocked)
        """
        try:
            wallet = user.wallet
            
            # Check if user has enough coins
            if wallet.balance < amount:
                raise ValidationError(
                    f"Insufficient coins for margin. Need: {amount}, Available: {wallet.balance}"
                )
            
            old_balance = wallet.balance
            
            # Block coins (same as deduct, but marked as BLOCK)
            wallet.balance -= amount
            wallet.save()
            
            # Log as BLOCK transaction
            WalletTransaction.objects.create(
                user=user,
                amount=amount,
                transaction_type='BLOCK',
                description=description,
                balance_before=old_balance,
                balance_after=wallet.balance
            )
            
            logger.info(f"{user.email} - Blocked {amount} coins for margin. New balance: {wallet.balance}")
            return wallet.balance
            
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error blocking coins for {user.email}: {str(e)}")
            raise ValidationError(f"Wallet transaction failed: {str(e)}")
    
    @staticmethod
    @transaction.atomic
    def unblock_coins(user, amount, description):
        """
        Unblock coins and add P&L (used when closing FUTURES)
        
        Example: User closes futures position
        Margin blocked: $10,000
        P&L: +$2,000
        Total returned: $12,000
        """
        try:
            wallet = user.wallet
            
            old_balance = wallet.balance
            
            # Return coins (blocked amount + P&L)
            wallet.balance += amount
            wallet.save()
            
            # Log as UNBLOCK transaction
            WalletTransaction.objects.create(
                user=user,
                amount=amount,
                transaction_type='UNBLOCK',
                description=description,
                balance_before=old_balance,
                balance_after=wallet.balance
            )
            
            logger.info(f"{user.email} - Unblocked {amount} coins. New balance: {wallet.balance}")
            return wallet.balance
            
        except Exception as e:
            logger.error(f"Error unblocking coins for {user.email}: {str(e)}")
            raise ValidationError(f"Wallet transaction failed: {str(e)}")