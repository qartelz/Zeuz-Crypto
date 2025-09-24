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