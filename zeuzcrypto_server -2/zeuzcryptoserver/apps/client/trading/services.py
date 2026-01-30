# services.py
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from .models import Trade, TradeHistory, Portfolio
import logging

logger = logging.getLogger(__name__)


class TradingService:
    """Core trading service with business logic"""
    
    @staticmethod
    def validate_trade_rules(user, trade_data):
        """Validate trading rules and constraints"""
        errors = []
        
        # Rule 1: Long-term spot trades can only be BUY
        if (trade_data['trade_type'] == 'SPOT' and 
            trade_data['holding_type'] == 'LONGTERM' and 
            trade_data['direction'] != 'BUY'):
            errors.append("Long-term spot trades can only be BUY orders")
        
        # Rule 2: Check if selling more than owned for spot trades
        if (trade_data['trade_type'] == 'SPOT' and 
            trade_data['direction'] == 'SELL' and
            trade_data['holding_type'] == 'LONGTERM'):
            
            existing_position = Trade.objects.filter(
                user=user,
                asset_symbol=trade_data['asset_symbol'],
                trade_type='SPOT',
                holding_type='LONGTERM',
                status__in=['OPEN', 'PARTIALLY_CLOSED']
            ).first()
            
            if not existing_position:
                errors.append("No existing long-term position to sell")
            elif existing_position.remaining_quantity < trade_data['quantity']:
                errors.append("Cannot sell more than owned quantity")
        
        # Rule 3: Options expiry validation
        if trade_data['trade_type'] == 'OPTIONS':
            expiry_date = trade_data.get('expiry_date')
            if expiry_date and expiry_date <= timezone.now().date():
                errors.append("Options expiry date must be in the future")
        
        # Rule 4: Futures expiry validation
        if trade_data['trade_type'] == 'FUTURES':
            expiry_date = trade_data.get('expiry_date')
            if expiry_date and expiry_date <= timezone.now().date():
                errors.append("Futures expiry date must be in the future")
        
        return errors
    
    @staticmethod
    def calculate_position_value(trade_type, quantity, price, leverage=None):
        """Calculate position value and margin requirements"""
        position_value = quantity * price
        
        if trade_type == 'FUTURES' and leverage:
            margin_required = position_value / leverage
            return {
                'position_value': position_value,
                'margin_required': margin_required,
                'leverage': leverage
            }
        elif trade_type == 'OPTIONS':
            # For options, the premium is the cost
            return {
                'position_value': position_value,
                'margin_required': position_value,  # Premium paid upfront
                'leverage': Decimal('1')
            }
        else:
            # Spot trades
            return {
                'position_value': position_value,
                'margin_required': position_value,
                'leverage': Decimal('1')
            }
    
    @staticmethod
    def calculate_realized_pnl(trade, sell_quantity, sell_price):
        """Calculate realized P&L for trade closure"""
        if trade.direction == 'BUY':
            # Long position: profit when sell price > buy price
            pnl_per_unit = sell_price - trade.average_price
        else:
            # Short position: profit when sell price < buy price
            pnl_per_unit = trade.average_price - sell_price
        
        return pnl_per_unit * sell_quantity
    
    @staticmethod
    def update_average_price(current_avg, current_qty, new_price, new_qty):
        """Calculate new average price when adding to position"""
        total_value = (current_avg * current_qty) + (new_price * new_qty)
        total_quantity = current_qty + new_qty
        return total_value / total_quantity if total_quantity > 0 else Decimal('0')

    @staticmethod
    def process_pending_orders(user, prices=None):
        """
        Check and execute pending orders based on current prices.
        If prices is None, fetch them from APIs based on pending orders.
        """
        pending_trades = Trade.objects.filter(
            user=user,
            status="PENDING"
        )

        if not pending_trades.exists():
            return []

        # If prices not provided, fetch them
        if prices is None:
            prices = {}
            # Group by exchange/type to optimize fetching
            spot_symbols = set()
            futures_symbols = set()
            
            for t in pending_trades:
                if t.trade_type == 'SPOT':
                    spot_symbols.add(t.asset_symbol.upper())
                elif t.trade_type in ['FUTURES', 'OPTIONS']:
                    futures_symbols.add(t.asset_symbol.upper())
            
            # Fetch Spot Prices (Binance)
            if spot_symbols:
                import requests
                try:
                    # Binance Ticker for multiple symbols is efficient
                    # If simulating, we might just query specific ones or all
                    # For simplicity, we query individually or use a bulk endpoint if available
                    # Binance API: GET /api/v3/ticker/price?symbol=BTCUSDT
                    for sym in spot_symbols:
                        # Append USDT if not present (assuming USDT pairs)
                        pair = f"{sym}USDT"
                        resp = requests.get(f"https://api.binance.com/api/v3/ticker/price?symbol={pair}", timeout=2)
                        if resp.status_code == 200:
                            data = resp.json()
                            prices[sym] = Decimal(data['price'])
                except Exception as e:
                    logger.error(f"Error fetching Binance prices: {e}")

            # Fetch Futures/Options Prices (Delta)
            if futures_symbols:
                import requests
                try:
                   # Delta Exchange API for ticker
                   for sym in futures_symbols:
                       # Delta uses symbols directly mostly, or with suffixes
                       # User provided example: BTCUSDT
                       resp = requests.get(f"https://api.delta.exchange/v2/products/ticker?symbol={sym}", timeout=2)
                       if resp.status_code == 200:
                           data = resp.json()
                           if list(data.keys())[0] == 'result': # handling result wrapper if needed
                                # Delta V2 typically wraps? Let's check user provided example
                                # User provided: { "description": ... "mark_price": ... } direct object?
                                # Delta usually returns a result list for bulk or single object.
                                # Let's assume the user provided format is the direct response or part of list.
                                # If direct:
                                result = data.get('result', data)
                                if isinstance(result, list):
                                    result = result[0]
                                
                                # Use mark_price for limits trigger? or spot_price? Usually Mark for Futures.
                                if 'mark_price' in result:
                                    prices[sym] = Decimal(result['mark_price'])
                           elif 'mark_price' in data:
                                prices[sym] = Decimal(data['mark_price'])
                except Exception as e:
                    logger.error(f"Error fetching Delta prices: {e}")


        executed_orders = []

        for trade in pending_trades:
            current_price = prices.get(trade.asset_symbol.upper())
            if not current_price:
                continue
            
            should_execute = False
            
            # CHECK LIMIT ORDERS
            if trade.order_type == "LIMIT" and trade.limit_price:
                if trade.direction == "BUY" and current_price <= trade.limit_price:
                    should_execute = True
                elif trade.direction == "SELL" and current_price >= trade.limit_price:
                    should_execute = True
            
            # CHECK STOP ORDERS
            elif trade.order_type in ["STOP", "STOP_LIMIT"] and trade.trigger_price:
                 if trade.direction == "BUY" and current_price >= trade.trigger_price:
                     should_execute = True
                 elif trade.direction == "SELL" and current_price <= trade.trigger_price:
                     should_execute = True
            
            if should_execute:
                # Execute Trade
                trade.status = "OPEN"
                trade.opened_at = timezone.now()
                # For Limit, we typically fill at Limit Price or better. 
                # In simulation, let's fill at Limit Price if it's a Limit order, 
                # or Market Price if it's a Stop Market.
                if trade.order_type == "LIMIT":
                    trade.average_price = trade.limit_price 
                else:
                    trade.average_price = current_price
                
                trade.save()

                TradeHistory.objects.create(
                    trade=trade,
                    user=user,
                    action="FILLED",
                    order_type=trade.order_type,
                    quantity=trade.total_quantity,
                    price=trade.average_price,
                    amount=trade.total_quantity * trade.average_price
                )
                
                # Create Notification (Placeholder)
                # Notification.objects.create(user=user, message=f"Order Filled: {trade.asset_symbol} {trade.order_type}")
                
                executed_orders.append(trade.id)

        return executed_orders

    @staticmethod
    def check_expired_trades(user):
        """
        Check for expired Options/Futures and settle them.
        """
        expiry_trades = Trade.objects.filter(
            user=user,
            trade_type__in=['FUTURES', 'OPTIONS'],
            status__in=['OPEN', 'PARTIALLY_CLOSED'],
            # Assuming expiry_date is a field on Trade or related model
            # For now, we iterate and check (or add localized filter if field exists)
        )

        closed_trades = []
        today = timezone.now().date()

        for trade in expiry_trades:
            # Check FuturesDetails/OptionsDetails for expiry
            expiry = None
            if hasattr(trade, 'options_details') and trade.options_details:
                expiry = trade.options_details.expiry_date
            elif hasattr(trade, 'futures_details') and trade.futures_details:
                 expiry = trade.futures_details.expiry_date
            
            if expiry and expiry < today:
                # EXPIRE TRADE
                # 1. Get Settlement Price (Current Market Price)
                # In real world, this is a specific settlement price. 
                # Here, we fetch current price.
                current_price = Decimal('0') # Fetch logic needed
                # For simulation speed, we might skip fetching if we don't have it ready,
                # Or fetch explicitly.
                
                # Close Trade
                trade.status = 'CLOSED'
                trade.closed_at = timezone.now()
                trade.save()
                
                # Calculate PnL (Simplified)
                # Needs proper settlement logic
                
                closed_trades.append(trade.id)
        
        return closed_trades


class PortfolioService:
    """Portfolio management service"""
    
    @staticmethod
    def get_portfolio_summary(user):
        """Get comprehensive portfolio summary"""
        portfolio, _ = Portfolio.objects.get_or_create(user=user)
        portfolio.update_portfolio_metrics()
        
        # Get active positions grouped by asset
        active_trades = Trade.objects.filter(
            user=user,
            status__in=['OPEN', 'PARTIALLY_CLOSED']
        ).order_by('asset_symbol', 'trade_type')
        
        positions_by_asset = {}
        for trade in active_trades:
            key = f"{trade.asset_symbol}_{trade.trade_type}"
            if key not in positions_by_asset:
                positions_by_asset[key] = {
                    'asset_symbol': trade.asset_symbol,
                    'asset_name': trade.asset_name,
                    'trade_type': trade.trade_type,
                    'positions': []
                }
            positions_by_asset[key]['positions'].append({
                'trade_id': trade.id,
                'direction': trade.direction,
                'quantity': trade.remaining_quantity,
                'avg_price': trade.average_price,
                'unrealized_pnl': trade.unrealized_pnl,
                'invested': trade.total_invested
            })
        
        return {
            'portfolio': portfolio,
            'positions_by_asset': list(positions_by_asset.values()),
            'total_positions': len(positions_by_asset)
        }
    
    @staticmethod
    def calculate_day_pnl(user):
        """Calculate P&L for current day"""
        today = timezone.now().date()
        
        # Get all trades updated today
        today_trades = Trade.objects.filter(
            user=user,
            updated_at__date=today
        )
        
        day_realized = sum(
            history.realized_pnl for history in TradeHistory.objects.filter(
                user=user,
                created_at__date=today
            )
        )
        
        # This is simplified - in practice you'd track price changes
        day_unrealized = sum(trade.unrealized_pnl for trade in today_trades)
        
        return day_realized + day_unrealized


class RiskManagementService:
    """Risk management and validation service"""
    
    @staticmethod
    def check_position_limits(user, asset_symbol, new_investment):
        """Check position concentration limits"""
        portfolio = Portfolio.objects.get(user=user)
        
        current_investment = Trade.objects.filter(
            user=user,
            asset_symbol=asset_symbol,
            status__in=['OPEN', 'PARTIALLY_CLOSED']
        ).aggregate(
            total=models.Sum('total_invested')
        )['total'] or Decimal('0')
        
        total_investment = current_investment + new_investment
        
        if portfolio.total_value > 0:
            concentration = (total_investment / portfolio.total_value) * 100
            return {
                'allowed': concentration <= 30,  # Max 30% in single asset
                'concentration': concentration,
                'limit': 30
            }
        
        return {'allowed': True, 'concentration': 0, 'limit': 30}
    
    @staticmethod
    def check_leverage_limits(trade_type, leverage):
        """Check leverage limits by trade type"""
        limits = {
            'SPOT': Decimal('1'),      # No leverage for spot
            'FUTURES': Decimal('10'),  # Max 10x for futures
            'OPTIONS': Decimal('1'),   # No leverage for options
        }
        
        max_leverage = limits.get(trade_type, Decimal('1'))
        return {
            'allowed': leverage <= max_leverage,
            'current': leverage,
            'max_allowed': max_leverage
        }
    
    @staticmethod
    def check_margin_requirements(user, required_margin):
        """Check if user has sufficient margin"""
        # This would integrate with your balance/wallet system
        # For now, returning a placeholder
        return {
            'sufficient': True,  # Replace with actual balance check
            'required': required_margin,
            'available': Decimal('100000')  # Placeholder
        }


class MarketDataService:
    """Market data integration service"""
    
    @staticmethod
    def update_trade_prices(user, price_updates):
        """Update unrealized P&L for trades based on current prices"""
        updated_trades = []
        
        for symbol, current_price in price_updates.items():
            trades = Trade.objects.filter(
                user=user,
                asset_symbol=symbol,
                status__in=['OPEN', 'PARTIALLY_CLOSED']
            )
            
            for trade in trades:
                old_pnl = trade.unrealized_pnl
                new_pnl = trade.calculate_unrealized_pnl(current_price)
                
                updated_trades.append({
                    'trade_id': trade.id,
                    'symbol': symbol,
                    'old_pnl': old_pnl,
                    'new_pnl': new_pnl,
                    'price_change': new_pnl - old_pnl
                })
        
        return updated_trades
    
    @staticmethod
    def get_current_price(asset_symbol):
        """Get current market price for asset"""
        # This would integrate with your market data provider
        # Return placeholder for now
        return Decimal('100.00')


# Utility functions
def get_user_balance(user, currency='USD'):
    """Get user's available balance"""
    # Integrate with your wallet/balance system
    return Decimal('100000.00')  # Placeholder


def send_trade_notification(user, trade, action):
    """Send notification for trade actions"""
    # Integrate with your notification system
    logger.info(f"Trade notification: {user.email} - {action} - {trade.asset_symbol}")


def validate_market_hours(asset_symbol, trade_type):
    """Check if market is open for trading"""
    # Implement market hours validation
    # For crypto, always return True
    # For stocks, check market hours
    return True


def calculate_fees(trade_type, amount):
    """Calculate trading fees"""
    fee_rates = {
        'SPOT': Decimal('0.001'),     # 0.1%
        'FUTURES': Decimal('0.0005'), # 0.05%
        'OPTIONS': Decimal('0.002'),  # 0.2%
    }
    
    rate = fee_rates.get(trade_type, Decimal('0.001'))
    return amount * rate