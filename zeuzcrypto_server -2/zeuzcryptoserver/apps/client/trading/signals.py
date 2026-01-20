# signals.py
from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from decimal import Decimal
import asyncio
import logging

from .models import Trade, FuturesDetails, OptionsDetails, TradeHistory, Portfolio

logger = logging.getLogger(__name__)

# ---------------------------
# Helper Functions
# ---------------------------
def run_async_task(coro):
    """Helper to run async tasks from sync context"""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(coro)
        else:
            loop.run_until_complete(coro)
    except RuntimeError:
        # No event loop, create a new one
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(coro)


# ---------------------------
# Futures & Options Signals
# ---------------------------
@receiver(post_save, sender=FuturesDetails)
def handle_futures_trade_created(sender, instance, created, **kwargs):
    """Handle new futures trade creation"""
    if created:
        trade = instance.trade
        
        # Calculate initial margin
        position_value = trade.total_quantity * trade.average_price
        instance.margin_required = position_value / instance.leverage
        instance.margin_used = instance.margin_required
        instance.save(update_fields=['margin_required', 'margin_used'])
        
        # Subscribe to price updates
        from .websocket_manager import subscribe_to_symbol
        
        try:
            run_async_task(subscribe_to_symbol(trade.asset_symbol))
            logger.info(
                f"✅ Futures trade {trade.id} created - "
                f"Symbol: {trade.asset_symbol}, Leverage: {instance.leverage}x, "
                f"Margin: {instance.margin_required}, Subscribed to price updates"
            )
        except Exception as e:
            logger.error(f"Error subscribing to symbol {trade.asset_symbol}: {e}")


@receiver(post_save, sender=OptionsDetails)
def handle_options_trade_created(sender, instance, created, **kwargs):
    """Handle new options trade creation"""
    if created:
        trade = instance.trade
        
        # Subscribe to price updates
        from .websocket_manager import subscribe_to_symbol
        
        try:
            run_async_task(subscribe_to_symbol(trade.asset_symbol))
            logger.info(
                f"✅ Options trade {trade.id} created - "
                f"Symbol: {trade.asset_symbol}, Type: {instance.option_type}, "
                f"Strike: {instance.strike_price}, Expiry: {instance.expiry_date}"
            )
        except Exception as e:
            logger.error(f"Error subscribing to symbol {trade.asset_symbol}: {e}")


# ---------------------------
# Trade Status Signal
# ---------------------------
@receiver(pre_save, sender=Trade)
def handle_trade_status_change(sender, instance, **kwargs):
    """Handle trade status changes"""
    if instance.pk:  # Only for existing trades
        try:
            old_trade = Trade.objects.get(pk=instance.pk)
            
            # If trade is being closed, check if we need to unsubscribe
            if old_trade.status != 'CLOSED' and instance.status == 'CLOSED':
                # Check if there are other open trades for this symbol
                other_trades = Trade.objects.filter(
                    asset_symbol=instance.asset_symbol,
                    status__in=['OPEN', 'PARTIALLY_CLOSED']
                ).exclude(pk=instance.pk).exists()
                
                if not other_trades:
                    # No other trades for this symbol, unsubscribe
                    from .websocket_manager import ws_manager
                    
                    try:
                        run_async_task(ws_manager.unsubscribe_symbols([instance.asset_symbol]))
                        logger.info(f"Unsubscribed from {instance.asset_symbol} - no more active trades")
                    except Exception as e:
                        logger.error(f"Error unsubscribing from {instance.asset_symbol}: {e}")
                    
        except Trade.DoesNotExist:
            pass


# ---------------------------
# Portfolio & TradeHistory Signals
# ---------------------------
@receiver(post_save, sender=Trade)
def update_portfolio_on_trade_change(sender, instance, **kwargs):
    """Update portfolio when trade is modified"""
    try:
        portfolio, _ = Portfolio.objects.get_or_create(user=instance.user)
        portfolio.update_portfolio_metrics()
    except Exception as e:
        logger.error(f"Error updating portfolio for user {instance.user.id}: {str(e)}")


@receiver(post_save, sender=TradeHistory)
def log_trade_action(sender, instance, created, **kwargs):
    """Log trade actions for audit trail"""
    if created:
        logger.info(
            f"Trade action: User {instance.user.email} - "
            f"{instance.action} {instance.quantity} of {instance.trade.asset_symbol} "
            f"at {instance.price}"
        )



# from django.db.models.signals import post_save, post_delete
# from django.dispatch import receiver
# import logging
# from .models import Trade, TradeHistory, Portfolio

# # Initialize logger
# logger = logging.getLogger(__name__)


# @receiver(post_save, sender=Trade)
# def update_portfolio_on_trade_change(sender, instance, **kwargs):
#     """Update portfolio when trade is modified"""
#     try:
#         portfolio, _ = Portfolio.objects.get_or_create(user=instance.user)
#         portfolio.update_portfolio_metrics()
#     except Exception as e:
#         logger.error(f"Error updating portfolio for user {instance.user.id}: {str(e)}")


# @receiver(post_save, sender=TradeHistory)
# def log_trade_action(sender, instance, created, **kwargs):
#     """Log trade actions for audit trail"""
#     if created:
#         logger.info(
#             f"Trade action: User {instance.user.email} - "
#             f"{instance.action} {instance.quantity} of {instance.trade.asset_symbol} "
#             f"at {instance.price}"
#         )
