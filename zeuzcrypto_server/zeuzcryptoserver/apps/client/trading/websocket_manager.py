# websocket_manager.py
import json
import asyncio
import websockets
import logging
import requests
from decimal import Decimal
from django.utils import timezone
from django.conf import settings
from channels.layers import get_channel_layer
from asgiref.sync import sync_to_async
from typing import Dict, Set
from .models import Trade, FuturesDetails, OptionsDetails

logger = logging.getLogger(__name__)


class DeltaWebSocketManager:
    """Manages WebSocket connections to Delta Exchange for real-time price updates"""
    
    def __init__(self):
        self.ws_url = "wss://socket.delta.exchange"
        self.websocket = None
        self.subscribed_symbols: Set[str] = set()
        self.running = False
        self.reconnect_delay = 5
        self.max_reconnect_delay = 60
        self.ping_interval = 30  # Send ping every 30 seconds
        self.last_ping = None
        
    async def connect(self):
        """Establish WebSocket connection"""
        try:
            self.websocket = await websockets.connect(
                self.ws_url,
                ping_interval=self.ping_interval,
                ping_timeout=10
            )
            logger.info("Connected to Delta Exchange WebSocket")
            self.reconnect_delay = 5  # Reset delay on successful connection
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Delta Exchange: {e}")
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
            logger.info(f"Subscribed to symbols: {symbols}")
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
        symbols = set()
        
        # Get symbols from futures and options trades
        trades = Trade.objects.filter(
            status__in=['OPEN', 'PARTIALLY_CLOSED'],
            trade_type__in=['FUTURES', 'OPTIONS']
        ).values_list('asset_symbol', flat=True)
        
        symbols.update(trades)
        return list(symbols)
    
    @sync_to_async
    def update_trade_prices(self, symbol: str, price: Decimal):
        """Update prices for all active trades of a symbol"""
        trades = Trade.objects.filter(
            asset_symbol=symbol,
            status__in=['OPEN', 'PARTIALLY_CLOSED'],
            trade_type__in=['FUTURES', 'OPTIONS']
        ).select_related('futures_details', 'options_details')
        
        for trade in trades:
            try:
                # Calculate unrealized P&L
                trade.calculate_unrealized_pnl(price)
                
                # Check if margin call needed for futures
                if trade.trade_type == 'FUTURES' and hasattr(trade, 'futures_details'):
                    self.check_margin_call(trade, price)
                
                # Check options expiry and value
                elif trade.trade_type == 'OPTIONS' and hasattr(trade, 'options_details'):
                    self.check_options_status(trade, price)
                    
            except Exception as e:
                logger.error(f"Error updating trade {trade.id}: {e}")
    
    def check_margin_call(self, trade: Trade, current_price: Decimal):
        """Check if trade needs to be closed due to margin requirements"""
        try:
            futures_details = trade.futures_details
            
            # Calculate current P&L
            if trade.direction == 'BUY':
                pnl = (current_price - trade.average_price) * trade.remaining_quantity
            else:  # SELL
                pnl = (trade.average_price - current_price) * trade.remaining_quantity
            
            # Calculate remaining margin
            remaining_margin = futures_details.margin_used + pnl
            
            # Margin call threshold (20% of initial margin or when margin becomes negative)
            margin_call_threshold = futures_details.margin_required * Decimal('0.2')
            
            logger.info(
                f"Trade {trade.id} - Symbol: {trade.asset_symbol}, "
                f"Current Price: {current_price}, Remaining Margin: {remaining_margin}, "
                f"Threshold: {margin_call_threshold}, PnL: {pnl}"
            )
            
            # If remaining margin falls below threshold or becomes negative, close the position
            if remaining_margin <= margin_call_threshold or remaining_margin <= 0:
                logger.warning(
                    f"⚠️ MARGIN CALL TRIGGERED for trade {trade.id}. "
                    f"Remaining margin: {remaining_margin}. Auto-closing position..."
                )
                self.close_trade_due_to_margin(trade, current_price, remaining_margin)
                
        except Exception as e:
            logger.error(f"Error checking margin call for trade {trade.id}: {e}")
    
    def close_trade_due_to_margin(self, trade: Trade, current_price: Decimal, remaining_margin: Decimal):
        """Close trade due to insufficient margin by calling CloseTradeView API"""
        try:
            # Prepare data for CloseTradeView
            close_data = {
                'price': str(current_price),
                'quantity': str(trade.remaining_quantity),
                'order_type': 'MARKET',
                'margin_call': True  # Flag to indicate this is a margin call closure
            }
            
            # Get the API endpoint URL
            api_url = f"{settings.BASE_URL}/api/trades/{trade.id}/close/"
            
            # Create a session token for the user (you need to implement this based on your auth)
            # For now, we'll call the internal method directly
            from .views import CloseTradeView
            from rest_framework.request import Request
            from django.test import RequestFactory
            
            factory = RequestFactory()
            request = factory.post(f'/api/trades/{trade.id}/close/', close_data)
            request.user = trade.user
            
            # Create view instance and call the method
            view = CloseTradeView()
            
            # Call the internal close method
            result = view._close_trade(trade, {
                'price': current_price,
                'order_type': 'MARKET'
            })
            
            logger.critical(
                f"🚨 MARGIN CALL - Trade {trade.id} closed automatically. "
                f"Symbol: {trade.asset_symbol}, User: {trade.user.email}, "
                f"Close Price: {current_price}, Realized P&L: {result.get('realized_pnl')}, "
                f"Remaining Margin: {remaining_margin}"
            )
            
            # Notify user via channels
            self.notify_user_margin_call(
                trade.user.id, 
                trade.id, 
                result.get('realized_pnl', '0'),
                remaining_margin,
                current_price
            )
            
        except Exception as e:
            logger.error(f"Error closing trade {trade.id} due to margin call: {e}", exc_info=True)
    
    def check_options_status(self, trade: Trade, current_price: Decimal):
        """Check options expiry and automatic exercise"""
        try:
            options_details = trade.options_details
            
            # Check if expired
            today = timezone.now().date()
            if options_details.expiry_date <= today:
                # Determine if option should be exercised
                is_profitable = False
                
                if options_details.option_type == 'CALL':
                    is_profitable = current_price > options_details.strike_price
                else:  # PUT
                    is_profitable = current_price < options_details.strike_price
                
                if is_profitable and options_details.position == 'LONG':
                    # Exercise the option
                    self.exercise_option(trade, current_price)
                else:
                    # Expire worthless
                    self.expire_option(trade, current_price)
                    
        except Exception as e:
            logger.error(f"Error checking options status for trade {trade.id}: {e}")
    
    def exercise_option(self, trade: Trade, current_price: Decimal):
        """Exercise an option contract by calling CloseTradeView"""
        try:
            from .views import CloseTradeView
            
            view = CloseTradeView()
            result = view._close_trade(trade, {
                'price': current_price,
                'order_type': 'MARKET'
            })
            
            logger.info(
                f"✅ Option {trade.id} exercised automatically. "
                f"Symbol: {trade.asset_symbol}, Close Price: {current_price}, "
                f"Realized P&L: {result.get('realized_pnl')}"
            )
            
        except Exception as e:
            logger.error(f"Error exercising option {trade.id}: {e}")
    
    def expire_option(self, trade: Trade, current_price: Decimal):
        """Handle option expiration by calling CloseTradeView"""
        try:
            from .views import CloseTradeView
            
            view = CloseTradeView()
            result = view._close_trade(trade, {
                'price': Decimal('0'),  # Expired worthless
                'order_type': 'MARKET'
            })
            
            logger.info(
                f"⏰ Option {trade.id} expired worthless. "
                f"Symbol: {trade.asset_symbol}, Loss: {result.get('realized_pnl')}"
            )
            
        except Exception as e:
            logger.error(f"Error expiring option {trade.id}: {e}")
    
    def notify_user_margin_call(self, user_id: int, trade_id: str, pnl: str, remaining_margin: Decimal, close_price: Decimal):
        """Send real-time notification to user about margin call"""
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                asyncio.create_task(
                    channel_layer.group_send(
                        f"user_{user_id}",
                        {
                            "type": "margin_call_notification",
                            "trade_id": str(trade_id),
                            "pnl": str(pnl),
                            "remaining_margin": str(remaining_margin),
                            "close_price": str(close_price),
                            "message": "⚠️ Trade closed due to insufficient margin (Margin Call)",
                            "timestamp": timezone.now().isoformat()
                        }
                    )
                )
            
            # Also send email notification (optional)
            # self.send_email_notification(user_id, trade_id, pnl)
            
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
    
    async def handle_message(self, message: str):
        """Process incoming WebSocket messages"""
        try:
            data = json.loads(message)
            
            # Handle ticker updates
            if data.get('type') == 'ticker' or 'mark_price' in data:
                symbol = data.get('symbol')
                # Delta Exchange might use different field names
                mark_price = data.get('mark_price') or data.get('markPrice') or data.get('price')
                
                if symbol and mark_price:
                    price = Decimal(str(mark_price))
                    logger.debug(f"Price update: {symbol} = {price}")
                    await self.update_trade_prices(symbol, price)
            
            # Handle subscription confirmations
            elif data.get('type') == 'subscriptions':
                logger.info(f"Subscription confirmed: {data.get('channels', [])}")
            
            # Handle errors
            elif data.get('type') == 'error':
                logger.error(f"WebSocket error: {data.get('message', 'Unknown error')}")
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse message: {e}")
        except Exception as e:
            logger.error(f"Error handling message: {e}", exc_info=True)
    
    async def listen(self):
        """Listen for incoming messages"""
        while self.running:
            try:
                if not self.websocket:
                    connected = await self.connect()
                    if connected:
                        # Resubscribe to symbols after reconnection
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
                    logger.info("Ping successful, connection alive")
                except Exception:
                    logger.error("Ping failed, reconnecting...")
                    self.websocket = None
                    
            except websockets.exceptions.ConnectionClosed:
                logger.warning("WebSocket connection closed. Reconnecting...")
                self.websocket = None
                await asyncio.sleep(self.reconnect_delay)
                self.reconnect_delay = min(self.reconnect_delay * 2, self.max_reconnect_delay)
                
            except Exception as e:
                logger.error(f"Error in listen loop: {e}", exc_info=True)
                await asyncio.sleep(5)
    
    async def start(self):
        """Start the WebSocket manager"""
        logger.info("🚀 Starting Delta Exchange WebSocket Manager...")
        self.running = True
        
        # Connect and subscribe to initial symbols
        if await self.connect():
            symbols = await self.get_active_symbols()
            if symbols:
                logger.info(f"Subscribing to {len(symbols)} active symbols: {symbols}")
                await self.subscribe_symbols(symbols)
            else:
                logger.info("No active trades found, waiting for new trades...")
            
            # Start listening
            await self.listen()
        else:
            logger.error("Failed to start WebSocket manager")
    
    async def stop(self):
        """Stop the WebSocket manager"""
        logger.info("Stopping Delta Exchange WebSocket Manager...")
        self.running = False
        if self.websocket:
            await self.websocket.close()
            logger.info("WebSocket connection closed")


# Global instance
ws_manager = DeltaWebSocketManager()


# Helper function to add new symbol subscription
async def subscribe_to_symbol(symbol: str):
    """Helper function to subscribe to a new symbol"""
    if symbol not in ws_manager.subscribed_symbols:
        await ws_manager.subscribe_symbols([symbol])