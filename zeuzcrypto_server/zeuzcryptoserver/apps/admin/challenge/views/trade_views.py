# ==================== FILE: apps/challenges/views/trading_views_complete.py ====================

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Sum, F, Avg
from datetime import datetime, timedelta

from apps.admin.challenge.models.challenge_models import UserChallengeParticipation
from apps.admin.challenge.models.trade_models import (
    ChallengeTrade, ChallengeTradeHistory,
    ChallengeFuturesDetails, ChallengeOptionsDetails
)
from apps.admin.challenge.serializers.trade_serializers import (
    ChallengeTradeSerializer, ChallengeTradeCreateSerializer,
    ChallengeTradeDetailSerializer, ChallengeTradeHistorySerializer
)


class CompleteTradingViewSet(viewsets.ModelViewSet):
    """
    Complete Trading System ViewSet
    Handles: SPOT, FUTURES, OPTIONS with all buy/sell scenarios
    """
    serializer_class = ChallengeTradeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChallengeTrade.objects.filter(
            user=self.request.user
        ).select_related(
            'participation', 'wallet', 'futures_details', 'options_details'
        ).prefetch_related('history')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ChallengeTradeCreateSerializer
        elif self.action == 'retrieve':
            return ChallengeTradeDetailSerializer
        return ChallengeTradeSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Main entry point for all trade types
        Routes to appropriate handler based on trade_type
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            participation = UserChallengeParticipation.objects.select_for_update().get(
                id=serializer.validated_data['participation_id'],
                user=request.user
            )
            
            trade_type = serializer.validated_data['trade_type']
            
            # Route to specific handler
            if trade_type == 'SPOT':
                result = self._handle_spot_trade(request.user, participation, serializer.validated_data)
            elif trade_type == 'FUTURES':
                result = self._handle_futures_trade(request.user, participation, serializer.validated_data)
            elif trade_type == 'OPTIONS':
                result = self._handle_options_trade(request.user, participation, serializer.validated_data)
            else:
                return Response(
                    {'error': 'Invalid trade type'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update participation metrics
            self._update_participation_metrics(participation)
            
            response_serializer = ChallengeTradeDetailSerializer(result)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        except UserChallengeParticipation.DoesNotExist:
            return Response(
                {'error': 'Participation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Trade execution failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _handle_spot_trade(self, user, participation, trade_data):
        """
        Complete SPOT trading logic
        Handles: BUY, SELL, Averaging, Covering, Intraday/Delivery
        """
        wallet = participation.wallet
        asset_symbol = trade_data['asset_symbol']
        direction = trade_data['direction']
        quantity = trade_data['total_quantity']
        price = trade_data['entry_price']
        holding_type = trade_data.get('holding_type', 'INTRADAY')
        
        total_invested = quantity * price
        
        # Validate constraints
        self._validate_trade_constraints(participation, total_invested)
        
        # Find existing positions
        existing_positions = ChallengeTrade.objects.filter(
            user=user,
            participation=participation,
            asset_symbol=asset_symbol,
            trade_type='SPOT',
            status__in=['OPEN', 'PARTIALLY_CLOSED']
        )
        
        opposite_direction = 'SELL' if direction == 'BUY' else 'BUY'
        opposite_positions = existing_positions.filter(direction=opposite_direction)
        
        # SCENARIO 1: Covering opposite positions
        if opposite_positions.exists():
            return self._spot_covering(user, participation, wallet, trade_data, opposite_positions)
        
        # SCENARIO 2: Averaging same direction
        same_direction_positions = existing_positions.filter(direction=direction)
        if same_direction_positions.exists():
            return self._spot_averaging(user, participation, wallet, trade_data, same_direction_positions)
        
        # SCENARIO 3: New position
        return self._spot_new_position(user, participation, wallet, trade_data)
    
    def _spot_new_position(self, user, participation, wallet, trade_data):
        """Create new SPOT position"""
        quantity = trade_data['total_quantity']
        price = trade_data['entry_price']
        total_invested = quantity * price
        
        trade = ChallengeTrade.objects.create(
            user=user,
            participation=participation,
            wallet=wallet,
            asset_symbol=trade_data['asset_symbol'],
            asset_name=trade_data.get('asset_name', ''),
            trade_type='SPOT',
            direction=trade_data['direction'],
            total_quantity=quantity,
            remaining_quantity=quantity,
            average_entry_price=price,
            total_invested=total_invested,
            holding_type=trade_data.get('holding_type', 'INTRADAY'),
            status='OPEN'
        )
        
        wallet.lock_coins(total_invested)
        
        ChallengeTradeHistory.objects.create(
            trade=trade,
            user=user,
            action=trade_data['direction'],
            order_type=trade_data.get('order_type', 'MARKET'),
            quantity=quantity,
            price=price,
            amount=total_invested
        )
        
        return trade
    
    def _spot_averaging(self, user, participation, wallet, trade_data, positions):
        """Handle averaging for SPOT positions"""
        quantity = trade_data['total_quantity']
        price = trade_data['entry_price']
        direction = trade_data['direction']
        
        main_position = positions.first()
        
        # Calculate new average price
        total_qty = main_position.remaining_quantity + quantity
        total_value = (main_position.average_entry_price * main_position.remaining_quantity) + (price * quantity)
        new_avg_price = total_value / total_qty
        
        additional_investment = quantity * price
        self._validate_trade_constraints(participation, additional_investment)
        
        # Update position
        main_position.remaining_quantity = total_qty
        main_position.total_quantity = total_qty
        main_position.average_entry_price = new_avg_price
        main_position.total_invested += additional_investment
        main_position.save()
        
        wallet.lock_coins(additional_investment)
        
        ChallengeTradeHistory.objects.create(
            trade=main_position,
            user=user,
            action=direction,
            order_type=trade_data.get('order_type', 'MARKET'),
            quantity=quantity,
            price=price,
            amount=additional_investment
        )
        
        return main_position
    
    def _spot_covering(self, user, participation, wallet, trade_data, opposite_positions):
        """Handle covering opposite SPOT positions (including overselling)"""
        quantity = trade_data['total_quantity']
        price = trade_data['entry_price']
        direction = trade_data['direction']
        
        remaining_qty = quantity
        total_pnl = Decimal('0')
        
        # Close existing opposite positions
        for position in opposite_positions.order_by('opened_at'):
            if remaining_qty <= 0:
                break
            
            qty_to_close = min(remaining_qty, position.remaining_quantity)
            
            # Calculate P&L
            if position.direction == 'BUY':
                pnl = (price - position.average_entry_price) * qty_to_close
            else:
                pnl = (position.average_entry_price - price) * qty_to_close
            
            # Update position
            position.remaining_quantity -= qty_to_close
            position.realized_pnl += pnl
            
            if position.remaining_quantity == 0:
                position.status = 'CLOSED'
                position.closed_at = timezone.now()
            else:
                position.status = 'PARTIALLY_CLOSED'
            position.save()
            
            # Unlock and settle P&L
            unlock_amount = qty_to_close * position.average_entry_price
            wallet.unlock_coins(unlock_amount)
            
            if pnl > 0:
                wallet.add_profit(pnl)
            else:
                wallet.deduct_loss(abs(pnl))
            
            ChallengeTradeHistory.objects.create(
                trade=position,
                user=user,
                action=direction,
                order_type=trade_data.get('order_type', 'MARKET'),
                quantity=qty_to_close,
                price=price,
                amount=qty_to_close * price,
                realized_pnl=pnl
            )
            
            total_pnl += pnl
            remaining_qty -= qty_to_close
        
        # If quantity remains (overselling), create new position
        if remaining_qty > 0:
            new_investment = remaining_qty * price
            self._validate_trade_constraints(participation, new_investment)
            
            new_trade = ChallengeTrade.objects.create(
                user=user,
                participation=participation,
                wallet=wallet,
                asset_symbol=trade_data['asset_symbol'],
                asset_name=trade_data.get('asset_name', ''),
                trade_type='SPOT',
                direction=direction,
                total_quantity=remaining_qty,
                remaining_quantity=remaining_qty,
                average_entry_price=price,
                total_invested=new_investment,
                holding_type=trade_data.get('holding_type', 'INTRADAY'),
                status='OPEN'
            )
            
            wallet.lock_coins(new_investment)
            
            ChallengeTradeHistory.objects.create(
                trade=new_trade,
                user=user,
                action=direction,
                order_type=trade_data.get('order_type', 'MARKET'),
                quantity=remaining_qty,
                price=price,
                amount=new_investment
            )
            
            return new_trade
        
        return opposite_positions.first()
    
    def _handle_futures_trade(self, user, participation, trade_data):
        """
        Complete FUTURES trading logic
        Handles: Leverage, Margin, Expiry, Lots, Covering, Averaging
        """
        wallet = participation.wallet
        asset_symbol = trade_data['asset_symbol']
        direction = trade_data['direction']
        quantity = trade_data['total_quantity']
        price = trade_data['entry_price']
        leverage = trade_data.get('leverage', Decimal('1'))
        expiry_date = trade_data.get('expiry_date')
        contract_size = trade_data.get('contract_size', Decimal('1'))
        
        # Calculate margin
        total_value = quantity * price * contract_size
        margin_required = total_value / leverage
        
        self._validate_trade_constraints(participation, margin_required)
        
        # Find existing positions for same contract
        existing_positions = ChallengeTrade.objects.filter(
            user=user,
            participation=participation,
            asset_symbol=asset_symbol,
            trade_type='FUTURES',
            status__in=['OPEN', 'PARTIALLY_CLOSED'],
            futures_details__expiry_date=expiry_date
        )
        
        opposite_direction = 'SELL' if direction == 'BUY' else 'BUY'
        opposite_positions = existing_positions.filter(direction=opposite_direction)
        
        # Covering
        if opposite_positions.exists():
            return self._futures_covering(user, participation, wallet, trade_data, opposite_positions, margin_required)
        
        # Averaging
        same_direction_positions = existing_positions.filter(direction=direction)
        if same_direction_positions.exists():
            return self._futures_averaging(user, participation, wallet, trade_data, same_direction_positions, margin_required)
        
        # New position
        return self._futures_new_position(user, participation, wallet, trade_data, margin_required)
    
    def _futures_new_position(self, user, participation, wallet, trade_data, margin_required):
        """Create new FUTURES position"""
        quantity = trade_data['total_quantity']
        price = trade_data['entry_price']
        contract_size = trade_data.get('contract_size', Decimal('1'))
        
        trade = ChallengeTrade.objects.create(
            user=user,
            participation=participation,
            wallet=wallet,
            asset_symbol=trade_data['asset_symbol'],
            asset_name=trade_data.get('asset_name', ''),
            trade_type='FUTURES',
            direction=trade_data['direction'],
            total_quantity=quantity,
            remaining_quantity=quantity,
            average_entry_price=price,
            total_invested=margin_required,
            status='OPEN'
        )
        
        ChallengeFuturesDetails.objects.create(
            trade=trade,
            leverage=trade_data.get('leverage', Decimal('1')),
            margin_required=margin_required,
            expiry_date=trade_data.get('expiry_date'),
            contract_size=contract_size
        )
        
        wallet.lock_coins(margin_required)
        
        ChallengeTradeHistory.objects.create(
            trade=trade,
            user=user,
            action=trade_data['direction'],
            order_type=trade_data.get('order_type', 'MARKET'),
            quantity=quantity,
            price=price,
            amount=quantity * price * contract_size
        )
        
        return trade
    
    def _futures_averaging(self, user, participation, wallet, trade_data, positions, margin_required):
        """Handle averaging for FUTURES positions"""
        quantity = trade_data['total_quantity']
        price = trade_data['entry_price']
        
        main_position = positions.first()
        
        total_qty = main_position.remaining_quantity + quantity
        total_value = (main_position.average_entry_price * main_position.remaining_quantity) + (price * quantity)
        new_avg_price = total_value / total_qty
        
        self._validate_trade_constraints(participation, margin_required)
        
        main_position.remaining_quantity = total_qty
        main_position.total_quantity = total_qty
        main_position.average_entry_price = new_avg_price
        main_position.total_invested += margin_required
        main_position.save()
        
        if hasattr(main_position, 'futures_details'):
            main_position.futures_details.margin_required += margin_required
            main_position.futures_details.save()
        
        wallet.lock_coins(margin_required)
        
        ChallengeTradeHistory.objects.create(
            trade=main_position,
            user=user,
            action=trade_data['direction'],
            order_type=trade_data.get('order_type', 'MARKET'),
            quantity=quantity,
            price=price,
            amount=quantity * price
        )
        
        return main_position
    
    def _futures_covering(self, user, participation, wallet, trade_data, opposite_positions, margin_required):
        """Handle covering FUTURES positions"""
        quantity = trade_data['total_quantity']
        price = trade_data['entry_price']
        direction = trade_data['direction']
        contract_size = trade_data.get('contract_size', Decimal('1'))
        
        remaining_qty = quantity
        
        for position in opposite_positions.order_by('opened_at'):
            if remaining_qty <= 0:
                break
            
            qty_to_close = min(remaining_qty, position.remaining_quantity)
            
            # Calculate P&L with leverage
            if position.direction == 'BUY':
                pnl = (price - position.average_entry_price) * qty_to_close * contract_size
            else:
                pnl = (position.average_entry_price - price) * qty_to_close * contract_size
            
            position.remaining_quantity -= qty_to_close
            position.realized_pnl += pnl
            
            # Calculate margin to unlock
            margin_to_unlock = (position.futures_details.margin_required / position.total_quantity) * qty_to_close if hasattr(position, 'futures_details') else (position.total_invested / position.total_quantity) * qty_to_close
            
            if position.remaining_quantity == 0:
                position.status = 'CLOSED'
                position.closed_at = timezone.now()
            else:
                position.status = 'PARTIALLY_CLOSED'
            position.save()
            
            wallet.unlock_coins(margin_to_unlock)
            
            if pnl > 0:
                wallet.add_profit(pnl)
            else:
                wallet.deduct_loss(abs(pnl))
            
            ChallengeTradeHistory.objects.create(
                trade=position,
                user=user,
                action=direction,
                order_type=trade_data.get('order_type', 'MARKET'),
                quantity=qty_to_close,
                price=price,
                amount=qty_to_close * price * contract_size,
                realized_pnl=pnl
            )
            
            remaining_qty -= qty_to_close
        
        # Create new position if remaining
        if remaining_qty > 0:
            new_margin = (margin_required / quantity) * remaining_qty
            return self._futures_new_position(user, participation, wallet, {
                **trade_data,
                'total_quantity': remaining_qty
            }, new_margin)
        
        return opposite_positions.first()
    
    def _handle_options_trade(self, user, participation, trade_data):
        """
        Complete OPTIONS trading logic
        Handles: Call/Put, Long/Short, Premium, Strike, Expiry, ITM/OTM
        """
        wallet = participation.wallet
        asset_symbol = trade_data['asset_symbol']
        direction = trade_data['direction']
        quantity = trade_data['total_quantity']
        premium = trade_data['premium']
        option_type = trade_data['option_type']
        strike_price = trade_data['strike_price']
        expiry_date = trade_data['expiry_date']
        
        total_premium = quantity * premium
        
        # Calculate investment
        if direction == 'BUY':
            investment = total_premium
        else:
            # Margin for selling options
            margin_percentage = Decimal('0.20')
            investment = quantity * strike_price * margin_percentage
        
        self._validate_trade_constraints(participation, investment)
        
        # Find existing positions
        existing_positions = ChallengeTrade.objects.filter(
            user=user,
            participation=participation,
            asset_symbol=asset_symbol,
            trade_type='OPTIONS',
            status__in=['OPEN', 'PARTIALLY_CLOSED'],
            options_details__option_type=option_type,
            options_details__strike_price=strike_price,
            options_details__expiry_date=expiry_date
        )
        
        position_type = 'LONG' if direction == 'BUY' else 'SHORT'
        opposite_position_type = 'SHORT' if direction == 'BUY' else 'LONG'
        
        opposite_positions = existing_positions.filter(options_details__position=opposite_position_type)
        
        # Covering
        if opposite_positions.exists():
            return self._options_covering(user, participation, wallet, trade_data, opposite_positions, investment)
        
        # Averaging
        same_positions = existing_positions.filter(options_details__position=position_type)
        if same_positions.exists():
            return self._options_averaging(user, participation, wallet, trade_data, same_positions, investment)
        
        # New position
        return self._options_new_position(user, participation, wallet, trade_data, investment)
    
    def _options_new_position(self, user, participation, wallet, trade_data, investment):
        """Create new OPTIONS position"""
        quantity = trade_data['total_quantity']
        premium = trade_data['premium']
        position_type = 'LONG' if trade_data['direction'] == 'BUY' else 'SHORT'
        
        trade = ChallengeTrade.objects.create(
            user=user,
            participation=participation,
            wallet=wallet,
            asset_symbol=trade_data['asset_symbol'],
            asset_name=trade_data.get('asset_name', ''),
            trade_type='OPTIONS',
            direction=trade_data['direction'],
            total_quantity=quantity,
            remaining_quantity=quantity,
            average_entry_price=premium,
            total_invested=investment,
            status='OPEN'
        )
        
        ChallengeOptionsDetails.objects.create(
            trade=trade,
            option_type=trade_data['option_type'],
            position=position_type,
            strike_price=trade_data['strike_price'],
            expiry_date=trade_data['expiry_date'],
            premium=premium
        )
        
        wallet.lock_coins(investment)
        
        ChallengeTradeHistory.objects.create(
            trade=trade,
            user=user,
            action=trade_data['direction'],
            order_type=trade_data.get('order_type', 'MARKET'),
            quantity=quantity,
            price=premium,
            amount=quantity * premium
        )
        
        return trade
    
    def _options_averaging(self, user, participation, wallet, trade_data, positions, investment):
        """Handle averaging for OPTIONS positions"""
        quantity = trade_data['total_quantity']
        premium = trade_data['premium']
        
        main_position = positions.first()
        
        total_qty = main_position.remaining_quantity + quantity
        total_premium_value = (main_position.average_entry_price * main_position.remaining_quantity) + (premium * quantity)
        new_avg_premium = total_premium_value / total_qty
        
        self._validate_trade_constraints(participation, investment)
        
        main_position.remaining_quantity = total_qty
        main_position.total_quantity = total_qty
        main_position.average_entry_price = new_avg_premium
        main_position.total_invested += investment
        main_position.save()
        
        wallet.lock_coins(investment)
        
        ChallengeTradeHistory.objects.create(
            trade=main_position,
            user=user,
            action=trade_data['direction'],
            order_type=trade_data.get('order_type', 'MARKET'),
            quantity=quantity,
            price=premium,
            amount=quantity * premium
        )
        
        return main_position
    
    def _options_covering(self, user, participation, wallet, trade_data, opposite_positions, investment):
        """Handle covering OPTIONS positions"""
        quantity = trade_data['total_quantity']
        premium = trade_data['premium']
        direction = trade_data['direction']
        
        remaining_qty = quantity
        
        for position in opposite_positions.order_by('opened_at'):
            if remaining_qty <= 0:
                break
            
            qty_to_close = min(remaining_qty, position.remaining_quantity)
            
            # Calculate P&L
            if position.options_details.position == 'LONG':
                pnl = (premium - position.average_entry_price) * qty_to_close
            else:
                pnl = (position.average_entry_price - premium) * qty_to_close
            
            position.remaining_quantity -= qty_to_close
            position.realized_pnl += pnl
            
            unlock_amount = (position.total_invested / position.total_quantity) * qty_to_close
            
            if position.remaining_quantity == 0:
                position.status = 'CLOSED'
                position.closed_at = timezone.now()
            else:
                position.status = 'PARTIALLY_CLOSED'
            position.save()
            
            wallet.unlock_coins(unlock_amount)
            
            if pnl > 0:
                wallet.add_profit(pnl)
            else:
                wallet.deduct_loss(abs(pnl))
            
            ChallengeTradeHistory.objects.create(
                trade=position,
                user=user,
                action=direction,
                order_type=trade_data.get('order_type', 'MARKET'),
                quantity=qty_to_close,
                price=premium,
                amount=qty_to_close * premium,
                realized_pnl=pnl
            )
            
            remaining_qty -= qty_to_close
        
        # Create new position if remaining
        if remaining_qty > 0:
            new_investment = (investment / quantity) * remaining_qty
            return self._options_new_position(user, participation, wallet, {
                **trade_data,
                'total_quantity': remaining_qty
            }, new_investment)
        
        return opposite_positions.first()
    
    def _validate_trade_constraints(self, participation, investment_amount):
        """Validate trading constraints"""
        wallet = participation.wallet
        
        if not wallet.check_sufficient_balance(investment_amount):
            raise ValueError(f"Insufficient balance. Available: {wallet.available_balance}")
        
        allocation_pct = (investment_amount / wallet.initial_balance) * 100
        if allocation_pct > 30:
            raise ValueError(f"Position size {allocation_pct:.2f}% exceeds limit of 30%")
        
        total_locked = wallet.locked_balance + investment_amount
        total_locked_pct = (total_locked / wallet.initial_balance) * 100
        if total_locked_pct > 75:
            raise ValueError(f"Total locked {total_locked_pct:.2f}% exceeds limit of 75%")
        
        return True
    
    def _update_participation_metrics(self, participation):
        """Update participation metrics"""
        trades = participation.trades.all()
        
        participation.total_trades = trades.count()
        participation.spot_trades = trades.filter(trade_type='SPOT').count()
        participation.futures_trades = trades.filter(trade_type='FUTURES').count()
        participation.options_trades = trades.filter(trade_type='OPTIONS').count()
        
        if hasattr(participation, 'wallet'):
            participation.current_balance = participation.wallet.total_balance
            participation.portfolio_return_pct = participation.calculate_return_percentage()
        
        participation.save()
    
    # ==================== ADDITIONAL ACTIONS ====================
    
    @action(detail=False, methods=['post'])
    def auto_square_off(self, request):
        """Auto square-off all intraday positions"""
        participation_id = request.data.get('participation_id')
        
        if not participation_id:
            return Response({'error': 'participation_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            participation = UserChallengeParticipation.objects.select_for_update().get(
                id=participation_id, user=request.user
            )
            
            squared_off = self._auto_square_off_intraday(participation)
            self._update_participation_metrics(participation)
            
            return Response({
                'message': f'Squared off {len(squared_off)} positions',
                'count': len(squared_off),
                'trade_ids': [str(t.id) for t in squared_off]
            })
        except UserChallengeParticipation.DoesNotExist:
            return Response({'error': 'Participation not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @transaction.atomic
    def _auto_square_off_intraday(self, participation):
        """Square-off all intraday positions"""
        open_trades = participation.trades.filter(
            status__in=['OPEN', 'PARTIALLY_CLOSED'],
            holding_type='INTRADAY'
        )
        
        squared_off = []
        
        for trade in open_trades:
            exit_price = trade.current_price or trade.average_entry_price
            
            if trade.direction == 'BUY':
                pnl = (exit_price - trade.average_entry_price) * trade.remaining_quantity
            else:
                pnl = (trade.average_entry_price - exit_price) * trade.remaining_quantity
            
            trade.remaining_quantity = Decimal('0')
            trade.realized_pnl += pnl
            trade.status = 'CLOSED'
            trade.closed_at = timezone.now()
            trade.save()
            
            unlock_amount = trade.total_invested
            if trade.trade_type == 'FUTURES' and hasattr(trade, 'futures_details'):
                unlock_amount = trade.futures_details.margin_required
            
            trade.wallet.unlock_coins(unlock_amount)
            
            if pnl > 0:
                trade.wallet.add_profit(pnl)
            else:
                trade.wallet.deduct_loss(abs(pnl))
            
            ChallengeTradeHistory.objects.create(
                trade=trade,
                user=trade.user,
                action='AUTO_SQUARE_OFF',
                order_type='MARKET',
                quantity=trade.total_quantity,
                price=exit_price,
                amount=trade.total_quantity * exit_price,
                realized_pnl=pnl
            )
            
            squared_off.append(trade)
        
        return squared_off
    
    @action(detail=True, methods=['post'])
    def settle_expiry(self, request, pk=None):
        """Settle futures/options on expiry"""
        trade = self.get_object()
        
        if trade.trade_type not in ['FUTURES', 'OPTIONS']:
            return Response({'error': 'Only Futures/Options can be settled'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            settlement_price = Decimal(request.data.get('settlement_price'))
            
            if trade.trade_type == 'FUTURES':
                settled_trade = self._settle_futures_expiry(trade, settlement_price)
            else:
                settled_trade = self._settle_options_expiry(trade, settlement_price)
            
            self._update_participation_metrics(trade.participation)
            
            serializer = ChallengeTradeDetailSerializer(settled_trade)
            return Response(serializer.data)
            
        except (ValueError, TypeError):
            return Response({'error': 'Invalid settlement price'}, status=status.HTTP_400_BAD_REQUEST)
    
    @transaction.atomic
    def _settle_futures_expiry(self, trade, settlement_price):
        """Settle futures contract on expiry"""
        if trade.status == 'CLOSED':
            return trade
        
        quantity = trade.remaining_quantity
        contract_size = trade.futures_details.contract_size if hasattr(trade, 'futures_details') else Decimal('1')
        
        if trade.direction == 'BUY':
            pnl = (settlement_price - trade.average_entry_price) * quantity * contract_size
        else:
            pnl = (trade.average_entry_price - settlement_price) * quantity * contract_size
        
        trade.realized_pnl += pnl
        trade.remaining_quantity = Decimal('0')
        trade.status = 'CLOSED'
        trade.closed_at = timezone.now()
        trade.save()
        
        if hasattr(trade, 'futures_details'):
            trade.wallet.unlock_coins(trade.futures_details.margin_required)
        else:
            trade.wallet.unlock_coins(trade.total_invested)
        
        if pnl > 0:
            trade.wallet.add_profit(pnl)
        else:
            trade.wallet.deduct_loss(abs(pnl))
        
        ChallengeTradeHistory.objects.create(
            trade=trade,
            user=trade.user,
            action='EXPIRY_SETTLEMENT',
            order_type='EXPIRY',
            quantity=quantity,
            price=settlement_price,
            amount=quantity * settlement_price * contract_size,
            realized_pnl=pnl
        )
        
        return trade
    
    @transaction.atomic
    def _settle_options_expiry(self, trade, spot_price):
        """Settle options contract on expiry (ITM/OTM logic)"""
        if trade.status == 'CLOSED':
            return trade
        
        options_details = trade.options_details
        strike_price = options_details.strike_price
        quantity = trade.remaining_quantity
        option_type = options_details.option_type
        position = options_details.position
        
        # Determine ITM/OTM
        is_itm = False
        intrinsic_value = Decimal('0')
        
        if option_type == 'CALL':
            if spot_price > strike_price:
                is_itm = True
                intrinsic_value = spot_price - strike_price
        else:  # PUT
            if spot_price < strike_price:
                is_itm = True
                intrinsic_value = strike_price - spot_price
        
        # Calculate P&L
        pnl = Decimal('0')
        
        if position == 'LONG':
            if is_itm:
                pnl = (intrinsic_value * quantity) - (trade.average_entry_price * quantity)
            else:
                pnl = -(trade.average_entry_price * quantity)
        else:  # SHORT
            if is_itm:
                pnl = (trade.average_entry_price * quantity) - (intrinsic_value * quantity)
            else:
                pnl = trade.average_entry_price * quantity
        
        trade.realized_pnl += pnl
        trade.remaining_quantity = Decimal('0')
        trade.status = 'CLOSED'
        trade.closed_at = timezone.now()
        trade.save()
        
        trade.wallet.unlock_coins(trade.total_invested)
        
        if pnl > 0:
            trade.wallet.add_profit(pnl)
        else:
            trade.wallet.deduct_loss(abs(pnl))
        
        settlement_status = 'ITM' if is_itm else 'OTM'
        ChallengeTradeHistory.objects.create(
            trade=trade,
            user=trade.user,
            action=f'EXPIRY_SETTLEMENT_{settlement_status}',
            order_type='EXPIRY',
            quantity=quantity,
            price=spot_price,
            amount=intrinsic_value * quantity if is_itm else Decimal('0'),
            realized_pnl=pnl
        )
        
        return trade
    
    @action(detail=False, methods=['get'])
    def positions(self, request):
        """Get all open positions"""
        participation_id = request.query_params.get('participation_id')
        
        if not participation_id:
            return Response({'error': 'participation_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            participation = UserChallengeParticipation.objects.get(
                id=participation_id, user=request.user
            )
            
            open_trades = participation.trades.filter(
                status__in=['OPEN', 'PARTIALLY_CLOSED']
            ).select_related('futures_details', 'options_details')
            
            positions = {}
            
            for trade in open_trades:
                key = f"{trade.trade_type}_{trade.asset_symbol}"
                
                if key not in positions:
                    positions[key] = {
                        'asset_symbol': trade.asset_symbol,
                        'asset_name': trade.asset_name,
                        'trade_type': trade.trade_type,
                        'trades': [],
                        'total_quantity': Decimal('0'),
                        'total_invested': Decimal('0'),
                        'total_unrealized_pnl': Decimal('0'),
                    }
                
                positions[key]['trades'].append(ChallengeTradeSerializer(trade).data)
                positions[key]['total_quantity'] += trade.remaining_quantity
                positions[key]['total_invested'] += trade.total_invested
                positions[key]['total_unrealized_pnl'] += trade.unrealized_pnl
            
            return Response({'positions': list(positions.values())})
            
        except UserChallengeParticipation.DoesNotExist:
            return Response({'error': 'Participation not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get comprehensive trade summary"""
        participation_id = request.query_params.get('participation_id')
        
        if not participation_id:
            return Response({'error': 'participation_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            participation = UserChallengeParticipation.objects.get(
                id=participation_id, user=request.user
            )
            
            trades = participation.trades.all()
            
            total_trades = trades.count()
            open_trades = trades.filter(status__in=['OPEN', 'PARTIALLY_CLOSED']).count()
            closed_trades = trades.filter(status='CLOSED').count()
            
            total_realized_pnl = trades.aggregate(Sum('realized_pnl'))['realized_pnl__sum'] or Decimal('0')
            total_unrealized_pnl = trades.aggregate(Sum('unrealized_pnl'))['unrealized_pnl__sum'] or Decimal('0')
            total_pnl = total_realized_pnl + total_unrealized_pnl
            
            profitable_trades = trades.filter(realized_pnl__gt=0).count()
            losing_trades = trades.filter(realized_pnl__lt=0).count()
            
            summary = {
                'total_trades': total_trades,
                'open_trades': open_trades,
                'closed_trades': closed_trades,
                'total_realized_pnl': str(total_realized_pnl),
                'total_unrealized_pnl': str(total_unrealized_pnl),
                'total_pnl': str(total_pnl),
                'profitable_trades': profitable_trades,
                'losing_trades': losing_trades,
                'win_rate': f"{(profitable_trades / closed_trades * 100):.2f}%" if closed_trades > 0 else "0.00%",
                'trade_types': {
                    'spot': trades.filter(trade_type='SPOT').count(),
                    'futures': trades.filter(trade_type='FUTURES').count(),
                    'options': trades.filter(trade_type='OPTIONS').count()
                },
                'directions': {
                    'buy': trades.filter(direction='BUY').count(),
                    'sell': trades.filter(direction='SELL').count()
                },
                'wallet': {
                    'current_balance': str(participation.wallet.current_balance) if hasattr(participation, 'wallet') else '0',
                    'available_balance': str(participation.wallet.available_balance) if hasattr(participation, 'wallet') else '0',
                    'locked_balance': str(participation.wallet.locked_balance) if hasattr(participation, 'wallet') else '0'
                }
            }
            
            return Response(summary)
            
        except UserChallengeParticipation.DoesNotExist:
            return Response({'error': 'Participation not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def update_price(self, request, pk=None):
        """Update current market price and unrealized P&L"""
        trade = self.get_object()
        
        try:
            current_price = Decimal(request.data.get('current_price'))
            trade.calculate_unrealized_pnl(current_price)
            
            serializer = self.get_serializer(trade)
            return Response(serializer.data)
        except (ValueError, TypeError):
            return Response({'error': 'Invalid price value'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def batch_update_prices(self, request):
        """Batch update current prices for multiple trades"""
        price_updates = request.data.get('price_updates', [])
        
        if not price_updates:
            return Response(
                {'error': 'price_updates required as array of {trade_id, price}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_trades = []
        errors = []
        
        for update in price_updates:
            try:
                trade_id = update.get('trade_id')
                current_price = Decimal(update.get('price'))
                
                trade = ChallengeTrade.objects.get(id=trade_id, user=request.user)
                trade.calculate_unrealized_pnl(current_price)
                updated_trades.append(str(trade_id))
                
            except ChallengeTrade.DoesNotExist:
                errors.append(f"Trade {trade_id} not found")
            except (ValueError, TypeError):
                errors.append(f"Invalid price for trade {trade_id}")
        
        return Response({
            'updated_count': len(updated_trades),
            'updated_trades': updated_trades,
            'errors': errors
        })
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get complete trade action history"""
        trade = self.get_object()
        history = trade.history.all().order_by('-created_at')
        
        serializer = ChallengeTradeHistorySerializer(history, many=True)
        return Response(serializer.data)
# # ==================== FILE: apps/challenges/views/trade_views.py ====================

# from rest_framework import viewsets, status
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated
# from decimal import Decimal
# from django.utils import timezone

# # from apps.challenges.models import (
# #     ChallengeTrade, ChallengeTradeAnalytics, 
# #     UserChallengeParticipation
# # )
# from apps.admin.challenge.models.challenge_models import UserChallengeParticipation
# from apps.admin.challenge.models.trade_models import ChallengeTrade
# from apps.admin.challenge.models.analytics_models import ChallengeTradeAnalytics
# # from apps.challenges.serializers.trade_serializers import (
# #     ChallengeTradeSerializer, ChallengeTradeAnalyticsSerializer,
# #     ChallengeTradeCreateSerializer, ChallengeTradeCloseSerializer,
# #     ChallengeTradeHistorySerializer, ChallengeTradeDetailSerializer
# # )
# from apps.admin.challenge.serializers.trade_serializers import (
#     ChallengeTradeSerializer, ChallengeTradeAnalyticsSerializer,
#     ChallengeTradeCreateSerializer, ChallengeTradeCloseSerializer,
#     ChallengeTradeHistorySerializer, ChallengeTradeDetailSerializer
# )   
# # from apps.challenges.services.trade_service import TradeService
# from apps.admin.challenge.services.trade_service import TradeService


# class ChallengeTradeViewSet(viewsets.ModelViewSet):
#     """Challenge trade management"""
#     serializer_class = ChallengeTradeSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_queryset(self):
#         return ChallengeTrade.objects.filter(user=self.request.user)
    
#     def get_serializer_class(self):
#         if self.action == 'create':
#             return ChallengeTradeCreateSerializer
#         elif self.action == 'retrieve':
#             return ChallengeTradeDetailSerializer
#         return ChallengeTradeSerializer
    
#     def list(self, request, *args, **kwargs):
#         """List user's trades with filtering"""
#         queryset = self.get_queryset()
        
#         participation_id = request.query_params.get('participation_id')
#         if participation_id:
#             queryset = queryset.filter(participation_id=participation_id)
#         week_id = request.query_params.get('week_id')
#         if week_id:
#             queryset = queryset.filter(participation__week_id=week_id)

#         status_filter = request.query_params.get('status')
#         if status_filter:
#             queryset = queryset.filter(status=status_filter)
        
#         trade_type = request.query_params.get('trade_type')
#         if trade_type:
#             queryset = queryset.filter(trade_type=trade_type)
        
#         serializer = self.get_serializer(queryset, many=True)
#         return Response(serializer.data)
    
#     def create(self, request, *args, **kwargs):
#         """Execute a new trade"""
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
        
#         try:
#             trade = TradeService.execute_trade(request.user, serializer.validated_data)
#             response_serializer = ChallengeTradeSerializer(trade)
#             return Response(response_serializer.data, status=status.HTTP_201_CREATED)
#         except ValueError as e:
#             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
#         except Exception as e:
#             return Response({'error': 'Trade execution failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
#     @action(detail=True, methods=['post'])
#     def close(self, request, pk=None):
#         """Close or partially close a trade"""
#         trade = self.get_object()
#         serializer = ChallengeTradeCloseSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
        
#         try:
#             trade = TradeService.close_trade(trade, serializer.validated_data)
#             response_serializer = ChallengeTradeSerializer(trade)
#             return Response(response_serializer.data)
#         except ValueError as e:
#             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
#         except Exception as e:
#             return Response({'error': 'Trade closure failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
#     @action(detail=True, methods=['post'])
#     def update_price(self, request, pk=None):
#         """Update current market price"""
#         trade = self.get_object()
#         current_price = Decimal(request.data.get('current_price'))
        
#         trade.calculate_unrealized_pnl(current_price)
        
#         serializer = self.get_serializer(trade)
#         return Response(serializer.data)
    
#     @action(detail=True, methods=['get'])
#     def history(self, request, pk=None):
#         """Get trade action history"""
#         trade = self.get_object()
#         history = trade.history.all()
        
#         serializer = ChallengeTradeHistorySerializer(history, many=True)
#         return Response(serializer.data)
    
#     @action(detail=False, methods=['get'])
#     def summary(self, request):
#         """Get trade summary for participation"""
#         participation_id = request.query_params.get('participation_id')
        
#         if not participation_id:
#             return Response(
#                 {'error': 'participation_id required'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         try:
#             participation = UserChallengeParticipation.objects.get(
#                 id=participation_id,
#                 user=request.user
#             )
            
#             summary = TradeService.get_trade_summary(participation)
#             return Response(summary)
#         except UserChallengeParticipation.DoesNotExist:
#             return Response(
#                 {'error': 'Participation not found'},
#                 status=status.HTTP_404_NOT_FOUND
#             )


# class ChallengeTradeAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
#     """Trade analytics"""
#     serializer_class = ChallengeTradeAnalyticsSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_queryset(self):
#         return ChallengeTradeAnalytics.objects.filter(
#             participation__user=self.request.user
#         )
    
#     @action(detail=False, methods=['get'])
#     def participation_analytics(self, request):
#         """Get analytics for specific participation"""
#         participation_id = request.query_params.get('participation_id')
        
#         if not participation_id:
#             return Response(
#                 {'error': 'participation_id required'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         try:
#             participation = UserChallengeParticipation.objects.get(
#                 id=participation_id,
#                 user=request.user
#             )
            
#             analytics, created = ChallengeTradeAnalytics.objects.get_or_create(
#                 participation=participation
#             )
            
#             from datetime import timedelta
#             if timezone.now() - analytics.last_calculated_at > timedelta(minutes=5):
#                 analytics.recalculate()
            
#             serializer = self.get_serializer(analytics)
#             return Response(serializer.data)
#         except UserChallengeParticipation.DoesNotExist:
#             return Response(
#                 {'error': 'Participation not found'},
#                 status=status.HTTP_404_NOT_FOUND
#             )
    
#     @action(detail=False, methods=['post'])
#     def recalculate(self, request):
#         """Force recalculate analytics"""
#         participation_id = request.data.get('participation_id')
        
#         if not participation_id:
#             return Response(
#                 {'error': 'participation_id required'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         try:
#             participation = UserChallengeParticipation.objects.get(
#                 id=participation_id,
#                 user=request.user
#             )
            
#             analytics, created = ChallengeTradeAnalytics.objects.get_or_create(
#                 participation=participation
#             )
#             analytics.recalculate()
            
#             serializer = self.get_serializer(analytics)
#             return Response(serializer.data)
#         except UserChallengeParticipation.DoesNotExist:
#             return Response(
#                 {'error': 'Participation not found'},
#                 status=status.HTTP_404_NOT_FOUND
#             )

