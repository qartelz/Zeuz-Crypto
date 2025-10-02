from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import logging
from .models import Trade, TradeHistory, Portfolio

# Initialize logger
logger = logging.getLogger(__name__)


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
