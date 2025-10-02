# views.py - Complete version with all imports and fixes
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Q, Sum
from django.utils import timezone
from decimal import Decimal
from datetime import datetime, timedelta
import uuid
import logging

# Initialize logger
logger = logging.getLogger(__name__)

from .models import Trade, FuturesDetails, OptionsDetails, TradeHistory, Portfolio
from .serializers import (
    TradeSerializer, PlaceOrderSerializer, PartialCloseSerializer, 
    CloseTradeSerializer, PortfolioSerializer, ActivePositionSerializer,
    PnLReportSerializer, RiskCheckSerializer, UpdatePricesSerializer,
    TradeHistorySerializer
)


class TradeViewSet(viewsets.ModelViewSet):
    serializer_class = TradeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Trade.objects.filter(user=self.request.user).order_by('-opened_at')

    @action(detail=True, methods=['post'])
    def update_pnl(self, request, pk=None):
        trade = self.get_object()
        current_price = request.data.get('current_price')
        if current_price:
            pnl = trade.calculate_unrealized_pnl(Decimal(current_price))
            return Response({'unrealized_pnl': pnl})
        return Response({'error': 'Current price is required'}, status=400)


class PlaceOrderView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = PlaceOrderSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    result = self._process_order(request.user, serializer.validated_data)
                    return Response(result, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Error processing order: {str(e)}", exc_info=True)
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def _process_order(self, user, data):
        """Main order processing logic"""
        trade_type = data['trade_type']
        
        if trade_type == 'SPOT':
            return self._process_spot_order(user, data)
        elif trade_type == 'FUTURES':
            return self._process_futures_order(user, data)
        elif trade_type == 'OPTIONS':
            return self._process_options_order(user, data)
        else:
            raise ValueError(f"Unsupported trade type: {trade_type}")
    
    def _process_spot_order(self, user, data):
        """Handle spot trading logic"""
        asset_symbol = data['asset_symbol']
        direction = data['direction']
        quantity = data['quantity']
        price = data['price']
        holding_type = data['holding_type']
        
        # Find existing trade for this asset and holding type
        existing_trade = Trade.objects.filter(
            user=user,
            asset_symbol=asset_symbol,
            trade_type='SPOT',
            holding_type=holding_type,
            status__in=['OPEN', 'PARTIALLY_CLOSED']
        ).first()
        
        if direction == 'BUY':
            return self._handle_spot_buy(user, data, existing_trade)
        else:
            return self._handle_spot_sell(user, data, existing_trade)
    
    def _handle_spot_buy(self, user, data, existing_trade):
        """Handle spot buy orders"""
        quantity = data['quantity']
        price = data['price']
        amount = quantity * price
        
        if existing_trade:
            # Add to existing position (average price)
            old_value = existing_trade.remaining_quantity * existing_trade.average_price
            new_value = quantity * price
            total_quantity = existing_trade.remaining_quantity + quantity
            
            existing_trade.average_price = (old_value + new_value) / total_quantity
            existing_trade.remaining_quantity = total_quantity
            existing_trade.total_quantity += quantity
            existing_trade.total_invested += amount
            existing_trade.save()
            
            trade = existing_trade
        else:
            # Create new trade
            trade = Trade.objects.create(
                user=user,
                asset_symbol=data['asset_symbol'],
                asset_name=data.get('asset_name', ''),
                asset_exchange=data.get('asset_exchange', ''),
                trade_type='SPOT',
                direction='BUY',
                status='OPEN',
                holding_type=data['holding_type'],
                total_quantity=quantity,
                remaining_quantity=quantity,
                average_price=price,
                total_invested=amount
            )
        
        # Record trade history
        TradeHistory.objects.create(
            trade=trade,
            user=user,
            action='BUY',
            order_type=data.get('order_type', 'MARKET'),
            quantity=quantity,
            price=price,
            amount=amount
        )
        
        # Update portfolio
        self._update_portfolio(user)
        
        return {
            'trade_id': str(trade.id),
            'action': 'BUY' if not existing_trade else 'ADD_TO_POSITION',
            'quantity': str(quantity),
            'price': str(price),
            'total_quantity': str(trade.total_quantity),
            'average_price': str(trade.average_price)
        }
    
    def _handle_spot_sell(self, user, data, existing_trade):
        """Handle spot sell orders"""
        if not existing_trade:
            # For intraday, allow short selling
            if data['holding_type'] == 'INTRADAY':
                return self._create_short_position(user, data)
            else:
                raise ValueError("No existing position to sell for long-term trades")
        
        quantity = data['quantity']
        price = data['price']
        
        if quantity > existing_trade.remaining_quantity:
            raise ValueError("Cannot sell more than available quantity")
        
        # Calculate P&L for this sell
        cost_basis = existing_trade.average_price * quantity
        sell_value = price * quantity
        realized_pnl = sell_value - cost_basis
        
        # Update trade
        existing_trade.remaining_quantity -= quantity
        existing_trade.realized_pnl += realized_pnl
        
        if existing_trade.remaining_quantity == 0:
            existing_trade.status = 'CLOSED'
            existing_trade.closed_at = timezone.now()
        elif existing_trade.remaining_quantity < existing_trade.total_quantity:
            existing_trade.status = 'PARTIALLY_CLOSED'
        
        existing_trade.save()
        
        # Record trade history
        TradeHistory.objects.create(
            trade=existing_trade,
            user=user,
            action='SELL' if existing_trade.remaining_quantity == 0 else 'PARTIAL_SELL',
            order_type=data.get('order_type', 'MARKET'),
            quantity=quantity,
            price=price,
            amount=sell_value,
            realized_pnl=realized_pnl
        )
        
        # Update portfolio
        self._update_portfolio(user)
        
        return {
            'trade_id': str(existing_trade.id),
            'action': 'SELL',
            'quantity': str(quantity),
            'price': str(price),
            'realized_pnl': str(realized_pnl),
            'remaining_quantity': str(existing_trade.remaining_quantity),
            'status': existing_trade.status
        }
    
    def _create_short_position(self, user, data):
        """Create short position for intraday spot trading"""
        quantity = data['quantity']
        price = data['price']
        amount = quantity * price
        
        trade = Trade.objects.create(
            user=user,
            asset_symbol=data['asset_symbol'],
            asset_name=data.get('asset_name', ''),
            asset_exchange=data.get('asset_exchange', ''),
            trade_type='SPOT',
            direction='SELL',
            status='OPEN',
            holding_type='INTRADAY',
            total_quantity=quantity,
            remaining_quantity=quantity,
            average_price=price,
            total_invested=amount
        )
        
        TradeHistory.objects.create(
            trade=trade,
            user=user,
            action='SELL',
            order_type=data.get('order_type', 'MARKET'),
            quantity=quantity,
            price=price,
            amount=amount
        )
        
        self._update_portfolio(user)
        
        return {
            'trade_id': str(trade.id),
            'action': 'CREATE_SHORT_POSITION',
            'quantity': str(quantity),
            'price': str(price)
        }
    
    def _process_futures_order(self, user, data):
        """Handle futures trading logic"""
        asset_symbol = data['asset_symbol']
        direction = data['direction']
        quantity = data['quantity']
        price = data['price']
        
        # Find existing futures position
        existing_trade = Trade.objects.filter(
            user=user,
            asset_symbol=asset_symbol,
            trade_type='FUTURES',
            status__in=['OPEN', 'PARTIALLY_CLOSED']
        ).first()
        
        if existing_trade:
            return self._handle_existing_futures_position(user, data, existing_trade)
        else:
            return self._create_new_futures_position(user, data)
    
    def _handle_existing_futures_position(self, user, data, existing_trade):
        """Handle futures position modification"""
        direction = data['direction']
        quantity = data['quantity']
        price = data['price']
        
        if existing_trade.direction == direction:
            # Same direction - increase position
            old_value = existing_trade.remaining_quantity * existing_trade.average_price
            new_value = quantity * price
            total_quantity = existing_trade.remaining_quantity + quantity
            
            existing_trade.average_price = (old_value + new_value) / total_quantity
            existing_trade.remaining_quantity = total_quantity
            existing_trade.total_quantity += quantity
            existing_trade.save()
            
            action = 'INCREASE_POSITION'
        else:
            # Opposite direction - reduce position
            if quantity > existing_trade.remaining_quantity:
                # Flip position
                remaining_qty = quantity - existing_trade.remaining_quantity
                existing_trade.remaining_quantity = remaining_qty
                existing_trade.direction = direction
                existing_trade.average_price = price
                action = 'FLIP_POSITION'
            elif quantity == existing_trade.remaining_quantity:
                # Close position
                existing_trade.remaining_quantity = Decimal('0')
                existing_trade.status = 'CLOSED'
                existing_trade.closed_at = timezone.now()
                action = 'CLOSE_POSITION'
            else:
                # Reduce position
                existing_trade.remaining_quantity -= quantity
                action = 'REDUCE_POSITION'
            
            existing_trade.save()
        
        # Record trade history
        TradeHistory.objects.create(
            trade=existing_trade,
            user=user,
            action=direction,
            order_type=data.get('order_type', 'MARKET'),
            quantity=quantity,
            price=price,
            amount=quantity * price
        )
        
        self._update_portfolio(user)
        
        return {
            'trade_id': str(existing_trade.id),
            'action': action,
            'direction': direction,
            'quantity': str(quantity),
            'price': str(price),
            'remaining_quantity': str(existing_trade.remaining_quantity)
        }
    
    def _create_new_futures_position(self, user, data):
        """Create new futures position"""
        quantity = data['quantity']
        price = data['price']
        leverage = data.get('leverage', Decimal('1'))
        
        # Calculate margin
        position_value = quantity * price
        margin_required = position_value / leverage
        
        # Create trade
        trade = Trade.objects.create(
            user=user,
            asset_symbol=data['asset_symbol'],
            asset_name=data.get('asset_name', ''),
            asset_exchange=data.get('asset_exchange', ''),
            trade_type='FUTURES',
            direction=data['direction'],
            status='OPEN',
            holding_type=data.get('holding_type', 'INTRADAY'),
            total_quantity=quantity,
            remaining_quantity=quantity,
            average_price=price,
            total_invested=margin_required
        )
        
        # Create futures details
        FuturesDetails.objects.create(
            trade=trade,
            leverage=leverage,
            margin_required=margin_required,
            margin_used=margin_required,
            expiry_date=data['expiry_date'],
            contract_size=data.get('contract_size', Decimal('1')),
            is_hedged=data.get('is_hedged', False)
        )
        
        # Record trade history
        TradeHistory.objects.create(
            trade=trade,
            user=user,
            action=data['direction'],
            order_type=data.get('order_type', 'MARKET'),
            quantity=quantity,
            price=price,
            amount=position_value
        )
        
        self._update_portfolio(user)
        
        return {
            'trade_id': str(trade.id),
            'action': 'CREATE_FUTURES_POSITION',
            'direction': data['direction'],
            'quantity': str(quantity),
            'price': str(price),
            'leverage': str(leverage),
            'margin_required': str(margin_required)
        }
    
    def _process_options_order(self, user, data):
        """Handle options trading logic"""
        asset_symbol = data['asset_symbol']
        option_type = data['option_type']
        strike_price = data['strike_price']
        expiry_date = data['expiry_date']
        
        # Find existing option position
        existing_trade = Trade.objects.filter(
            user=user,
            asset_symbol=asset_symbol,
            trade_type='OPTIONS',
            status__in=['OPEN', 'PARTIALLY_CLOSED'],
            options_details__option_type=option_type,
            options_details__strike_price=strike_price,
            options_details__expiry_date=expiry_date
        ).first()
        
        if existing_trade:
            return self._handle_existing_options_position(user, data, existing_trade)
        else:
            return self._create_new_options_position(user, data)
    
    def _handle_existing_options_position(self, user, data, existing_trade):
        """Handle existing options position"""
        quantity = data['quantity']
        premium = data['premium']
        
        # Increase position
        old_value = existing_trade.remaining_quantity * existing_trade.average_price
        new_value = quantity * premium
        total_quantity = existing_trade.remaining_quantity + quantity
        
        existing_trade.average_price = (old_value + new_value) / total_quantity
        existing_trade.remaining_quantity = total_quantity
        existing_trade.total_quantity += quantity
        existing_trade.total_invested += (quantity * premium)
        existing_trade.save()
        
        TradeHistory.objects.create(
            trade=existing_trade,
            user=user,
            action=data['direction'],
            order_type=data.get('order_type', 'MARKET'),
            quantity=quantity,
            price=premium,
            amount=quantity * premium
        )
        
        self._update_portfolio(user)
        
        return {
            'trade_id': str(existing_trade.id),
            'action': 'INCREASE_OPTIONS_POSITION',
            'quantity': str(quantity),
            'premium': str(premium)
        }
    
    def _create_new_options_position(self, user, data):
        """Create new options position"""
        quantity = data['quantity']
        premium = data['premium']
        position_cost = quantity * premium
        
        trade = Trade.objects.create(
            user=user,
            asset_symbol=data['asset_symbol'],
            asset_name=data.get('asset_name', ''),
            asset_exchange=data.get('asset_exchange', ''),
            trade_type='OPTIONS',
            direction=data['direction'],
            status='OPEN',
            holding_type=data.get('holding_type', 'INTRADAY'),
            total_quantity=quantity,
            remaining_quantity=quantity,
            average_price=premium,
            total_invested=position_cost
        )
        
        # Create options details
        OptionsDetails.objects.create(
            trade=trade,
            option_type=data['option_type'],
            position=data['option_position'],
            strike_price=data['strike_price'],
            expiry_date=data['expiry_date'],
            premium=premium
        )
        
        # Record trade history
        TradeHistory.objects.create(
            trade=trade,
            user=user,
            action=data['direction'],
            order_type=data.get('order_type', 'MARKET'),
            quantity=quantity,
            price=premium,
            amount=position_cost
        )
        
        self._update_portfolio(user)
        
        return {
            'trade_id': str(trade.id),
            'action': 'CREATE_OPTIONS_POSITION',
            'option_type': data['option_type'],
            'strike_price': str(data['strike_price']),
            'premium': str(premium),
            'quantity': str(quantity)
        }
    
    def _update_portfolio(self, user):
        """Update user portfolio metrics"""
        portfolio, created = Portfolio.objects.get_or_create(user=user)
        portfolio.update_portfolio_metrics()


class PartialCloseView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, trade_id):
        try:
            trade = Trade.objects.get(id=trade_id, user=request.user)
        except Trade.DoesNotExist:
            return Response({'error': 'Trade not found'}, status=404)
        
        serializer = PartialCloseSerializer(data=request.data, context={'trade': trade})
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    result = self._partial_close_trade(trade, serializer.validated_data)
                    return Response(result)
            except Exception as e:
                logger.error(f"Error partial closing trade: {str(e)}", exc_info=True)
                return Response({'error': str(e)}, status=400)
        return Response(serializer.errors, status=400)
    
    def _partial_close_trade(self, trade, data):
        """Handle partial closing of trades"""
        quantity = data['quantity']
        price = data.get('price', trade.average_price)
        
        if quantity > trade.remaining_quantity:
            raise ValueError("Cannot close more than remaining quantity")
        
        # Calculate P&L
        if trade.direction == 'BUY':
            realized_pnl = (price - trade.average_price) * quantity
        else:
            realized_pnl = (trade.average_price - price) * quantity
        
        # Update trade
        trade.remaining_quantity -= quantity
        trade.realized_pnl += realized_pnl
        
        if trade.remaining_quantity == 0:
            trade.status = 'CLOSED'
            trade.closed_at = timezone.now()
        else:
            trade.status = 'PARTIALLY_CLOSED'
        
        trade.save()
        
        # Record history
        TradeHistory.objects.create(
            trade=trade,
            user=trade.user,
            action='PARTIAL_SELL',
            order_type=data.get('order_type', 'MARKET'),
            quantity=quantity,
            price=price,
            amount=quantity * price,
            realized_pnl=realized_pnl
        )
        
        # Update portfolio
        portfolio = Portfolio.objects.get(user=trade.user)
        portfolio.update_portfolio_metrics()
        
        return {
            'trade_id': str(trade.id),
            'closed_quantity': str(quantity),
            'realized_pnl': str(realized_pnl),
            'remaining_quantity': str(trade.remaining_quantity),
            'status': trade.status
        }


class CloseTradeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, trade_id):
        try:
            trade = Trade.objects.get(id=trade_id, user=request.user)
        except Trade.DoesNotExist:
            return Response({'error': 'Trade not found'}, status=404)
        
        serializer = CloseTradeSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    result = self._close_trade(trade, serializer.validated_data)
                    return Response(result)
            except Exception as e:
                logger.error(f"Error closing trade: {str(e)}", exc_info=True)
                return Response({'error': str(e)}, status=400)
        return Response(serializer.errors, status=400)
    
    def _close_trade(self, trade, data):
        """Handle complete closing of trades"""
        price = data.get('price', trade.average_price)
        quantity = trade.remaining_quantity
        
        # Calculate P&L
        if trade.direction == 'BUY':
            realized_pnl = (price - trade.average_price) * quantity
        else:
            realized_pnl = (trade.average_price - price) * quantity
        
        # Update trade
        trade.remaining_quantity = Decimal('0')
        trade.realized_pnl += realized_pnl
        trade.status = 'CLOSED'
        trade.closed_at = timezone.now()
        trade.save()
        
        # Record history
        TradeHistory.objects.create(
            trade=trade,
            user=trade.user,
            action='SELL',
            order_type=data.get('order_type', 'MARKET'),
            quantity=quantity,
            price=price,
            amount=quantity * price,
            realized_pnl=realized_pnl
        )
        
        # Update portfolio
        portfolio = Portfolio.objects.get(user=trade.user)
        portfolio.update_portfolio_metrics()
        
        return {
            'trade_id': str(trade.id),
            'closed_quantity': str(quantity),
            'realized_pnl': str(realized_pnl),
            'status': trade.status
        }


class PortfolioViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PortfolioSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Portfolio.objects.filter(user=self.request.user)


class PortfolioSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        portfolio, created = Portfolio.objects.get_or_create(user=request.user)
        portfolio.update_portfolio_metrics()
        
        serializer = PortfolioSerializer(portfolio)
        return Response(serializer.data)


class ActivePositionsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        trades = Trade.objects.filter(
            user=request.user,
            status__in=['OPEN', 'PARTIALLY_CLOSED']
        ).order_by('-opened_at')
        
        serializer = ActivePositionSerializer(trades, many=True)
        return Response(serializer.data)


class PnLReportView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = PnLReportSerializer(data=request.query_params)
        if serializer.is_valid():
            period = serializer.validated_data.get('period', 'today')
            trade_type = serializer.validated_data.get('trade_type')
            asset_symbol = serializer.validated_data.get('asset_symbol')
            
            # Calculate date range
            now = timezone.now()
            if period == 'today':
                start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            elif period == 'week':
                start_date = now - timedelta(days=7)
            elif period == 'month':
                start_date = now - timedelta(days=30)
            elif period == 'year':
                start_date = now - timedelta(days=365)
            
            # Build query
            query = Q(user=request.user, updated_at__gte=start_date)
            if trade_type:
                query &= Q(trade_type=trade_type)
            if asset_symbol:
                query &= Q(asset_symbol=asset_symbol)
            
            trades = Trade.objects.filter(query)
            
            # Calculate metrics
            total_realized_pnl = trades.aggregate(
                Sum('realized_pnl'))['realized_pnl__sum'] or Decimal('0')
            total_unrealized_pnl = trades.filter(
                status__in=['OPEN', 'PARTIALLY_CLOSED']).aggregate(
                Sum('unrealized_pnl'))['unrealized_pnl__sum'] or Decimal('0')
            
            # Get trade history for the period
            history = TradeHistory.objects.filter(
                user=request.user,
                created_at__gte=start_date
            ).order_by('-created_at')
            
            if trade_type:
                history = history.filter(trade__trade_type=trade_type)
            if asset_symbol:
                history = history.filter(trade__asset_symbol=asset_symbol)
            
            return Response({
                'period': period,
                'start_date': start_date,
                'total_realized_pnl': str(total_realized_pnl),
                'total_unrealized_pnl': str(total_unrealized_pnl),
                'total_pnl': str(total_realized_pnl + total_unrealized_pnl),
                'trade_count': trades.count(),
                'recent_trades': TradeHistorySerializer(history[:10], many=True).data
            })
        
        return Response(serializer.errors, status=400)


class TradeHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        history = TradeHistory.objects.filter(
            user=request.user
        ).order_by('-created_at')
        
        # Filter by trade type if provided
        trade_type = request.query_params.get('trade_type')
        if trade_type:
            history = history.filter(trade__trade_type=trade_type)
        
        # Filter by asset if provided
        asset_symbol = request.query_params.get('asset_symbol')
        if asset_symbol:
            history = history.filter(trade__asset_symbol=asset_symbol)
        
        # Pagination
        page_size = int(request.query_params.get('page_size', 20))
        page = int(request.query_params.get('page', 1))
        start = (page - 1) * page_size
        end = start + page_size
        
        paginated_history = history[start:end]
        serializer = TradeHistorySerializer(paginated_history, many=True)
        
        return Response({
            'results': serializer.data,
            'count': history.count(),
            'page': page,
            'page_size': page_size
        })


class TradeDetailHistoryView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, trade_id):
        try:
            trade = Trade.objects.get(id=trade_id, user=request.user)
        except Trade.DoesNotExist:
            return Response({'error': 'Trade not found'}, status=404)
        
        history = TradeHistory.objects.filter(trade=trade).order_by('-created_at')
        serializer = TradeHistorySerializer(history, many=True)
        
        return Response({
            'trade_id': str(trade.id),
            'asset_symbol': trade.asset_symbol,
            'trade_type': trade.trade_type,
            'history': serializer.data
        })


class UpdatePricesView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = UpdatePricesSerializer(data=request.data)
        if serializer.is_valid():
            prices = serializer.validated_data['prices']
            
            updated_trades = []
            for symbol, price in prices.items():
                trades = Trade.objects.filter(
                    user=request.user,
                    asset_symbol=symbol,
                    status__in=['OPEN', 'PARTIALLY_CLOSED']
                )
                
                for trade in trades:
                    old_pnl = trade.unrealized_pnl
                    new_pnl = trade.calculate_unrealized_pnl(price)
                    updated_trades.append({
                        'trade_id': str(trade.id),
                        'symbol': symbol,
                        'old_pnl': str(old_pnl),
                        'new_pnl': str(new_pnl),
                        'price': str(price)
                    })
            
            # Update portfolio
            portfolio, created = Portfolio.objects.get_or_create(user=request.user)
            portfolio.update_portfolio_metrics()
            
            return Response({
                'updated_trades': updated_trades,
                'portfolio_value': str(portfolio.total_value)
            })
        
        return Response(serializer.errors, status=400)


class RiskCheckView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = RiskCheckSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            # Get user portfolio
            portfolio, created = Portfolio.objects.get_or_create(user=request.user)
            
            # Calculate position value
            position_value = data['quantity'] * data['price']
            leverage = data.get('leverage', Decimal('1'))
            margin_required = position_value / leverage
            
            # Risk checks
            risks = []
            warnings = []
            
            # Check position concentration
            existing_exposure = Trade.objects.filter(
                user=request.user,
                asset_symbol=data['asset_symbol'],
                status__in=['OPEN', 'PARTIALLY_CLOSED']
            ).aggregate(Sum('total_invested'))['total_invested__sum'] or Decimal('0')
            
            new_total_exposure = existing_exposure + margin_required
            concentration_pct = Decimal('0')
            
            if portfolio.total_value > 0:
                concentration_pct = (new_total_exposure / portfolio.total_value) * 100
                if concentration_pct > 25:  # 25% concentration limit
                    warnings.append(f"High concentration: {concentration_pct:.1f}% in {data['asset_symbol']}")
            
            # Check leverage limits
            if leverage > 10:  # Max 10x leverage
                risks.append(f"Leverage {leverage}x exceeds maximum allowed (10x)")
            
            # Check daily trade limit
            today_trades = TradeHistory.objects.filter(
                user=request.user,
                created_at__gte=timezone.now().replace(hour=0, minute=0, second=0)
            ).count()
            
            if today_trades >= 50:  # Daily trade limit
                warnings.append("Approaching daily trade limit")
            
            return Response({
                'allowed': len(risks) == 0,
                'risks': risks,
                'warnings': warnings,
                'position_value': str(position_value),
                'margin_required': str(margin_required),
                'concentration_percentage': str(concentration_pct)
            })
        
        return Response(serializer.errors, status=400)


# # views.py
# from rest_framework import viewsets, status
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from rest_framework.views import APIView
# from rest_framework.permissions import IsAuthenticated
# from django.db import transaction
# from django.db.models import Q, Sum
# from django.utils import timezone
# from decimal import Decimal
# from datetime import datetime, timedelta
# import uuid

# from .models import Trade, FuturesDetails, OptionsDetails, TradeHistory, Portfolio
# from .serializers import (
#     TradeSerializer, PlaceOrderSerializer, PartialCloseSerializer, 
#     CloseTradeSerializer, PortfolioSerializer, ActivePositionSerializer,
#     PnLReportSerializer, RiskCheckSerializer, UpdatePricesSerializer,
#     TradeHistorySerializer
# )


# class TradeViewSet(viewsets.ModelViewSet):
#     serializer_class = TradeSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_queryset(self):
#         return Trade.objects.filter(user=self.request.user).order_by('-opened_at')

#     @action(detail=True, methods=['post'])
#     def update_pnl(self, request, pk=None):
#         trade = self.get_object()
#         current_price = request.data.get('current_price')
#         if current_price:
#             pnl = trade.calculate_unrealized_pnl(Decimal(current_price))
#             return Response({'unrealized_pnl': pnl})
#         return Response({'error': 'Current price is required'}, status=400)


# class PlaceOrderView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def post(self, request):
#         serializer = PlaceOrderSerializer(data=request.data)
#         if serializer.is_valid():
#             try:
#                 with transaction.atomic():
#                     result = self._process_order(request.user, serializer.validated_data)
#                     return Response(result, status=status.HTTP_201_CREATED)
#             except Exception as e:
#                 return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
#         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
#     def _process_order(self, user, data):
#         """Main order processing logic"""
#         trade_type = data['trade_type']
        
#         if trade_type == 'SPOT':
#             return self._process_spot_order(user, data)
#         elif trade_type == 'FUTURES':
#             return self._process_futures_order(user, data)
#         elif trade_type == 'OPTIONS':
#             return self._process_options_order(user, data)
#         else:
#             raise ValueError(f"Unsupported trade type: {trade_type}")
    
#     def _process_spot_order(self, user, data):
#         """Handle spot trading logic"""
#         asset_symbol = data['asset_symbol']
#         direction = data['direction']
#         quantity = data['quantity']
#         price = data['price']
#         holding_type = data['holding_type']
        
#         # Find existing trade for this asset and holding type
#         existing_trade = Trade.objects.filter(
#             user=user,
#             asset_symbol=asset_symbol,
#             trade_type='SPOT',
#             holding_type=holding_type,
#             status__in=['OPEN', 'PARTIALLY_CLOSED']
#         ).first()
        
#         if direction == 'BUY':
#             return self._handle_spot_buy(user, data, existing_trade)
#         else:
#             return self._handle_spot_sell(user, data, existing_trade)
    
#     def _handle_spot_buy(self, user, data, existing_trade):
#         """Handle spot buy orders"""
#         quantity = data['quantity']
#         price = data['price']
#         amount = quantity * price
        
#         if existing_trade:
#             # Add to existing position (average price)
#             old_value = existing_trade.remaining_quantity * existing_trade.average_price
#             new_value = quantity * price
#             total_quantity = existing_trade.remaining_quantity + quantity
            
#             existing_trade.average_price = (old_value + new_value) / total_quantity
#             existing_trade.remaining_quantity = total_quantity
#             existing_trade.total_quantity += quantity
#             existing_trade.total_invested += amount
#             existing_trade.save()
            
#             trade = existing_trade
#         else:
#             # Create new trade
#             trade = Trade.objects.create(
#                 user=user,
#                 asset_symbol=data['asset_symbol'],
#                 asset_name=data.get('asset_name', ''),
#                 asset_exchange=data.get('asset_exchange', ''),
#                 trade_type='SPOT',
#                 direction='BUY',
#                 status='OPEN',
#                 holding_type=data['holding_type'],
#                 total_quantity=quantity,
#                 remaining_quantity=quantity,
#                 average_price=price,
#                 total_invested=amount
#             )
        
#         # Record trade history
#         TradeHistory.objects.create(
#             trade=trade,
#             user=user,
#             action='BUY',
#             order_type=data.get('order_type', 'MARKET'),
#             quantity=quantity,
#             price=price,
#             amount=amount
#         )
        
#         # Update portfolio
#         self._update_portfolio(user)
        
#         return {
#             'trade_id': trade.id,
#             'action': 'BUY' if not existing_trade else 'ADD_TO_POSITION',
#             'quantity': quantity,
#             'price': price,
#             'total_quantity': trade.total_quantity,
#             'average_price': trade.average_price
#         }
    
#     def _handle_spot_sell(self, user, data, existing_trade):
#         """Handle spot sell orders"""
#         if not existing_trade:
#             # For intraday, allow short selling
#             if data['holding_type'] == 'INTRADAY':
#                 return self._create_short_position(user, data)
#             else:
#                 raise ValueError("No existing position to sell for long-term trades")
        
#         quantity = data['quantity']
#         price = data['price']
        
#         if quantity > existing_trade.remaining_quantity:
#             raise ValueError("Cannot sell more than available quantity")
        
#         # Calculate P&L for this sell
#         cost_basis = existing_trade.average_price * quantity
#         sell_value = price * quantity
#         realized_pnl = sell_value - cost_basis
        
#         # Update trade
#         existing_trade.remaining_quantity -= quantity
#         existing_trade.realized_pnl += realized_pnl
        
#         if existing_trade.remaining_quantity == 0:
#             existing_trade.status = 'CLOSED'
#             existing_trade.closed_at = timezone.now()
#         elif existing_trade.remaining_quantity < existing_trade.total_quantity:
#             existing_trade.status = 'PARTIALLY_CLOSED'
        
#         existing_trade.save()
        
#         # Record trade history
#         TradeHistory.objects.create(
#             trade=existing_trade,
#             user=user,
#             action='SELL' if existing_trade.remaining_quantity == 0 else 'PARTIAL_SELL',
#             order_type=data.get('order_type', 'MARKET'),
#             quantity=quantity,
#             price=price,
#             amount=sell_value,
#             realized_pnl=realized_pnl
#         )
        
#         # Update portfolio
#         self._update_portfolio(user)
        
#         return {
#             'trade_id': existing_trade.id,
#             'action': 'SELL',
#             'quantity': quantity,
#             'price': price,
#             'realized_pnl': realized_pnl,
#             'remaining_quantity': existing_trade.remaining_quantity,
#             'status': existing_trade.status
#         }
    
#     def _process_futures_order(self, user, data):
#         """Handle futures trading logic"""
#         asset_symbol = data['asset_symbol']
#         direction = data['direction']
#         quantity = data['quantity']
#         price = data['price']
        
#         # Find existing futures position
#         existing_trade = Trade.objects.filter(
#             user=user,
#             asset_symbol=asset_symbol,
#             trade_type='FUTURES',
#             status__in=['OPEN', 'PARTIALLY_CLOSED']
#         ).first()
        
#         if existing_trade:
#             return self._handle_existing_futures_position(user, data, existing_trade)
#         else:
#             return self._create_new_futures_position(user, data)
    
#     def _handle_existing_futures_position(self, user, data, existing_trade):
#         """Handle futures position modification"""
#         direction = data['direction']
#         quantity = data['quantity']
#         price = data['price']
        
#         if existing_trade.direction == direction:
#             # Same direction - increase position
#             old_value = existing_trade.remaining_quantity * existing_trade.average_price
#             new_value = quantity * price
#             total_quantity = existing_trade.remaining_quantity + quantity
            
#             existing_trade.average_price = (old_value + new_value) / total_quantity
#             existing_trade.remaining_quantity = total_quantity
#             existing_trade.total_quantity += quantity
#             existing_trade.save()
            
#             action = 'INCREASE_POSITION'
#         else:
#             # Opposite direction - reduce position
#             if quantity > existing_trade.remaining_quantity:
#                 # Flip position
#                 remaining_qty = quantity - existing_trade.remaining_quantity
#                 existing_trade.remaining_quantity = remaining_qty
#                 existing_trade.direction = direction
#                 existing_trade.average_price = price
#                 action = 'FLIP_POSITION'
#             elif quantity == existing_trade.remaining_quantity:
#                 # Close position
#                 existing_trade.remaining_quantity = 0
#                 existing_trade.status = 'CLOSED'
#                 existing_trade.closed_at = timezone.now()
#                 action = 'CLOSE_POSITION'
#             else:
#                 # Reduce position
#                 existing_trade.remaining_quantity -= quantity
#                 action = 'REDUCE_POSITION'
            
#             existing_trade.save()
        
#         # Record trade history
#         TradeHistory.objects.create(
#             trade=existing_trade,
#             user=user,
#             action=direction,
#             order_type=data.get('order_type', 'MARKET'),
#             quantity=quantity,
#             price=price,
#             amount=quantity * price
#         )
        
#         self._update_portfolio(user)
        
#         return {
#             'trade_id': existing_trade.id,
#             'action': action,
#             'direction': direction,
#             'quantity': quantity,
#             'price': price,
#             'remaining_quantity': existing_trade.remaining_quantity
#         }
    
#     def _create_new_futures_position(self, user, data):
#         """Create new futures position"""
#         quantity = data['quantity']
#         price = data['price']
#         leverage = data.get('leverage', Decimal('1'))
        
#         # Calculate margin
#         position_value = quantity * price
#         margin_required = position_value / leverage
        
#         # Create trade
#         trade = Trade.objects.create(
#             user=user,
#             asset_symbol=data['asset_symbol'],
#             asset_name=data.get('asset_name', ''),
#             asset_exchange=data.get('asset_exchange', ''),
#             trade_type='FUTURES',
#             direction=data['direction'],
#             status='OPEN',
#             holding_type=data.get('holding_type', 'INTRADAY'),
#             total_quantity=quantity,
#             remaining_quantity=quantity,
#             average_price=price,
#             total_invested=margin_required
#         )
        
#         # Create futures details
#         FuturesDetails.objects.create(
#             trade=trade,
#             leverage=leverage,
#             margin_required=margin_required,
#             margin_used=margin_required,
#             expiry_date=data['expiry_date'],
#             contract_size=data.get('contract_size', Decimal('1')),
#             is_hedged=data.get('is_hedged', False)
#         )
        
#         # Record trade history
#         TradeHistory.objects.create(
#             trade=trade,
#             user=user,
#             action=data['direction'],
#             order_type=data.get('order_type', 'MARKET'),
#             quantity=quantity,
#             price=price,
#             amount=position_value
#         )
        
#         self._update_portfolio(user)
        
#         return {
#             'trade_id': trade.id,
#             'action': 'CREATE_FUTURES_POSITION',
#             'direction': data['direction'],
#             'quantity': quantity,
#             'price': price,
#             'leverage': leverage,
#             'margin_required': margin_required
#         }
    
#     def _process_options_order(self, user, data):
#         """Handle options trading logic"""
#         # Options logic similar to futures but with strike price, premium, expiry
#         asset_symbol = data['asset_symbol']
#         option_type = data['option_type']
#         strike_price = data['strike_price']
#         expiry_date = data['expiry_date']
        
#         # Find existing option position
#         existing_trade = Trade.objects.filter(
#             user=user,
#             asset_symbol=asset_symbol,
#             trade_type='OPTIONS',
#             status__in=['OPEN', 'PARTIALLY_CLOSED'],
#             options_details__option_type=option_type,
#             options_details__strike_price=strike_price,
#             options_details__expiry_date=expiry_date
#         ).first()
        
#         if existing_trade:
#             return self._handle_existing_options_position(user, data, existing_trade)
#         else:
#             return self._create_new_options_position(user, data)
    
#     def _create_new_options_position(self, user, data):
#         """Create new options position"""
#         quantity = data['quantity']
#         premium = data['premium']
#         position_cost = quantity * premium
        
#         trade = Trade.objects.create(
#             user=user,
#             asset_symbol=data['asset_symbol'],
#             asset_name=data.get('asset_name', ''),
#             asset_exchange=data.get('asset_exchange', ''),
#             trade_type='OPTIONS',
#             direction=data['direction'],
#             status='OPEN',
#             holding_type=data.get('holding_type', 'INTRADAY'),
#             total_quantity=quantity,
#             remaining_quantity=quantity,
#             average_price=premium,
#             total_invested=position_cost
#         )
        
#         # Create options details
#         OptionsDetails.objects.create(
#             trade=trade,
#             option_type=data['option_type'],
#             position=data['option_position'],
#             strike_price=data['strike_price'],
#             expiry_date=data['expiry_date'],
#             premium=premium
#         )
        
#         # Record trade history
#         TradeHistory.objects.create(
#             trade=trade,
#             user=user,
#             action=data['direction'],
#             order_type=data.get('order_type', 'MARKET'),
#             quantity=quantity,
#             price=premium,
#             amount=position_cost
#         )
        
#         self._update_portfolio(user)
        
#         return {
#             'trade_id': trade.id,
#             'action': 'CREATE_OPTIONS_POSITION',
#             'option_type': data['option_type'],
#             'strike_price': data['strike_price'],
#             'premium': premium,
#             'quantity': quantity
#         }
    
#     def _update_portfolio(self, user):
#         """Update user portfolio metrics"""
#         portfolio, created = Portfolio.objects.get_or_create(user=user)
#         portfolio.update_portfolio_metrics()


# class PartialCloseView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def post(self, request, trade_id):
#         try:
#             trade = Trade.objects.get(id=trade_id, user=request.user)
#         except Trade.DoesNotExist:
#             return Response({'error': 'Trade not found'}, status=404)
        
#         serializer = PartialCloseSerializer(data=request.data, context={'trade': trade})
#         if serializer.is_valid():
#             try:
#                 with transaction.atomic():
#                     result = self._partial_close_trade(trade, serializer.validated_data)
#                     return Response(result)
#             except Exception as e:
#                 return Response({'error': str(e)}, status=400)
#         return Response(serializer.errors, status=400)
    
#     def _partial_close_trade(self, trade, data):
#         """Handle partial closing of trades"""
#         quantity = data['quantity']
#         price = data.get('price', trade.average_price)
        
#         if quantity > trade.remaining_quantity:
#             raise ValueError("Cannot close more than remaining quantity")
        
#         # Calculate P&L
#         if trade.direction == 'BUY':
#             realized_pnl = (price - trade.average_price) * quantity
#         else:
#             realized_pnl = (trade.average_price - price) * quantity
        
#         # Update trade
#         trade.remaining_quantity -= quantity
#         trade.realized_pnl += realized_pnl
        
#         if trade.remaining_quantity == 0:
#             trade.status = 'CLOSED'
#             trade.closed_at = timezone.now()
#         else:
#             trade.status = 'PARTIALLY_CLOSED'
        
#         trade.save()
        
#         # Record history
#         TradeHistory.objects.create(
#             trade=trade,
#             user=trade.user,
#             action='PARTIAL_SELL',
#             order_type=data.get('order_type', 'MARKET'),
#             quantity=quantity,
#             price=price,
#             amount=quantity * price,
#             realized_pnl=realized_pnl
#         )
        
#         # Update portfolio
#         portfolio = Portfolio.objects.get(user=trade.user)
#         portfolio.update_portfolio_metrics()
        
#         return {
#             'trade_id': trade.id,
#             'closed_quantity': quantity,
#             'realized_pnl': realized_pnl,
#             'remaining_quantity': trade.remaining_quantity,
#             'status': trade.status
#         }


# class CloseTradeView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def post(self, request, trade_id):
#         try:
#             trade = Trade.objects.get(id=trade_id, user=request.user)
#         except Trade.DoesNotExist:
#             return Response({'error': 'Trade not found'}, status=404)
        
#         serializer = CloseTradeSerializer(data=request.data)
#         if serializer.is_valid():
#             try:
#                 with transaction.atomic():
#                     result = self._close_trade(trade, serializer.validated_data)
#                     return Response(result)
#             except Exception as e:
#                 return Response({'error': str(e)}, status=400)
#         return Response(serializer.errors, status=400)
    
#     def _close_trade(self, trade, data):
#         """Handle complete closing of trades"""
#         price = data.get('price', trade.average_price)
#         quantity = trade.remaining_quantity
        
#         # Calculate P&L
#         if trade.direction == 'BUY':
#             realized_pnl = (price - trade.average_price) * quantity
#         else:
#             realized_pnl = (trade.average_price - price) * quantity
        
#         # Update trade
#         trade.remaining_quantity = 0
#         trade.realized_pnl += realized_pnl
#         trade.status = 'CLOSED'
#         trade.closed_at = timezone.now()
#         trade.save()
        
#         # Record history
#         TradeHistory.objects.create(
#             trade=trade,
#             user=trade.user,
#             action='SELL',
#             order_type=data.get('order_type', 'MARKET'),
#             quantity=quantity,
#             price=price,
#             amount=quantity * price,
#             realized_pnl=realized_pnl
#         )
        
#         # Update portfolio
#         portfolio = Portfolio.objects.get(user=trade.user)
#         portfolio.update_portfolio_metrics()
        
#         return {
#             'trade_id': trade.id,
#             'closed_quantity': quantity,
#             'realized_pnl': realized_pnl,
#             'status': trade.status
#         }


# class PortfolioViewSet(viewsets.ReadOnlyModelViewSet):
#     serializer_class = PortfolioSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_queryset(self):
#         return Portfolio.objects.filter(user=self.request.user)


# class PortfolioSummaryView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def get(self, request):
#         portfolio, created = Portfolio.objects.get_or_create(user=request.user)
#         portfolio.update_portfolio_metrics()
        
#         serializer = PortfolioSerializer(portfolio)
#         return Response(serializer.data)


# class ActivePositionsView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def get(self, request):
#         trades = Trade.objects.filter(
#             user=request.user,
#             status__in=['OPEN', 'PARTIALLY_CLOSED']
#         ).order_by('-opened_at')
        
#         serializer = ActivePositionSerializer(trades, many=True)
#         return Response(serializer.data)


# class PnLReportView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def get(self, request):
#         serializer = PnLReportSerializer(data=request.query_params)
#         if serializer.is_valid():
#             period = serializer.validated_data.get('period', 'today')
#             trade_type = serializer.validated_data.get('trade_type')
#             asset_symbol = serializer.validated_data.get('asset_symbol')
            
#             # Calculate date range
#             now = timezone.now()
#             if period == 'today':
#                 start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
#             elif period == 'week':
#                 start_date = now - timedelta(days=7)
#             elif period == 'month':
#                 start_date = now - timedelta(days=30)
#             elif period == 'year':
#                 start_date = now - timedelta(days=365)
            
#             # Build query
#             query = Q(user=request.user, updated_at__gte=start_date)
#             if trade_type:
#                 query &= Q(trade_type=trade_type)
#             if asset_symbol:
#                 query &= Q(asset_symbol=asset_symbol)
            
#             trades = Trade.objects.filter(query)
            
#             # Calculate metrics
#             total_realized_pnl = trades.aggregate(
#                 Sum('realized_pnl'))['realized_pnl__sum'] or Decimal('0')
#             total_unrealized_pnl = trades.filter(
#                 status__in=['OPEN', 'PARTIALLY_CLOSED']).aggregate(
#                 Sum('unrealized_pnl'))['unrealized_pnl__sum'] or Decimal('0')
            
#             # Get trade history for the period
#             history = TradeHistory.objects.filter(
#                 user=request.user,
#                 created_at__gte=start_date
#             ).order_by('-created_at')
            
#             if trade_type:
#                 history = history.filter(trade__trade_type=trade_type)
#             if asset_symbol:
#                 history = history.filter(trade__asset_symbol=asset_symbol)
            
#             return Response({
#                 'period': period,
#                 'start_date': start_date,
#                 'total_realized_pnl': total_realized_pnl,
#                 'total_unrealized_pnl': total_unrealized_pnl,
#                 'total_pnl': total_realized_pnl + total_unrealized_pnl,
#                 'trade_count': trades.count(),
#                 'recent_trades': TradeHistorySerializer(history[:10], many=True).data
#             })
        
#         return Response(serializer.errors, status=400)


# class TradeHistoryView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def get(self, request):
#         history = TradeHistory.objects.filter(
#             user=request.user
#         ).order_by('-created_at')
        
#         # Filter by trade type if provided
#         trade_type = request.query_params.get('trade_type')
#         if trade_type:
#             history = history.filter(trade__trade_type=trade_type)
        
#         # Filter by asset if provided
#         asset_symbol = request.query_params.get('asset_symbol')
#         if asset_symbol:
#             history = history.filter(trade__asset_symbol=asset_symbol)
        
#         # Pagination
#         page_size = int(request.query_params.get('page_size', 20))
#         page = int(request.query_params.get('page', 1))
#         start = (page - 1) * page_size
#         end = start + page_size
        
#         paginated_history = history[start:end]
#         serializer = TradeHistorySerializer(paginated_history, many=True)
        
#         return Response({
#             'results': serializer.data,
#             'count': history.count(),
#             'page': page,
#             'page_size': page_size
#         })


# class TradeDetailHistoryView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def get(self, request, trade_id):
#         try:
#             trade = Trade.objects.get(id=trade_id, user=request.user)
#         except Trade.DoesNotExist:
#             return Response({'error': 'Trade not found'}, status=404)
        
#         history = TradeHistory.objects.filter(trade=trade).order_by('-created_at')
#         serializer = TradeHistorySerializer(history, many=True)
        
#         return Response({
#             'trade_id': trade.id,
#             'asset_symbol': trade.asset_symbol,
#             'trade_type': trade.trade_type,
#             'history': serializer.data
#         })


# class UpdatePricesView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def post(self, request):
#         serializer = UpdatePricesSerializer(data=request.data)
#         if serializer.is_valid():
#             prices = serializer.validated_data['prices']
            
#             updated_trades = []
#             for symbol, price in prices.items():
#                 trades = Trade.objects.filter(
#                     user=request.user,
#                     asset_symbol=symbol,
#                     status__in=['OPEN', 'PARTIALLY_CLOSED']
#                 )
                
#                 for trade in trades:
#                     old_pnl = trade.unrealized_pnl
#                     new_pnl = trade.calculate_unrealized_pnl(price)
#                     updated_trades.append({
#                         'trade_id': trade.id,
#                         'symbol': symbol,
#                         'old_pnl': old_pnl,
#                         'new_pnl': new_pnl,
#                         'price': price
#                     })
            
#             # Update portfolio
#             portfolio = Portfolio.objects.get(user=request.user)
#             portfolio.update_portfolio_metrics()
            
#             return Response({
#                 'updated_trades': updated_trades,
#                 'portfolio_value': portfolio.total_value
#             })
        
#         return Response(serializer.errors, status=400)


# class RiskCheckView(APIView):
#     permission_classes = [IsAuthenticated]
    
#     def post(self, request):
#         serializer = RiskCheckSerializer(data=request.data)
#         if serializer.is_valid():
#             data = serializer.validated_data
            
#             # Get user portfolio
#             portfolio, created = Portfolio.objects.get_or_create(user=request.user)
            
#             # Calculate position value
#             position_value = data['quantity'] * data['price']
#             leverage = data.get('leverage', Decimal('1'))
#             margin_required = position_value / leverage
            
#             # Risk checks
#             risks = []
#             warnings = []
            
#             # Check available balance (simplified - you'd integrate with your wallet/balance system)
#             # available_balance = get_user_balance(request.user)  # Implement this
#             # if margin_required > available_balance:
#             #     risks.append("Insufficient balance for this trade")
            
#             # Check position concentration
#             existing_exposure = Trade.objects.filter(
#                 user=request.user,
#                 asset_symbol=data['asset_symbol'],
#                 status__in=['OPEN', 'PARTIALLY_CLOSED']
#             ).aggregate(Sum('total_invested'))['total_invested__sum'] or Decimal('0')
            
#             new_total_exposure = existing_exposure + margin_required
#             if portfolio.total_value > 0:
#                 concentration_pct = (new_total_exposure / portfolio.total_value) * 100
#                 if concentration_pct > 25:  # 25% concentration limit
#                     warnings.append(f"High concentration: {concentration_pct:.1f}% in {data['asset_symbol']}")
            
#             # Check leverage limits
#             if leverage > 10:  # Max 10x leverage
#                 risks.append(f"Leverage {leverage}x exceeds maximum allowed (10x)")
            
#             # Check daily trade limit
#             today_trades = TradeHistory.objects.filter(
#                 user=request.user,
#                 created_at__gte=timezone.now().replace(hour=0, minute=0, second=0)
#             ).count()
            
#             if today_trades >= 50:  # Daily trade limit
#                 warnings.append("Approaching daily trade limit")
            
#             return Response({
#                 'allowed': len(risks) == 0,
#                 'risks': risks,
#                 'warnings': warnings,
#                 'position_value': position_value,
#                 'margin_required': margin_required,
#                 'concentration_percentage': concentration_pct if 'concentration_pct' in locals() else 0
#             })
        
#         return Response(serializer.errors, status=400)


# # Helper functions for short positions and other edge cases
# def _create_short_position(user, data):
#     """Create short position for intraday spot trading"""
#     quantity = data['quantity']
#     price = data['price']
#     amount = quantity * price
    
#     trade = Trade.objects.create(
#         user=user,
#         asset_symbol=data['asset_symbol'],
#         asset_name=data.get('asset_name', ''),
#         asset_exchange=data.get('asset_exchange', ''),
#         trade_type='SPOT',
#         direction='SELL',
#         status='OPEN',
#         holding_type='INTRADAY',  # Only intraday allows short
#         total_quantity=quantity,
#         remaining_quantity=quantity,
#         average_price=price,
#         total_invested=amount
#     )
    
#     # Record trade history
#     TradeHistory.objects.create(
#         trade=trade,
#         user=user,
#         action='SELL',
#         order_type=data.get('order_type', 'MARKET'),
#         quantity=quantity,
#         price=price,
#         amount=amount
#     )
    
#     return {
#         'trade_id': trade.id,
#         'action': 'CREATE_SHORT_POSITION',
#         'quantity': quantity,
#         'price': price
#     }