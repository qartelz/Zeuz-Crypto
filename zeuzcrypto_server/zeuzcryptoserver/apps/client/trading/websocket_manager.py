import json
import asyncio
import websockets
import logging
from decimal import Decimal
from django.utils import timezone
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from typing import Dict, Optional
from .models import Trade, FuturesDetails, PriceHistory

logger = logging.getLogger(__name__)


class DeltaWebSocketManager:
    """Manages WebSocket connections to Delta Exchange for real-time price updates"""
    
    def __init__(self):
        self.ws_url = "wss://socket.delta.exchange"
        self.websocket = None
        self.subscribed_symbols: set = set()
        self.running = False
        self.reconnect_delay = 5
        self.max_reconnect_delay = 60
        self.ping_interval = 30
        self.price_cache: Dict[str, Dict] = {}  # Cache latest prices for comparison
        
    async def connect(self):
        """Establish WebSocket connection"""
        try:
            self.websocket = await websockets.connect(
                self.ws_url,
                ping_interval=self.ping_interval,
                ping_timeout=10
            )
            logger.info("✅ Connected to Delta Exchange WebSocket")
            self.reconnect_delay = 5
            return True
        except Exception as e:
            logger.error(f"❌ Failed to connect to Delta Exchange: {e}")
            return False
    
    async def subscribe_symbols(self, symbols: list):
        """Subscribe to ticker updates for given symbols"""
        if not self.websocket:
            logger.error("WebSocket not connected")
            return False
        
        if not symbols:
            return True
        
        payload = {
            "type": "subscribe",
            "payload": {
                "channels": [
                    {
                        "name": "v2/ticker",
                        "symbols": symbols
                    }
                ]
            }
        }
        
        try:
            await self.websocket.send(json.dumps(payload))
            self.subscribed_symbols.update(symbols)
            logger.info(f"📡 Subscribed to symbols: {symbols}")
            return True
        except Exception as e:
            logger.error(f"Failed to subscribe to symbols: {e}")
            return False
    
    async def unsubscribe_symbols(self, symbols: list):
        """Unsubscribe from ticker updates"""
        if not self.websocket or not symbols:
            return False
        
        payload = {
            "type": "unsubscribe",
            "payload": {
                "channels": [
                    {
                        "name": "v2/ticker",
                        "symbols": symbols
                    }
                ]
            }
        }
        
        try:
            await self.websocket.send(json.dumps(payload))
            self.subscribed_symbols.difference_update(symbols)
            logger.info(f"Unsubscribed from symbols: {symbols}")
            return True
        except Exception as e:
            logger.error(f"Failed to unsubscribe from symbols: {e}")
            return False
    
    @sync_to_async
    def get_active_symbols(self):
        """Get all unique symbols from active trades"""
        trades = Trade.objects.filter(
            status__in=['OPEN', 'PARTIALLY_CLOSED'],
            trade_type__in=['FUTURES', 'OPTIONS']
        ).values_list('asset_symbol', flat=True).distinct()
        
        return list(set(trades))
    
    def compare_prices(self, symbol: str, new_price: Decimal, ticker_data: dict) -> dict:
        """Compare new price with cached price and return analysis"""
        cached = self.price_cache.get(symbol, {})
        old_price = cached.get('mark_price')
        
        comparison = {
            'symbol': symbol,
            'current_price': new_price,
            'previous_price': old_price,
            'price_change': None,
            'price_change_percent': Decimal('0'),
            'direction': 'NEUTRAL',
            'is_high': ticker_data.get('high'),
            'is_low': ticker_data.get('low'),
            'spot_price': ticker_data.get('spot_price'),
            'timestamp': ticker_data.get('time')
        }
        
        if old_price:
            price_diff = new_price - old_price
            comparison['price_change'] = price_diff
            
            if price_diff > 0:
                comparison['direction'] = 'UP'
                comparison['price_change_percent'] = (price_diff / old_price) * 100
            elif price_diff < 0:
                comparison['direction'] = 'DOWN'
                comparison['price_change_percent'] = (price_diff / old_price) * 100
        
        return comparison
    
    def extract_ticker_data(self, data: dict) -> Optional[dict]:
        """Extract and validate ticker data from WebSocket message"""
        try:
            if data.get('type') != 'v2/ticker':
                return None
            
            symbol = data.get('symbol')
            mark_price = data.get('mark_price')
            
            if not symbol or mark_price is None:
                logger.warning(f"Invalid ticker data: missing symbol or mark_price")
                return None
            
            ticker_info = {
                'symbol': symbol,
                'mark_price': Decimal(str(mark_price)),
                'ltp': Decimal(str(data.get('close', 0))),
                'high': Decimal(str(data.get('high', 0))),
                'low': Decimal(str(data.get('low', 0))),
                'volume': float(data.get('volume', 0)),
                'turnover': float(data.get('turnover', 0)),
                'open': Decimal(str(data.get('open', 0))),
                'funding_rate': Decimal(str(data.get('funding_rate', 0))),
                'open_interest': data.get('oi_contracts'),
                'spot_price': Decimal(str(data.get('spot_price', 0))),
                'product_status': data.get('product_trading_status'),
                'timestamp': data.get('time'),
                'best_bid': data.get('quotes', {}).get('best_bid'),
                'best_ask': data.get('quotes', {}).get('best_ask'),
            }
            
            return ticker_info
        except Exception as e:
            logger.error(f"Error extracting ticker data: {e}")
            return None
    
    @sync_to_async
    def update_trade_prices(self, symbol: str, ticker_data: dict, comparison: dict):
        """Update prices for all active trades of a symbol"""
        try:
            trades = Trade.objects.filter(
                asset_symbol=symbol,
                status__in=['OPEN', 'PARTIALLY_CLOSED'],
                trade_type__in=['FUTURES', 'OPTIONS']
            ).select_related('futures_details', 'options_details')
            
            new_price = ticker_data['mark_price']
            
            for trade in trades:
                try:
                    # Calculate unrealized P&L
                    if trade.trade_type == 'FUTURES':
                        self.update_futures_trade(trade, new_price, comparison)
                    elif trade.trade_type == 'OPTIONS':
                        self.update_options_trade(trade, new_price, comparison)
                    
                    # Check margin call
                    if trade.trade_type == 'FUTURES' and hasattr(trade, 'futures_details'):
                        self.check_margin_call(trade, new_price)
                    
                except Exception as e:
                    logger.error(f"Error updating trade {trade.id}: {e}")
            
            # Store ticker data in cache and DB
            self.price_cache[symbol] = ticker_data
            self.store_price_history(symbol, ticker_data)
            
        except Exception as e:
            logger.error(f"Error updating trade prices for {symbol}: {e}")
    
    def update_futures_trade(self, trade: Trade, current_price: Decimal, comparison: dict):
        """Update futures trade with current price"""
        try:
            if trade.direction == 'BUY':
                pnl = (current_price - trade.average_price) * trade.remaining_quantity
            else:  # SELL
                pnl = (trade.average_price - current_price) * trade.remaining_quantity
            
            trade.unrealized_pnl = pnl
            trade.current_price = current_price
            trade.last_price_update = timezone.now()
            trade.save(update_fields=['unrealized_pnl', 'current_price', 'last_price_update'])
            
            logger.debug(
                f"Trade {trade.id} updated - Symbol: {trade.asset_symbol}, "
                f"Price: {current_price}, PnL: {pnl}, Direction: {comparison['direction']}"
            )
            
        except Exception as e:
            logger.error(f"Error updating futures trade {trade.id}: {e}")
    
    def update_options_trade(self, trade: Trade, current_price: Decimal, comparison: dict):
        """Update options trade with current price"""
        try:
            trade.current_price = current_price
            trade.last_price_update = timezone.now()
            trade.save(update_fields=['current_price', 'last_price_update'])
            
        except Exception as e:
            logger.error(f"Error updating options trade {trade.id}: {e}")
    
    def check_margin_call(self, trade: Trade, current_price: Decimal):
        """Check if margin call is needed"""
        try:
            futures_details = trade.futures_details
            
            if trade.direction == 'BUY':
                pnl = (current_price - trade.average_price) * trade.remaining_quantity
            else:
                pnl = (trade.average_price - current_price) * trade.remaining_quantity
            
            remaining_margin = futures_details.margin_used + pnl
            margin_threshold = futures_details.margin_required * Decimal('0.2')
            
            logger.info(
                f"Margin Check - Trade {trade.id}: Current Price: {current_price}, "
                f"Remaining Margin: {remaining_margin}, Threshold: {margin_threshold}"
            )
            
            if remaining_margin <= margin_threshold or remaining_margin <= 0:
                logger.warning(
                    f"⚠️ MARGIN CALL TRIGGERED for trade {trade.id}. "
                    f"Remaining margin: {remaining_margin}"
                )
                self.notify_margin_call(trade, current_price, remaining_margin, pnl)
        
        except Exception as e:
            logger.error(f"Error checking margin call: {e}")
    
    def notify_margin_call(self, trade: Trade, current_price: Decimal, remaining_margin: Decimal, pnl: Decimal):
        """Send margin call notification"""
        try:
            asyncio.create_task(
                self._send_notification(
                    user_id=trade.user.id,
                    notification_type='margin_call',
                    data={
                        'trade_id': str(trade.id),
                        'symbol': trade.asset_symbol,
                        'current_price': str(current_price),
                        'remaining_margin': str(remaining_margin),
                        'pnl': str(pnl),
                        'message': '⚠️ Margin Call: Your position may be liquidated',
                        'timestamp': timezone.now().isoformat()
                    }
                )
            )
        except Exception as e:
            logger.error(f"Error sending margin call notification: {e}")
    
    @sync_to_async
    def store_price_history(self, symbol: str, ticker_data: dict):
        """Store price history for analysis"""
        try:
            PriceHistory.objects.create(
                symbol=symbol,
                mark_price=ticker_data['mark_price'],
                ltp=ticker_data['ltp'],
                high=ticker_data['is_high'],
                low=ticker_data['is_low'],
                volume=ticker_data['volume'],
                timestamp=ticker_data['timestamp']
            )
        except Exception as e:
            logger.error(f"Error storing price history: {e}")
    
    async def _send_notification(self, user_id: int, notification_type: str, data: dict):
        """Send notification via WebSocket channel"""
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                await channel_layer.group_send(
                    f"user_{user_id}",
                    {
                        "type": notification_type,
                        **data
                    }
                )
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
    
    async def handle_message(self, message: str):
        """Process incoming WebSocket messages"""
        try:
            data = json.loads(message)
            
            # Handle ticker updates
            if data.get('type') == 'v2/ticker':
                ticker_data = self.extract_ticker_data(data)
                
                if ticker_data:
                    symbol = ticker_data['symbol']
                    mark_price = ticker_data['mark_price']
                    
                    # Compare prices
                    comparison = self.compare_prices(symbol, mark_price, data)
                    
                    logger.info(
                        f"📊 {symbol}: {mark_price} (Dir: {comparison['direction']}, "
                        f"Change: {comparison['price_change_percent']:.2f}%)"
                    )
                    
                    # Update trades
                    await self.update_trade_prices(symbol, ticker_data, comparison)
            
            # Handle subscription confirmations
            elif data.get('type') == 'subscriptions':
                logger.info(f"✅ Subscription confirmed")
            
            # Handle errors
            elif data.get('type') == 'error':
                logger.error(f"WebSocket error: {data.get('message', 'Unknown error')}")
        
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse message: {e}")
        except Exception as e:
            logger.error(f"Error handling message: {e}")
    
    async def listen(self):
        """Listen for incoming messages with reconnection logic"""
        while self.running:
            try:
                if not self.websocket:
                    connected = await self.connect()
                    if connected:
                        symbols = await self.get_active_symbols()
                        if symbols:
                            await self.subscribe_symbols(symbols)
                    else:
                        await asyncio.sleep(self.reconnect_delay)
                        self.reconnect_delay = min(self.reconnect_delay * 2, self.max_reconnect_delay)
                        continue
                
                message = await asyncio.wait_for(self.websocket.recv(), timeout=60)
                await self.handle_message(message)
            
            except asyncio.TimeoutError:
                logger.warning("No message received in 60 seconds, checking connection...")
                try:
                    pong = await self.websocket.ping()
                    await asyncio.wait_for(pong, timeout=10)
                    logger.info("✅ Ping successful")
                except Exception:
                    logger.error("Ping failed, reconnecting...")
                    self.websocket = None
            
            except websockets.exceptions.ConnectionClosed:
                logger.warning("WebSocket closed. Reconnecting...")
                self.websocket = None
                await asyncio.sleep(self.reconnect_delay)
                self.reconnect_delay = min(self.reconnect_delay * 2, self.max_reconnect_delay)
            
            except Exception as e:
                logger.error(f"Error in listen loop: {e}")
                await asyncio.sleep(5)
    
    async def start(self):
        """Start the WebSocket manager"""
        logger.info("🚀 Starting Delta Exchange WebSocket Manager...")
        self.running = True
        
        if await self.connect():
            symbols = await self.get_active_symbols()
            if symbols:
                logger.info(f"Subscribing to {len(symbols)} symbols...")
                await self.subscribe_symbols(symbols)
            else:
                logger.info("No active trades, waiting for new trades...")
            
            await self.listen()
        else:
            logger.error("Failed to start WebSocket manager")
    
    async def stop(self):
        """Stop the WebSocket manager"""
        logger.info("Stopping WebSocket Manager...")
        self.running = False
        if self.websocket:
            await self.websocket.close()


# Global instance
ws_manager = DeltaWebSocketManager()


async def subscribe_to_symbol(symbol: str):
    """Subscribe to a new symbol"""
    if symbol not in ws_manager.subscribed_symbols:
        await ws_manager.subscribe_symbols([symbol])
# # websocket_manager.py
# import json
# import asyncio
# import websockets
# import logging
# import requests
# from decimal import Decimal
# from django.utils import timezone
# from django.conf import settings
# from channels.layers import get_channel_layer
# from asgiref.sync import sync_to_async
# from typing import Dict, Set
# from .models import Trade, FuturesDetails, OptionsDetails

# logger = logging.getLogger(__name__)


# class DeltaWebSocketManager:
#     """Manages WebSocket connections to Delta Exchange for real-time price updates"""
    
#     def __init__(self):
#         self.ws_url = "wss://socket.delta.exchange"
#         self.websocket = None
#         self.subscribed_symbols: Set[str] = set()
#         self.running = False
#         self.reconnect_delay = 5
#         self.max_reconnect_delay = 60
#         self.ping_interval = 30  # Send ping every 30 seconds
#         self.last_ping = None
        
#     async def connect(self):
#         """Establish WebSocket connection"""
#         try:
#             self.websocket = await websockets.connect(
#                 self.ws_url,
#                 ping_interval=self.ping_interval,
#                 ping_timeout=10
#             )
#             logger.info("Connected to Delta Exchange WebSocket")
#             self.reconnect_delay = 5  # Reset delay on successful connection
#             return True
#         except Exception as e:
#             logger.error(f"Failed to connect to Delta Exchange: {e}")
#             return False
    
#     async def subscribe_symbols(self, symbols: list):
#         """Subscribe to ticker updates for given symbols"""
#         if not self.websocket:
#             logger.error("WebSocket not connected")
#             return False
        
#         if not symbols:
#             return True
        
#         payload = {
#             "type": "subscribe",
#             "payload": {
#                 "channels": [
#                     {
#                         "name": "v2/ticker",
#                         "symbols": symbols
#                     }
#                 ]
#             }
#         }
        
#         try:
#             await self.websocket.send(json.dumps(payload))
#             self.subscribed_symbols.update(symbols)
#             logger.info(f"Subscribed to symbols: {symbols}")
#             return True
#         except Exception as e:
#             logger.error(f"Failed to subscribe to symbols: {e}")
#             return False
    
#     async def unsubscribe_symbols(self, symbols: list):
#         """Unsubscribe from ticker updates"""
#         if not self.websocket or not symbols:
#             return False
        
#         payload = {
#             "type": "unsubscribe",
#             "payload": {
#                 "channels": [
#                     {
#                         "name": "v2/ticker",
#                         "symbols": symbols
#                     }
#                 ]
#             }
#         }
        
#         try:
#             await self.websocket.send(json.dumps(payload))
#             self.subscribed_symbols.difference_update(symbols)
#             logger.info(f"Unsubscribed from symbols: {symbols}")
#             return True
#         except Exception as e:
#             logger.error(f"Failed to unsubscribe from symbols: {e}")
#             return False
    
#     @sync_to_async
#     def get_active_symbols(self):
#         """Get all unique symbols from active trades"""
#         symbols = set()
        
#         # Get symbols from futures and options trades
#         trades = Trade.objects.filter(
#             status__in=['OPEN', 'PARTIALLY_CLOSED'],
#             trade_type__in=['FUTURES', 'OPTIONS']
#         ).values_list('asset_symbol', flat=True)
        
#         symbols.update(trades)
#         return list(symbols)
    
#     @sync_to_async
#     def update_trade_prices(self, symbol: str, price: Decimal):
#         """Update prices for all active trades of a symbol"""
#         trades = Trade.objects.filter(
#             asset_symbol=symbol,
#             status__in=['OPEN', 'PARTIALLY_CLOSED'],
#             trade_type__in=['FUTURES', 'OPTIONS']
#         ).select_related('futures_details', 'options_details')
        
#         for trade in trades:
#             try:
#                 # Calculate unrealized P&L
#                 trade.calculate_unrealized_pnl(price)
                
#                 # Check if margin call needed for futures
#                 if trade.trade_type == 'FUTURES' and hasattr(trade, 'futures_details'):
#                     self.check_margin_call(trade, price)
                
#                 # Check options expiry and value
#                 elif trade.trade_type == 'OPTIONS' and hasattr(trade, 'options_details'):
#                     self.check_options_status(trade, price)
                    
#             except Exception as e:
#                 logger.error(f"Error updating trade {trade.id}: {e}")
    
#     def check_margin_call(self, trade: Trade, current_price: Decimal):
#         """Check if trade needs to be closed due to margin requirements"""
#         try:
#             futures_details = trade.futures_details
            
#             # Calculate current P&L
#             if trade.direction == 'BUY':
#                 pnl = (current_price - trade.average_price) * trade.remaining_quantity
#             else:  # SELL
#                 pnl = (trade.average_price - current_price) * trade.remaining_quantity
            
#             # Calculate remaining margin
#             remaining_margin = futures_details.margin_used + pnl
            
#             # Margin call threshold (20% of initial margin or when margin becomes negative)
#             margin_call_threshold = futures_details.margin_required * Decimal('0.2')
            
#             logger.info(
#                 f"Trade {trade.id} - Symbol: {trade.asset_symbol}, "
#                 f"Current Price: {current_price}, Remaining Margin: {remaining_margin}, "
#                 f"Threshold: {margin_call_threshold}, PnL: {pnl}"
#             )
            
#             # If remaining margin falls below threshold or becomes negative, close the position
#             if remaining_margin <= margin_call_threshold or remaining_margin <= 0:
#                 logger.warning(
#                     f"⚠️ MARGIN CALL TRIGGERED for trade {trade.id}. "
#                     f"Remaining margin: {remaining_margin}. Auto-closing position..."
#                 )
#                 self.close_trade_due_to_margin(trade, current_price, remaining_margin)
                
#         except Exception as e:
#             logger.error(f"Error checking margin call for trade {trade.id}: {e}")
    
#     def close_trade_due_to_margin(self, trade: Trade, current_price: Decimal, remaining_margin: Decimal):
#         """Close trade due to insufficient margin by calling CloseTradeView API"""
#         try:
#             # Prepare data for CloseTradeView
#             close_data = {
#                 'price': str(current_price),
#                 'quantity': str(trade.remaining_quantity),
#                 'order_type': 'MARKET',
#                 'margin_call': True  # Flag to indicate this is a margin call closure
#             }
            
#             # Get the API endpoint URL
#             api_url = f"{settings.BASE_URL}/api/trades/{trade.id}/close/"
            
#             # Create a session token for the user (you need to implement this based on your auth)
#             # For now, we'll call the internal method directly
#             from .views import CloseTradeView
#             from rest_framework.request import Request
#             from django.test import RequestFactory
            
#             factory = RequestFactory()
#             request = factory.post(f'/api/trades/{trade.id}/close/', close_data)
#             request.user = trade.user
            
#             # Create view instance and call the method
#             view = CloseTradeView()
            
#             # Call the internal close method
#             result = view._close_trade(trade, {
#                 'price': current_price,
#                 'order_type': 'MARKET'
#             })
            
#             logger.critical(
#                 f"🚨 MARGIN CALL - Trade {trade.id} closed automatically. "
#                 f"Symbol: {trade.asset_symbol}, User: {trade.user.email}, "
#                 f"Close Price: {current_price}, Realized P&L: {result.get('realized_pnl')}, "
#                 f"Remaining Margin: {remaining_margin}"
#             )
            
#             # Notify user via channels
#             self.notify_user_margin_call(
#                 trade.user.id, 
#                 trade.id, 
#                 result.get('realized_pnl', '0'),
#                 remaining_margin,
#                 current_price
#             )
            
#         except Exception as e:
#             logger.error(f"Error closing trade {trade.id} due to margin call: {e}", exc_info=True)
    
#     def check_options_status(self, trade: Trade, current_price: Decimal):
#         """Check options expiry and automatic exercise"""
#         try:
#             options_details = trade.options_details
            
#             # Check if expired
#             today = timezone.now().date()
#             if options_details.expiry_date <= today:
#                 # Determine if option should be exercised
#                 is_profitable = False
                
#                 if options_details.option_type == 'CALL':
#                     is_profitable = current_price > options_details.strike_price
#                 else:  # PUT
#                     is_profitable = current_price < options_details.strike_price
                
#                 if is_profitable and options_details.position == 'LONG':
#                     # Exercise the option
#                     self.exercise_option(trade, current_price)
#                 else:
#                     # Expire worthless
#                     self.expire_option(trade, current_price)
                    
#         except Exception as e:
#             logger.error(f"Error checking options status for trade {trade.id}: {e}")
    
#     def exercise_option(self, trade: Trade, current_price: Decimal):
#         """Exercise an option contract by calling CloseTradeView"""
#         try:
#             from .views import CloseTradeView
            
#             view = CloseTradeView()
#             result = view._close_trade(trade, {
#                 'price': current_price,
#                 'order_type': 'MARKET'
#             })
            
#             logger.info(
#                 f"✅ Option {trade.id} exercised automatically. "
#                 f"Symbol: {trade.asset_symbol}, Close Price: {current_price}, "
#                 f"Realized P&L: {result.get('realized_pnl')}"
#             )
            
#         except Exception as e:
#             logger.error(f"Error exercising option {trade.id}: {e}")
    
#     def expire_option(self, trade: Trade, current_price: Decimal):
#         """Handle option expiration by calling CloseTradeView"""
#         try:
#             from .views import CloseTradeView
            
#             view = CloseTradeView()
#             result = view._close_trade(trade, {
#                 'price': Decimal('0'),  # Expired worthless
#                 'order_type': 'MARKET'
#             })
            
#             logger.info(
#                 f"⏰ Option {trade.id} expired worthless. "
#                 f"Symbol: {trade.asset_symbol}, Loss: {result.get('realized_pnl')}"
#             )
            
#         except Exception as e:
#             logger.error(f"Error expiring option {trade.id}: {e}")
    
#     def notify_user_margin_call(self, user_id: int, trade_id: str, pnl: str, remaining_margin: Decimal, close_price: Decimal):
#         """Send real-time notification to user about margin call"""
#         try:
#             channel_layer = get_channel_layer()
#             if channel_layer:
#                 asyncio.create_task(
#                     channel_layer.group_send(
#                         f"user_{user_id}",
#                         {
#                             "type": "margin_call_notification",
#                             "trade_id": str(trade_id),
#                             "pnl": str(pnl),
#                             "remaining_margin": str(remaining_margin),
#                             "close_price": str(close_price),
#                             "message": "⚠️ Trade closed due to insufficient margin (Margin Call)",
#                             "timestamp": timezone.now().isoformat()
#                         }
#                     )
#                 )
            
#             # Also send email notification (optional)
#             # self.send_email_notification(user_id, trade_id, pnl)
            
#         except Exception as e:
#             logger.error(f"Error sending notification: {e}")
    
#     async def handle_message(self, message: str):
#         """Process incoming WebSocket messages"""
#         try:
#             data = json.loads(message)
            
#             # Handle ticker updates
#             if data.get('type') == 'ticker' or 'mark_price' in data:
#                 symbol = data.get('symbol')
#                 # Delta Exchange might use different field names
#                 mark_price = data.get('mark_price') or data.get('markPrice') or data.get('price')
                
#                 if symbol and mark_price:
#                     price = Decimal(str(mark_price))
#                     logger.debug(f"Price update: {symbol} = {price}")
#                     await self.update_trade_prices(symbol, price)
            
#             # Handle subscription confirmations
#             elif data.get('type') == 'subscriptions':
#                 logger.info(f"Subscription confirmed: {data.get('channels', [])}")
            
#             # Handle errors
#             elif data.get('type') == 'error':
#                 logger.error(f"WebSocket error: {data.get('message', 'Unknown error')}")
                
#         except json.JSONDecodeError as e:
#             logger.error(f"Failed to parse message: {e}")
#         except Exception as e:
#             logger.error(f"Error handling message: {e}", exc_info=True)
    
#     async def listen(self):
#         """Listen for incoming messages"""
#         while self.running:
#             try:
#                 if not self.websocket:
#                     connected = await self.connect()
#                     if connected:
#                         # Resubscribe to symbols after reconnection
#                         symbols = await self.get_active_symbols()
#                         if symbols:
#                             await self.subscribe_symbols(symbols)
#                     else:
#                         await asyncio.sleep(self.reconnect_delay)
#                         self.reconnect_delay = min(self.reconnect_delay * 2, self.max_reconnect_delay)
#                         continue
                
#                 message = await asyncio.wait_for(self.websocket.recv(), timeout=60)
#                 await self.handle_message(message)
                
#             except asyncio.TimeoutError:
#                 logger.warning("No message received in 60 seconds, checking connection...")
#                 try:
#                     pong = await self.websocket.ping()
#                     await asyncio.wait_for(pong, timeout=10)
#                     logger.info("Ping successful, connection alive")
#                 except Exception:
#                     logger.error("Ping failed, reconnecting...")
#                     self.websocket = None
                    
#             except websockets.exceptions.ConnectionClosed:
#                 logger.warning("WebSocket connection closed. Reconnecting...")
#                 self.websocket = None
#                 await asyncio.sleep(self.reconnect_delay)
#                 self.reconnect_delay = min(self.reconnect_delay * 2, self.max_reconnect_delay)
                
#             except Exception as e:
#                 logger.error(f"Error in listen loop: {e}", exc_info=True)
#                 await asyncio.sleep(5)
    
#     async def start(self):
#         """Start the WebSocket manager"""
#         logger.info("🚀 Starting Delta Exchange WebSocket Manager...")
#         self.running = True
        
#         # Connect and subscribe to initial symbols
#         if await self.connect():
#             symbols = await self.get_active_symbols()
#             if symbols:
#                 logger.info(f"Subscribing to {len(symbols)} active symbols: {symbols}")
#                 await self.subscribe_symbols(symbols)
#             else:
#                 logger.info("No active trades found, waiting for new trades...")
            
#             # Start listening
#             await self.listen()
#         else:
#             logger.error("Failed to start WebSocket manager")
    
#     async def stop(self):
#         """Stop the WebSocket manager"""
#         logger.info("Stopping Delta Exchange WebSocket Manager...")
#         self.running = False
#         if self.websocket:
#             await self.websocket.close()
#             logger.info("WebSocket connection closed")


# # Global instance
# ws_manager = DeltaWebSocketManager()


# # Helper function to add new symbol subscription
# async def subscribe_to_symbol(symbol: str):
#     """Helper function to subscribe to a new symbol"""
#     if symbol not in ws_manager.subscribed_symbols:
#         await ws_manager.subscribe_symbols([symbol])