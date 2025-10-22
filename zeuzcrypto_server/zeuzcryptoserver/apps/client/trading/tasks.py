# tasks.py - Celery tasks for periodic checks
from asyncio.log import logger
from celery import shared_task
from django.utils import timezone
from .models import Trade, FuturesDetails, OptionsDetails
from decimal import Decimal


@shared_task(bind=True, max_retries=3)
def check_expired_options(self):
    """Check for expired options and handle them"""
    try:
        today = timezone.now().date()
        
        expired_options = OptionsDetails.objects.filter(
            expiry_date__lte=today,
            trade__status__in=['OPEN', 'PARTIALLY_CLOSED']
        ).select_related('trade')
        
        count = expired_options.count()
        logger.info(f"Checking {count} expired options...")
        
        for option in expired_options:
            trade = option.trade
            
            # Get current price
            current_price = trade.current_price or option.strike_price
            
            try:
                # Use the websocket manager's method to handle expiry
                from .websocket_manager import ws_manager
                
                # Determine if option should be exercised
                is_profitable = False
                
                if option.option_type == 'CALL':
                    is_profitable = current_price > option.strike_price
                else:  # PUT
                    is_profitable = current_price < option.strike_price
                
                if is_profitable and option.position == 'LONG':
                    ws_manager.exercise_option(trade, current_price)
                else:
                    ws_manager.expire_option(trade, current_price)
                    
            except Exception as e:
                logger.error(f"Error processing expired option {trade.id}: {e}")
                
        logger.info(f"Processed {count} expired options")
        
    except Exception as e:
        logger.error(f"Error in check_expired_options task: {e}")
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def sync_active_symbols(self):
    """Periodically sync subscribed symbols with active trades"""
    try:
        from .websocket_manager import ws_manager
        
        # Get active symbols
        active_symbols = set()
        trades = Trade.objects.filter(
            status__in=['OPEN', 'PARTIALLY_CLOSED'],
            trade_type__in=['FUTURES', 'OPTIONS']
        ).values_list('asset_symbol', flat=True)
        
        active_symbols.update(trades)
        
        # Compare with currently subscribed
        to_subscribe = active_symbols - ws_manager.subscribed_symbols
        to_unsubscribe = ws_manager.subscribed_symbols - active_symbols
        
        if to_subscribe or to_unsubscribe:
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                if to_subscribe:
                    loop.run_until_complete(ws_manager.subscribe_symbols(list(to_subscribe)))
                    logger.info(f"Subscribed to new symbols: {to_subscribe}")
                
                if to_unsubscribe:
                    loop.run_until_complete(ws_manager.unsubscribe_symbols(list(to_unsubscribe)))
                    logger.info(f"Unsubscribed from inactive symbols: {to_unsubscribe}")
                    
                loop.close()
                
            except Exception as e:
                logger.error(f"Error syncing symbols: {e}")
        
        logger.info(
            f"Symbol sync complete. Active: {len(active_symbols)}, "
            f"Subscribed: {len(ws_manager.subscribed_symbols)}"
        )
        
    except Exception as e:
        logger.error(f"Error in sync_active_symbols task: {e}")
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=3)
def monitor_all_margins(self):
    """Periodic check of all futures positions for margin calls"""
    try:
        futures_trades = Trade.objects.filter(
            status__in=['OPEN', 'PARTIALLY_CLOSED'],
            trade_type='FUTURES'
        ).select_related('futures_details')
        
        count = 0
        margin_calls = 0
        
        for trade in futures_trades:
            count += 1
            
            if not hasattr(trade, 'futures_details'):
                continue
            
            futures_details = trade.futures_details
            current_price = trade.current_price or trade.average_price
            
            # Calculate current P&L
            if trade.direction == 'BUY':
                pnl = (current_price - trade.average_price) * trade.remaining_quantity
            else:
                pnl = (trade.average_price - current_price) * trade.remaining_quantity
            
            # Calculate remaining margin
            remaining_margin = futures_details.margin_used + pnl
            margin_call_threshold = futures_details.margin_required * Decimal('0.2')
            
            # Log critical positions
            if remaining_margin <= margin_call_threshold * Decimal('2'):
                logger.warning(
                    f"⚠️ Low margin alert - Trade {trade.id}: "
                    f"Symbol: {trade.asset_symbol}, Remaining: {remaining_margin}, "
                    f"Threshold: {margin_call_threshold}"
                )
            
            # Check for margin call
            if remaining_margin <= margin_call_threshold or remaining_margin <= 0:
                from .websocket_manager import ws_manager
                ws_manager.check_margin_call(trade, current_price)
                margin_calls += 1
        
        logger.info(
            f"Margin check complete. Checked: {count}, Margin calls: {margin_calls}"
        )
        
    except Exception as e:
        logger.error(f"Error in monitor_all_margins task: {e}")
        raise self.retry(exc=e, countdown=60)




# # tasks.py - Celery tasks for background processing
# from celery import shared_task
# from django.utils import timezone
# from decimal import Decimal
# from .models import Trade, Portfolio
# from .services import MarketDataService, PortfolioService
# import logging

# logger = logging.getLogger(__name__)


# @shared_task
# def update_portfolio_metrics():
#     """Update portfolio metrics for all users"""
#     portfolios = Portfolio.objects.all()
#     updated_count = 0
    
#     for portfolio in portfolios:
#         try:
#             portfolio.update_portfolio_metrics()
#             updated_count += 1
#         except Exception as e:
#             logger.error(f"Error updating portfolio for user {portfolio.user.id}: {str(e)}")
    
#     logger.info(f"Updated {updated_count} portfolios")
#     return updated_count


# @shared_task
# def update_unrealized_pnl():
#     """Update unrealized P&L for all open positions"""
#     # This would fetch current prices from market data provider
#     # and update all open trades
    
#     open_trades = Trade.objects.filter(status__in=['OPEN', 'PARTIALLY_CLOSED'])
#     updated_count = 0
    
#     # Group trades by asset to minimize API calls
#     assets = set(trade.asset_symbol for trade in open_trades)
    
#     for asset in assets:
#         try:
#             # Get current price (integrate with your market data provider)
#             current_price = MarketDataService.get_current_price(asset)
            
#             asset_trades = open_trades.filter(asset_symbol=asset)
#             for trade in asset_trades:
#                 trade.calculate_unrealized_pnl(current_price)
#                 updated_count += 1
                
#         except Exception as e:
#             logger.error(f"Error updating P&L for {asset}: {str(e)}")
    
#     logger.info(f"Updated P&L for {updated_count} trades")
#     return updated_count


# @shared_task
# def check_options_expiry():
#     """Check and handle options expiry"""
#     today = timezone.now().date()
    
#     expiring_options = Trade.objects.filter(
#         trade_type='OPTIONS',
#         status__in=['OPEN', 'PARTIALLY_CLOSED'],
#         options_details__expiry_date=today
#     )
    
#     expired_count = 0
#     for trade in expiring_options:
#         try:
#             # Handle options expiry logic
#             if trade.options_details.position == 'LONG':
#                 # Long options expire worthless if out of money
#                 # You'd check if option is in the money here
#                 trade.status = 'CLOSED'
#                 trade.closed_at = timezone.now()
#                 trade.realized_pnl = -trade.total_invested  # Premium lost
#             else:
#                 # Short options - profit is the premium received
#                 trade.status = 'CLOSED'
#                 trade.closed_at = timezone.now()
#                 trade.realized_pnl = trade.total_invested  # Premium kept
            
#             trade.save()
#             expired_count += 1
            
#         except Exception as e:
#             logger.error(f"Error handling expiry for trade {trade.id}: {str(e)}")
    
#     logger.info(f"Processed {expired_count} expired options")
#     return expired_count


# @shared_task
# def check_futures_expiry():
#     """Check and handle futures expiry"""
#     today = timezone.now().date()
    
#     expiring_futures = Trade.objects.filter(
#         trade_type='FUTURES',
#         status__in=['OPEN', 'PARTIALLY_CLOSED'],
#         futures_details__expiry_date=today
#     )
    
#     expired_count = 0
#     for trade in expiring_futures:
#         try:
#             # Handle futures expiry - typically settled at spot price
#             current_price = MarketDataService.get_current_price(trade.asset_symbol)
            
#             # Calculate final P&L
#             if trade.direction == 'BUY':
#                 pnl = (current_price - trade.average_price) * trade.remaining_quantity
#             else:
#                 pnl = (trade.average_price - current_price) * trade.remaining_quantity
            
#             trade.realized_pnl += pnl
#             trade.unrealized_pnl = 0
#             trade.status = 'CLOSED'
#             trade.closed_at = timezone.now()
#             trade.save()
            
#             expired_count += 1
            
#         except Exception as e:
#             logger.error(f"Error handling futures expiry for trade {trade.id}: {str(e)}")
    
#     logger.info(f"Processed {expired_count} expired futures")
#     return expired_count


# @shared_task
# def daily_portfolio_snapshot():
#     """Create daily portfolio snapshots for performance tracking"""
#     from .models import PortfolioSnapshot  # You'd create this model
    
#     portfolios = Portfolio.objects.all()
#     snapshots_created = 0
    
#     for portfolio in portfolios:
#         try:
#             # Create daily snapshot
#             PortfolioSnapshot.objects.create(
#                 user=portfolio.user,
#                 date=timezone.now().date(),
#                 total_value=portfolio.total_value,
#                 total_invested=portfolio.total_invested,
#                 realized_pnl=portfolio.total_realized_pnl,
#                 unrealized_pnl=portfolio.total_unrealized_pnl,
#                 active_trades_count=portfolio.active_trades_count
#             )
#             snapshots_created += 1
            
#         except Exception as e:
#             logger.error(f"Error creating snapshot for user {portfolio.user.id}: {str(e)}")
    
#     logger.info(f"Created {snapshots_created} portfolio snapshots")
#     return snapshots_created


# # signals.py - Django signals for automatic updates
# from django.db.models.signals import post_save, post_delete
# from django.dispatch import receiver
# from .models import Trade, TradeHistory


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







# # tests.py - Unit tests
# from django.test import TestCase
# from django.contrib.auth.models import User
# from decimal import Decimal
# from .models import Trade, Portfolio
# from .services import TradingService


# class TradingServiceTest(TestCase):
#     def setUp(self):
#         self.user = User.objects.create_user(
#             username='testuser',
#             email='test@example.com',
#             password='testpass123'
#         )
    
#     def test_spot_buy_order(self):
#         """Test spot buy order creation"""
#         trade_data = {
#             'asset_symbol': 'AAPL',
#             'trade_type': 'SPOT',
#             'direction': 'BUY',
#             'holding_type': 'LONGTERM',
#             'quantity': Decimal('10'),
#             'price': Decimal('150.00')
#         }
        
#         errors = TradingService.validate_trade_rules(self.user, trade_data)
#         self.assertEqual(len(errors), 0)
    
#     def test_spot_sell_longterm_validation(self):
#         """Test that long-term spot can't be SELL without existing position"""
#         trade_data = {
#             'asset_symbol': 'AAPL',
#             'trade_type': 'SPOT',
#             'direction': 'SELL',
#             'holding_type': 'LONGTERM',
#             'quantity': Decimal('10'),
#             'price': Decimal('150.00')
#         }
        
#         errors = TradingService.validate_trade_rules(self.user, trade_data)
#         self.assertGreater(len(errors), 0)
    
#     def test_average_price_calculation(self):
#         """Test average price calculation"""
#         current_avg = Decimal('100.00')
#         current_qty = Decimal('10')
#         new_price = Decimal('120.00')
#         new_qty = Decimal('5')
        
#         avg_price = TradingService.update_average_price(
#             current_avg, current_qty, new_price, new_qty
#         )
        
#         expected = ((100 * 10) + (120 * 5)) / 15
#         self.assertEqual(avg_price, Decimal(str(expected)))
    
#     def test_portfolio_creation(self):
#         """Test portfolio is created automatically"""
#         portfolio, created = Portfolio.objects.get_or_create(user=self.user)
#         self.assertTrue(created)
#         self.assertEqual(portfolio.user, self.user)


# class TradeModelTest(TestCase):
#     def setUp(self):
#         self.user = User.objects.create_user(
#             username='testuser',
#             email='test@example.com',
#             password='testpass123'
#         )
    
#     def test_unrealized_pnl_calculation(self):
#         """Test unrealized P&L calculation"""
#         trade = Trade.objects.create(
#             user=self.user,
#             asset_symbol='BTCUSD',
#             trade_type='SPOT',
#             direction='BUY',
#             total_quantity=Decimal('1.0'),
#             remaining_quantity=Decimal('1.0'),
#             average_price=Decimal('50000.00'),
#             total_invested=Decimal('50000.00')
#         )
        
#         # Price goes up to 55000
#         pnl = trade.calculate_unrealized_pnl(Decimal('55000.00'))
#         self.assertEqual(pnl, Decimal('5000.00'))
        
#         # Price goes down to 45000
#         pnl = trade.calculate_unrealized_pnl(Decimal('45000.00'))
#         self.assertEqual(pnl, Decimal('-5000.00'))
    
#     def test_short_position_pnl(self):
#         """Test P&L calculation for short positions"""
#         trade = Trade.objects.create(
#             user=self.user,
#             asset_symbol='BTCUSD',
#             trade_type='SPOT',
#             direction='SELL',  # Short position
#             total_quantity=Decimal('1.0'),
#             remaining_quantity=Decimal('1.0'),
#             average_price=Decimal('50000.00'),
#             total_invested=Decimal('50000.00')
#         )
        
#         # Price goes down - profit for short
#         pnl = trade.calculate_unrealized_pnl(Decimal('45000.00'))
#         self.assertEqual(pnl, Decimal('5000.00'))
        
#         # Price goes up - loss for short
#         pnl = trade.calculate_unrealized_pnl(Decimal('55000.00'))
#         self.assertEqual(pnl, Decimal('-5000.00'))