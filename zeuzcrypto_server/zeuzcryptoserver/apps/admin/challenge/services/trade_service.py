# ==================== FILE: apps/challenges/services/trade_service.py ====================

from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from apps.admin.challenge.models.challenge_models import (
     
    UserChallengeParticipation
)
from apps.admin.challenge.models.trade_models import ChallengeTrade,ChallengeTradeHistory
from apps.admin.challenge.models.analytics_models import ChallengeTradeAnalytics

class TradeService:
    """Service for trade operations"""
    
    @staticmethod
    def validate_trade_constraints(participation, investment_amount):
        """Validate trading constraints"""
        wallet = participation.wallet
        
        # Check sufficient balance
        if not wallet.check_sufficient_balance(investment_amount):
            raise ValueError(f"Insufficient balance. Available: {wallet.available_balance}")
        
        # Max 30% per trade
        allocation_pct = (investment_amount / wallet.initial_balance) * 100
        if allocation_pct > 30:
            raise ValueError(f"Position size {allocation_pct:.2f}% exceeds limit of 30%")
        
        # Max 75% total locked
        total_locked = wallet.locked_balance + investment_amount
        total_locked_pct = (total_locked / wallet.initial_balance) * 100
        if total_locked_pct > 75:
            raise ValueError(f"Total locked {total_locked_pct:.2f}% exceeds limit of 75%")
        
        return True
    
    @staticmethod
    @transaction.atomic
    def execute_trade(user, trade_data):
        """Execute a new challenge trade"""
        participation = UserChallengeParticipation.objects.select_for_update().get(
            id=trade_data['participation_id'],
            user=user
        )
        
        wallet = participation.wallet
        
        # Calculate investment
        total_quantity = trade_data['total_quantity']
        entry_price = trade_data['entry_price']
        total_invested = total_quantity * entry_price
        
        # Validate constraints
        TradeService.validate_trade_constraints(participation, total_invested)
        
        # Create trade
        trade = ChallengeTrade.objects.create(
            user=user,
            participation=participation,
            wallet=wallet,
            asset_symbol=trade_data['asset_symbol'],
            asset_name=trade_data.get('asset_name', ''),
            trade_type=trade_data['trade_type'],
            direction=trade_data['direction'],
            total_quantity=total_quantity,
            remaining_quantity=total_quantity,
            average_entry_price=entry_price,
            total_invested=total_invested,
            holding_type=trade_data.get('holding_type', 'INTRADAY'),
            status='OPEN'
        )
        
        # Lock coins
        wallet.lock_coins(total_invested)
        
        # Record trade history
        ChallengeTradeHistory.objects.create(
            trade=trade,
            user=user,
            action='BUY' if trade.direction == 'BUY' else 'SELL',
            order_type=trade_data.get('order_type', 'MARKET'),
            quantity=total_quantity,
            price=entry_price,
            amount=total_invested
        )
        
        # Update participation metrics
        TradeService.update_participation_metrics(participation)
        
        return trade
    
    @staticmethod
    @transaction.atomic
    def close_trade(trade, close_data):
        """Close or partially close a trade"""
        exit_price = close_data['exit_price']
        exit_quantity = close_data.get('exit_quantity', trade.remaining_quantity)
        
        # Calculate P&L
        pnl = trade.close_trade(exit_price, exit_quantity)
        
        # Unlock coins
        unlock_amount = exit_quantity * trade.average_entry_price
        trade.wallet.unlock_coins(unlock_amount)
        
        # Add/deduct P&L
        if pnl > 0:
            trade.wallet.add_profit(pnl)
        else:
            trade.wallet.deduct_loss(abs(pnl))
        
        # Record trade history
        ChallengeTradeHistory.objects.create(
            trade=trade,
            user=trade.user,
            action='SELL' if exit_quantity == trade.total_quantity else 'PARTIAL_SELL',
            order_type=close_data.get('order_type', 'MARKET'),
            quantity=exit_quantity,
            price=exit_price,
            amount=exit_quantity * exit_price,
            realized_pnl=pnl
        )
        
        # Recalculate analytics
        if hasattr(trade.participation, 'trade_analytics'):
            trade.participation.trade_analytics.recalculate()
        
        # Update participation metrics
        TradeService.update_participation_metrics(trade.participation)
        
        return trade
    
    @staticmethod
    def update_participation_metrics(participation):
        """Update trade counts and portfolio return for participation"""
        trades = participation.trades.all()
        
        participation.total_trades = trades.count()
        participation.spot_trades = trades.filter(trade_type='SPOT').count()
        participation.futures_trades = trades.filter(trade_type='FUTURES').count()
        participation.options_trades = trades.filter(trade_type='OPTIONS').count()
        
        # Update current balance from wallet
        if hasattr(participation, 'wallet'):
            participation.current_balance = participation.wallet.total_balance
            participation.portfolio_return_pct = participation.calculate_return_percentage()
        
        participation.save()
    
    @staticmethod
    def get_trade_summary(participation):
        """Get trade summary for participation"""
        trades = participation.trades.all()
        
        return {
            'total_trades': trades.count(),
            'open_trades': trades.filter(status__in=['OPEN', 'PARTIALLY_CLOSED']).count(),
            'closed_trades': trades.filter(status='CLOSED').count(),
            'total_realized_pnl': str(sum(t.realized_pnl for t in trades)),
            'total_unrealized_pnl': str(sum(t.unrealized_pnl for t in trades)),
            'total_pnl': str(sum(t.total_pnl for t in trades)),
            'profitable_trades': trades.filter(realized_pnl__gt=0).count(),
            'losing_trades': trades.filter(realized_pnl__lt=0).count(),
            'wallet_balance': str(participation.wallet.current_balance) if hasattr(participation, 'wallet') else '0',
        }
    
    @staticmethod
    def calculate_average_allocation(participation):
        """Calculate average capital allocation percentage"""
        trades = participation.trades.all()
        if not trades.exists():
            return Decimal('0')
        
        from django.db.models import Avg
        return trades.aggregate(Avg('allocation_percentage'))['allocation_percentage__avg'] or Decimal('0')

