# # apps/client/trading/views.py
# Complete views with wallet integration

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Q, Sum
from django.utils import timezone
from django.core.exceptions import ValidationError
from decimal import Decimal
from datetime import datetime, timedelta
import uuid
import logging

# Initialize logger
logger = logging.getLogger(__name__)

from .models import Trade, FuturesDetails, OptionsDetails, TradeHistory, Portfolio
from .serializers import (
    TradeSerializer,
    PlaceOrderSerializer,
    PartialCloseSerializer,
    CloseTradeSerializer,
    PortfolioSerializer,
    ActivePositionSerializer,
    PnLReportSerializer,
    RiskCheckSerializer,
    UpdatePricesSerializer,
    TradeHistorySerializer,
)
from .wallet_services import WalletService
from apps.permission.permissions import   HasActiveSubscription

# class TradeViewSet(viewsets.ModelViewSet):
#     serializer_class = TradeSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         return Trade.objects.filter(user=self.request.user).order_by("-opened_at")

#     @action(detail=True, methods=["post"])
#     def update_pnl(self, request, pk=None):
#         trade = self.get_object()
#         current_price = request.data.get("current_price")
#         if current_price:
#             pnl = trade.calculate_unrealized_pnl(Decimal(current_price))
#             return Response({"unrealized_pnl": str(pnl)})
#         return Response({"error": "Current price is required"}, status=400)



class TradeViewSet(viewsets.ModelViewSet):
    serializer_class = TradeSerializer
    permission_classes = [IsAuthenticated, HasActiveSubscription]

    def get_queryset(self):
        return Trade.objects.filter(user=self.request.user).order_by("-opened_at")

    @action(detail=True, methods=["post"])
    def update_pnl(self, request, pk=None):
        trade = self.get_object()
        current_price = request.data.get("current_price")
        if current_price:
            pnl = trade.calculate_unrealized_pnl(Decimal(current_price))
            return Response({"unrealized_pnl": str(pnl)})
        return Response({"error": "Current price is required"}, status=400)


class PlaceOrderView(APIView):
    permission_classes = [IsAuthenticated, HasActiveSubscription]

    def post(self, request):
        serializer = PlaceOrderSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    result = self._process_order(
                        request.user, serializer.validated_data
                    )
                    return Response(result, status=status.HTTP_201_CREATED)
            except ValidationError as e:
                logger.error(f"Validation error: {str(e)}")
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                logger.error(f"Error processing order: {str(e)}", exc_info=True)
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def _process_order(self, user, data):
        """Main order processing logic"""
        trade_type = data["trade_type"]

        if trade_type == "SPOT":
            return self._process_spot_order(user, data)
        elif trade_type == "FUTURES":
            return self._process_futures_order(user, data)
        elif trade_type == "OPTIONS":
            return self._process_options_order(user, data)
        else:
            raise ValueError(f"Unsupported trade type: {trade_type}")

    # =====================================================================
    # SPOT TRADING - CORRECTED
    # =====================================================================

    def _process_spot_order(self, user, data):
        """Handle spot trading logic - CORRECTED"""
        asset_symbol = data["asset_symbol"]
        direction = data["direction"]
        quantity = data["quantity"]
        price = data["price"]
        holding_type = data["holding_type"]

        # FIND EXISTING POSITIONS (only same holding_type and same direction)
        existing_trade = Trade.objects.filter(
            user=user,
            asset_symbol=asset_symbol,
            trade_type="SPOT",
            holding_type=holding_type,
            direction=direction,
            status__in=["OPEN", "PARTIALLY_CLOSED"],
        ).first()

        if direction == "BUY":
            return self._handle_spot_buy(user, data, existing_trade)
        else:  # direction == 'SELL'
            return self._handle_spot_sell(user, data, existing_trade, holding_type)

    def _handle_spot_buy(self, user, data, existing_trade):
        """Handle SPOT BUY orders"""
        quantity = data["quantity"]
        price = data["price"]
        amount = quantity * price
        holding_type = data["holding_type"]

        # CHECK WALLET BALANCE
        if not WalletService.check_balance(user, amount):
            current_balance = WalletService.get_balance(user)
            raise ValidationError(
                f"Insufficient coins. Need: {amount}, You have: {current_balance}"
            )

        # DEDUCT COINS FROM WALLET
        WalletService.deduct_coins(
            user=user,
            amount=amount,
            description=f"Buy {quantity} {data['asset_symbol']} @ {price} ({holding_type})",
        )

        # If existing BUY position, add to it
        if existing_trade and existing_trade.direction == "BUY":
            old_value = existing_trade.remaining_quantity * existing_trade.average_price
            new_value = quantity * price
            total_quantity = existing_trade.remaining_quantity + quantity

            existing_trade.average_price = (old_value + new_value) / total_quantity
            existing_trade.remaining_quantity = total_quantity
            existing_trade.total_quantity += quantity
            existing_trade.total_invested += amount
            existing_trade.save()

            trade = existing_trade
            action = "ADD_TO_POSITION"
        else:
            # Create new BUY position
            trade = Trade.objects.create(
                user=user,
                asset_symbol=data["asset_symbol"],
                asset_name=data.get("asset_name", ""),
                asset_exchange=data.get("asset_exchange", ""),
                trade_type="SPOT",
                direction="BUY",
                status="OPEN",
                holding_type=holding_type,
                total_quantity=quantity,
                remaining_quantity=quantity,
                average_price=price,
                total_invested=amount,
            )
            action = "BUY"

        TradeHistory.objects.create(
            trade=trade,
            user=user,
            action="BUY",
            order_type=data.get("order_type", "MARKET"),
            quantity=quantity,
            price=price,
            amount=amount,
        )

        self._update_portfolio(user)
        new_balance = WalletService.get_balance(user)

        return {
            "trade_id": str(trade.id),
            "action": action,
            "direction": "BUY",
            "holding_type": holding_type,
            "quantity": str(quantity),
            "price": str(price),
            "total_quantity": str(trade.total_quantity),
            "average_price": str(trade.average_price),
            "coins_paid": str(amount),
            "wallet_balance": str(new_balance),
        }

    def _handle_spot_sell(self, user, data, existing_trade, holding_type):
        """Handle SPOT SELL orders"""
        quantity = data["quantity"]
        price = data["price"]

        if holding_type == "LONGTERM":
            if not existing_trade:
                raise ValidationError(
                    "Cannot SELL in LONGTERM - no existing BUY position to close"
                )
            return self._close_longterm_position(user, data, existing_trade)
        elif holding_type == "INTRADAY":
            if existing_trade:
                return self._close_intraday_position(user, data, existing_trade)
            else:
                return self._create_intraday_short_position(user, data)

    def _close_longterm_position(self, user, data, existing_trade):
        """Close LONGTERM BUY position"""
        quantity = data["quantity"]
        price = data["price"]

        if existing_trade.direction != "BUY":
            raise ValidationError("Invalid position for LONGTERM SELL")

        if quantity > existing_trade.remaining_quantity:
            raise ValidationError(
                f"Cannot sell {quantity}, only {existing_trade.remaining_quantity} available"
            )

        cost_basis = existing_trade.average_price * quantity
        sell_value = price * quantity
        realized_pnl = sell_value - cost_basis

        WalletService.credit_coins(
            user=user,
            amount=sell_value,
            description=f"Sell {quantity} {existing_trade.asset_symbol} @ {price} (LONGTERM)",
        )

        existing_trade.remaining_quantity -= quantity
        existing_trade.realized_pnl += realized_pnl

        if existing_trade.remaining_quantity == 0:
            existing_trade.status = "CLOSED"
            existing_trade.closed_at = timezone.now()
        else:
            existing_trade.status = "PARTIALLY_CLOSED"

        existing_trade.save()

        TradeHistory.objects.create(
            trade=existing_trade,
            user=user,
            action="SELL",
            order_type=data.get("order_type", "MARKET"),
            quantity=quantity,
            price=price,
            amount=sell_value,
            realized_pnl=realized_pnl,
        )

        self._update_portfolio(user)
        new_balance = WalletService.get_balance(user)

        return {
            "trade_id": str(existing_trade.id),
            "action": "SELL_LONGTERM",
            "direction": "SELL",
            "holding_type": "LONGTERM",
            "quantity": str(quantity),
            "price": str(price),
            "realized_pnl": str(realized_pnl),
            "remaining_quantity": str(existing_trade.remaining_quantity),
            "status": existing_trade.status,
            "coins_received": str(sell_value),
            "wallet_balance": str(new_balance),
        }

    def _close_intraday_position(self, user, data, existing_trade):
        """Close INTRADAY position (BUY or SHORT)"""
        quantity = data["quantity"]
        price = data["price"]

        if quantity > existing_trade.remaining_quantity:
            raise ValidationError(
                f"Cannot close {quantity}, only {existing_trade.remaining_quantity} available"
            )

        if existing_trade.direction == "BUY":
            realized_pnl = (price - existing_trade.average_price) * quantity
        else:
            realized_pnl = (existing_trade.average_price - price) * quantity

        settlement_amount = price * quantity

        if existing_trade.direction == "BUY":
            WalletService.credit_coins(
                user=user,
                amount=settlement_amount,
                description=f"Close BUY {quantity} {existing_trade.asset_symbol} @ {price} (INTRADAY)",
            )
        else:
            collateral = existing_trade.total_invested
            total_return = collateral + realized_pnl
            if total_return > 0:
                WalletService.unblock_coins(
                    user=user,
                    amount=total_return,
                    description=f"Close SHORT {quantity} {existing_trade.asset_symbol} @ {price} (INTRADAY)",
                )

        existing_trade.remaining_quantity -= quantity
        existing_trade.realized_pnl += realized_pnl

        if existing_trade.remaining_quantity == 0:
            existing_trade.status = "CLOSED"
            existing_trade.closed_at = timezone.now()
        else:
            existing_trade.status = "PARTIALLY_CLOSED"

        existing_trade.save()

        TradeHistory.objects.create(
            trade=existing_trade,
            user=user,
            action="SELL",
            order_type=data.get("order_type", "MARKET"),
            quantity=quantity,
            price=price,
            amount=settlement_amount,
            realized_pnl=realized_pnl,
        )

        self._update_portfolio(user)
        new_balance = WalletService.get_balance(user)

        return {
            "trade_id": str(existing_trade.id),
            "action": "CLOSE_INTRADAY",
            "direction": "SELL",
            "holding_type": "INTRADAY",
            "closed_position_type": existing_trade.direction,
            "quantity": str(quantity),
            "price": str(price),
            "realized_pnl": str(realized_pnl),
            "remaining_quantity": str(existing_trade.remaining_quantity),
            "status": existing_trade.status,
            "settlement_amount": str(settlement_amount),
            "wallet_balance": str(new_balance),
        }

    def _create_intraday_short_position(self, user, data):
        """Create INTRADAY SHORT position"""
        quantity = data["quantity"]
        price = data["price"]
        amount = quantity * price

        if not WalletService.check_balance(user, amount):
            current_balance = WalletService.get_balance(user)
            raise ValidationError(
                f"Insufficient coins for short collateral. Need: {amount}, You have: {current_balance}"
            )

        WalletService.block_coins(
            user=user,
            amount=amount,
            description=f"Short sell {quantity} {data['asset_symbol']} @ {price} (INTRADAY)",
        )

        trade = Trade.objects.create(
            user=user,
            asset_symbol=data["asset_symbol"],
            asset_name=data.get("asset_name", ""),
            asset_exchange=data.get("asset_exchange", ""),
            trade_type="SPOT",
            direction="SELL",
            status="OPEN",
            holding_type="INTRADAY",
            total_quantity=quantity,
            remaining_quantity=quantity,
            average_price=price,
            total_invested=amount,
        )

        TradeHistory.objects.create(
            trade=trade,
            user=user,
            action="SELL",
            order_type=data.get("order_type", "MARKET"),
            quantity=quantity,
            price=price,
            amount=amount,
        )

        self._update_portfolio(user)
        new_balance = WalletService.get_balance(user)

        return {
            "trade_id": str(trade.id),
            "action": "CREATE_SHORT_POSITION",
            "direction": "SELL",
            "holding_type": "INTRADAY",
            "quantity": str(quantity),
            "price": str(price),
            "collateral_blocked": str(amount),
            "wallet_balance": str(new_balance),
        }

    # =====================================================================
    # FUTURES TRADING - COMPLETE FIX
    # =====================================================================

    def _process_futures_order(self, user, data):
        """Handle futures trading logic"""
        asset_symbol = data["asset_symbol"]

        existing_trade = Trade.objects.filter(
            user=user,
            asset_symbol=asset_symbol,
            trade_type="FUTURES",
            status__in=["OPEN", "PARTIALLY_CLOSED"],
        ).first()

        if existing_trade:
            return self._handle_existing_futures_position(user, data, existing_trade)
        else:
            return self._create_new_futures_position(user, data)

    def _handle_existing_futures_position(self, user, data, existing_trade):
        """Handle futures position modification"""
        direction = data["direction"]
        quantity = data["quantity"]
        price = data["price"]

        if existing_trade.direction == direction:
            old_value = existing_trade.remaining_quantity * existing_trade.average_price
            new_value = quantity * price
            total_quantity = existing_trade.remaining_quantity + quantity

            existing_trade.average_price = (old_value + new_value) / total_quantity
            existing_trade.remaining_quantity = total_quantity
            existing_trade.total_quantity += quantity
            existing_trade.save()

            action = "INCREASE_POSITION"
        else:
            if quantity > existing_trade.remaining_quantity:
                remaining_qty = quantity - existing_trade.remaining_quantity
                existing_trade.remaining_quantity = remaining_qty
                existing_trade.direction = direction
                existing_trade.average_price = price
                action = "FLIP_POSITION"
            elif quantity == existing_trade.remaining_quantity:
                existing_trade.remaining_quantity = Decimal("0")
                existing_trade.status = "CLOSED"
                existing_trade.closed_at = timezone.now()
                action = "CLOSE_POSITION"
            else:
                existing_trade.remaining_quantity -= quantity
                action = "REDUCE_POSITION"

            existing_trade.save()

        TradeHistory.objects.create(
            trade=existing_trade,
            user=user,
            action=direction,
            order_type=data.get("order_type", "MARKET"),
            quantity=quantity,
            price=price,
            amount=quantity * price,
        )

        self._update_portfolio(user)
        new_balance = WalletService.get_balance(user)

        return {
            "trade_id": str(existing_trade.id),
            "action": action,
            "direction": direction,
            "quantity": str(quantity),
            "price": str(price),
            "remaining_quantity": str(existing_trade.remaining_quantity),
            "status": existing_trade.status,
            "wallet_balance": str(new_balance),
        }

    def _create_new_futures_position(self, user, data):
        """Create new futures position - WALLET FIX"""
        quantity = data["quantity"]
        price = data["price"]
        leverage = data.get("leverage", Decimal("1"))

        position_value = quantity * price
        margin_required = position_value / leverage

        logger.info(
            f"FUTURES OPEN: user={user.email}, qty={quantity}, price={price}, "
            f"leverage={leverage}, position_value={position_value}, margin={margin_required}"
        )

        if not WalletService.check_balance(user, margin_required):
            current_balance = WalletService.get_balance(user)
            raise ValidationError(
                f"Insufficient coins for margin. Need: {margin_required}, Available: {current_balance}"
            )

        WalletService.block_coins(
            user=user,
            amount=margin_required,
            description=f"FUTURES {data['direction']}: {quantity} {data['asset_symbol']} @ {price} ({leverage}x leverage)",
        )

        trade = Trade.objects.create(
            user=user,
            asset_symbol=data["asset_symbol"],
            asset_name=data.get("asset_name", ""),
            asset_exchange=data.get("asset_exchange", ""),
            trade_type="FUTURES",
            direction=data["direction"],
            status="OPEN",
            holding_type=data.get("holding_type", "INTRADAY"),
            total_quantity=quantity,
            remaining_quantity=quantity,
            average_price=price,
            total_invested=margin_required,
        )

        FuturesDetails.objects.create(
            trade=trade,
            leverage=leverage,
            margin_required=margin_required,
            margin_used=margin_required,
            expiry_date=data["expiry_date"],
            contract_size=data.get("contract_size", Decimal("1")),
            is_hedged=data.get("is_hedged", False),
        )

        TradeHistory.objects.create(
            trade=trade,
            user=user,
            action=data["direction"],
            order_type=data.get("order_type", "MARKET"),
            quantity=quantity,
            price=price,
            amount=position_value,
        )

        self._update_portfolio(user)
        new_balance = WalletService.get_balance(user)

        logger.info(
            f"FUTURES CREATED: trade_id={trade.id}, margin_blocked={margin_required}, new_balance={new_balance}"
        )

        return {
            "trade_id": str(trade.id),
            "action": "CREATE_FUTURES_POSITION",
            "direction": data["direction"],
            "quantity": str(quantity),
            "price": str(price),
            "leverage": str(leverage),
            "position_value": str(position_value),
            "margin_required": str(margin_required),
            "margin_blocked": str(margin_required),
            "wallet_balance": str(new_balance),
        }

    # =====================================================================
    # OPTIONS TRADING - COMPLETE FIX
    # =====================================================================

    def _process_options_order(self, user, data):
        """Handle options trading logic"""
        asset_symbol = data["asset_symbol"]
        option_type = data["option_type"]
        strike_price = data["strike_price"]
        expiry_date = data["expiry_date"]
        direction = data["direction"]

        existing_trade = Trade.objects.filter(
            user=user,
            asset_symbol=asset_symbol,
            trade_type="OPTIONS",
            direction=direction,
            status__in=["OPEN", "PARTIALLY_CLOSED"],
            options_details__option_type=option_type,
            options_details__strike_price=strike_price,
            options_details__expiry_date=expiry_date,
        ).first()

        if existing_trade:
            return self._handle_existing_options_position(user, data, existing_trade)
        else:
            return self._create_new_options_position(user, data)

    def _handle_existing_options_position(self, user, data, existing_trade):
        """Handle existing options position"""
        quantity = data["quantity"]
        premium = data["premium"]
        position_cost = quantity * premium

        if not WalletService.check_balance(user, position_cost):
            current_balance = WalletService.get_balance(user)
            raise ValidationError(
                f"Insufficient coins. Need: {position_cost}, You have: {current_balance}"
            )

        WalletService.deduct_coins(
            user=user,
            amount=position_cost,
            description=f"Add {quantity} {data['asset_symbol']} {data['option_type']} Options",
        )

        old_value = existing_trade.remaining_quantity * existing_trade.average_price
        new_value = quantity * premium
        total_quantity = existing_trade.remaining_quantity + quantity

        existing_trade.average_price = (old_value + new_value) / total_quantity
        existing_trade.remaining_quantity = total_quantity
        existing_trade.total_quantity += quantity
        existing_trade.total_invested += position_cost
        existing_trade.save()

        TradeHistory.objects.create(
            trade=existing_trade,
            user=user,
            action=data["direction"],
            order_type=data.get("order_type", "MARKET"),
            quantity=quantity,
            price=premium,
            amount=position_cost,
        )

        self._update_portfolio(user)
        new_balance = WalletService.get_balance(user)

        return {
            "trade_id": str(existing_trade.id),
            "action": "INCREASE_OPTIONS_POSITION",
            "option_type": data["option_type"],
            "quantity": str(quantity),
            "premium": str(premium),
            "coins_paid": str(position_cost),
            "wallet_balance": str(new_balance),
        }

    def _create_new_options_position(self, user, data):
        """Create new options position - WALLET FIX"""
        quantity = data["quantity"]
        premium = data["premium"]
        position_cost = quantity * premium

        logger.info(
            f"OPTIONS OPEN: user={user.email}, qty={quantity}, premium={premium}, "
            f"option_type={data['option_type']}, strike={data['strike_price']}, cost={position_cost}"
        )

        if not WalletService.check_balance(user, position_cost):
            current_balance = WalletService.get_balance(user)
            raise ValidationError(
                f"Insufficient coins for options premium. Need: {position_cost}, Available: {current_balance}"
            )

        WalletService.deduct_coins(
            user=user,
            amount=position_cost,
            description=f"OPTIONS {data['direction']}: {quantity} {data['asset_symbol']} "
            f"{data['option_type']} @ strike {data['strike_price']} (premium: {premium})",
        )

        trade = Trade.objects.create(
            user=user,
            asset_symbol=data["asset_symbol"],
            asset_name=data.get("asset_name", ""),
            asset_exchange=data.get("asset_exchange", ""),
            trade_type="OPTIONS",
            direction=data["direction"],
            status="OPEN",
            holding_type=data.get("holding_type", "INTRADAY"),
            total_quantity=quantity,
            remaining_quantity=quantity,
            average_price=premium,
            total_invested=position_cost,
        )

        OptionsDetails.objects.create(
            trade=trade,
            option_type=data["option_type"],
            position=data["option_position"],
            strike_price=data["strike_price"],
            expiry_date=data["expiry_date"],
            premium=premium,
        )

        TradeHistory.objects.create(
            trade=trade,
            user=user,
            action=data["direction"],
            order_type=data.get("order_type", "MARKET"),
            quantity=quantity,
            price=premium,
            amount=position_cost,
        )

        self._update_portfolio(user)
        new_balance = WalletService.get_balance(user)

        logger.info(
            f"OPTIONS CREATED: trade_id={trade.id}, premium_paid={position_cost}, new_balance={new_balance}"
        )

        return {
            "trade_id": str(trade.id),
            "action": "CREATE_OPTIONS_POSITION",
            "option_type": data["option_type"],
            "strike_price": str(data["strike_price"]),
            "premium": str(premium),
            "quantity": str(quantity),
            "total_premium_paid": str(position_cost),
            "wallet_balance": str(new_balance),
        }

    def _update_portfolio(self, user):
        """Update user portfolio metrics"""
        portfolio, created = Portfolio.objects.get_or_create(user=user)
        portfolio.update_portfolio_metrics()


# =====================================================================
# PARTIAL CLOSE VIEW - FULLY CORRECTED
# =====================================================================


class PartialCloseView(APIView):
    permission_classes = [IsAuthenticated, HasActiveSubscription]

    def post(self, request, trade_id):
        try:
            trade = Trade.objects.get(id=trade_id, user=request.user)
        except Trade.DoesNotExist:
            return Response({"error": "Trade not found"}, status=404)

        serializer = PartialCloseSerializer(data=request.data, context={"trade": trade})
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    result = self._partial_close_trade(trade, serializer.validated_data)
                    return Response(result)
            except ValidationError as e:
                logger.error(f"Validation error: {str(e)}")
                return Response({"error": str(e)}, status=400)
            except Exception as e:
                logger.error(f"Error partial closing trade: {str(e)}", exc_info=True)
                return Response({"error": str(e)}, status=400)
        return Response(serializer.errors, status=400)

    def _partial_close_trade(self, trade, data):
        """Handle partial closing of trades - FULLY CORRECTED"""
        quantity = data["quantity"]
        price = data.get("price", trade.average_price)

        if quantity > trade.remaining_quantity:
            raise ValidationError("Cannot close more than remaining quantity")

        logger.info(
            f"PARTIAL CLOSING: id={trade.id}, type={trade.trade_type}, "
            f"qty={quantity}, price={price}"
        )

        # Calculate P&L and handle wallet
        if trade.trade_type == "SPOT":
            # SPOT LOGIC
            if trade.direction == "BUY":
                realized_pnl = (price - trade.average_price) * quantity
            else:
                realized_pnl = (trade.average_price - price) * quantity

            sell_value = price * quantity
            WalletService.credit_coins(
                user=trade.user,
                amount=sell_value,
                description=f"Partial close SPOT: {quantity} {trade.asset_symbol}",
            )

        elif trade.trade_type == "FUTURES":
            # FUTURES PARTIAL CLOSE - CORRECTED
            margin_per_unit = trade.total_invested / trade.total_quantity
            margin_to_release = margin_per_unit * quantity

            if trade.direction == "BUY":
                realized_pnl = (price - trade.average_price) * quantity
            else:
                realized_pnl = (trade.average_price - price) * quantity

            logger.info(
                f"FUTURES PARTIAL: margin_to_release={margin_to_release}, pnl={realized_pnl}"
            )

            # STEP 1: ALWAYS unblock margin
            WalletService.unblock_coins(
                user=trade.user,
                amount=margin_to_release,
                description=f"FUTURES PARTIAL: Release margin for {quantity} {trade.asset_symbol}",
            )

            # STEP 2: Handle P&L
            if realized_pnl > 0:
                WalletService.credit_coins(
                    user=trade.user,
                    amount=realized_pnl,
                    description=f"FUTURES PARTIAL PROFIT: {quantity} {trade.asset_symbol} (+{realized_pnl})",
                )
            elif realized_pnl < 0:
                loss_amount = abs(realized_pnl)
                current_balance = WalletService.get_balance(trade.user)

                if current_balance >= loss_amount:
                    WalletService.deduct_coins(
                        user=trade.user,
                        amount=loss_amount,
                        description=f"FUTURES PARTIAL LOSS: {quantity} {trade.asset_symbol} (-{loss_amount})",
                    )
                else:
                    if current_balance > 0:
                        WalletService.deduct_coins(
                            user=trade.user,
                            amount=current_balance,
                            description=f"FUTURES PARTIAL LOSS: {quantity} {trade.asset_symbol} (capped)",
                        )
                    logger.warning(
                        f"Insufficient balance for full loss. Loss: {loss_amount}, Available: {current_balance}"
                    )

        elif trade.trade_type == "OPTIONS":
            # OPTIONS PARTIAL CLOSE - CORRECTED
            current_value = price * quantity
            premium_per_unit = trade.total_invested / trade.total_quantity
            premium_paid = premium_per_unit * quantity
            realized_pnl = current_value - premium_paid

            logger.info(
                f"OPTIONS PARTIAL: current_value={current_value}, premium_paid={premium_paid}, pnl={realized_pnl}"
            )

            # Credit current value
            if current_value > 0:
                WalletService.credit_coins(
                    user=trade.user,
                    amount=current_value,
                    description=f"OPTIONS PARTIAL CLOSE: {quantity} {trade.asset_symbol} @ {price}",
                )

        # Update trade
        trade.remaining_quantity -= quantity
        trade.realized_pnl += realized_pnl

        if trade.remaining_quantity == 0:
            trade.status = "CLOSED"
            trade.closed_at = timezone.now()
        else:
            trade.status = "PARTIALLY_CLOSED"

        trade.save()

        # Record history
        TradeHistory.objects.create(
            trade=trade,
            user=trade.user,
            action="PARTIAL_SELL",
            order_type=data.get("order_type", "MARKET"),
            quantity=quantity,
            price=price,
            amount=quantity * price,
            realized_pnl=realized_pnl,
        )

        # Update portfolio
        portfolio, _ = Portfolio.objects.get_or_create(user=trade.user)
        portfolio.update_portfolio_metrics()

        new_balance = WalletService.get_balance(trade.user)

        logger.info(
            f"PARTIAL CLOSED: id={trade.id}, pnl={realized_pnl}, "
            f"remaining={trade.remaining_quantity}, new_balance={new_balance}"
        )

        return {
            "trade_id": str(trade.id),
            "trade_type": trade.trade_type,
            "closed_quantity": str(quantity),
            "close_price": str(price),
            "realized_pnl": str(realized_pnl),
            "remaining_quantity": str(trade.remaining_quantity),
            "status": trade.status,
            "wallet_balance": str(new_balance),
        }


# =====================================================================
# CLOSE TRADE VIEW - FULLY CORRECTED
# =====================================================================


class CloseTradeView(APIView):
    permission_classes = [IsAuthenticated, HasActiveSubscription]

    def post(self, request, trade_id):
        try:
            trade = Trade.objects.get(id=trade_id, user=request.user)
        except Trade.DoesNotExist:
            return Response({"error": "Trade not found"}, status=404)

        if trade.remaining_quantity == 0:
            return Response({"error": "Trade is already fully closed."}, status=400)

        serializer = CloseTradeSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    result = self._close_trade(trade, serializer.validated_data)
                    return Response(result)
            except ValidationError as e:
                logger.error(f"Validation error: {str(e)}")
                return Response({"error": str(e)}, status=400)
            except Exception as e:
                logger.error(f"Error closing trade: {str(e)}", exc_info=True)
                return Response({"error": str(e)}, status=400)
        return Response(serializer.errors, status=400)

    def _close_trade(self, trade, data):
        """Handle complete closing of trades - FULLY CORRECTED"""
        price = data.get("price", trade.average_price)
        quantity = trade.remaining_quantity

        logger.info(
            f"CLOSING TRADE: id={trade.id}, type={trade.trade_type}, "
            f"direction={trade.direction}, qty={quantity}, price={price}"
        )

        # Calculate P&L based on trade type
        if trade.trade_type == "SPOT":
            # SPOT CLOSE LOGIC
            if trade.direction == "BUY":
                realized_pnl = (price - trade.average_price) * quantity
                sell_value = price * quantity
                WalletService.credit_coins(
                    user=trade.user,
                    amount=sell_value,
                    description=f"Close SPOT BUY: {quantity} {trade.asset_symbol} @ {price}",
                )
            else:
                # SHORT
                realized_pnl = (trade.average_price - price) * quantity
                collateral = trade.total_invested
                total_return = collateral + realized_pnl
                if total_return > 0:
                    WalletService.unblock_coins(
                        user=trade.user,
                        amount=total_return,
                        description=f"Close SPOT SHORT: {quantity} {trade.asset_symbol}",
                    )

        elif trade.trade_type == "FUTURES":
            # FUTURES CLOSE LOGIC - CORRECTED
            margin_to_release = trade.total_invested

            if trade.direction == "BUY":
                realized_pnl = (price - trade.average_price) * quantity
            else:
                realized_pnl = (trade.average_price - price) * quantity

            logger.info(
                f"FUTURES CLOSE: margin={margin_to_release}, pnl={realized_pnl}"
            )

            # STEP 1: ALWAYS unblock margin
            WalletService.unblock_coins(
                user=trade.user,
                amount=margin_to_release,
                description=f"FUTURES CLOSE: Release margin for {quantity} {trade.asset_symbol}",
            )

            # STEP 2: Handle P&L
            if realized_pnl > 0:
                WalletService.credit_coins(
                    user=trade.user,
                    amount=realized_pnl,
                    description=f"FUTURES PROFIT: {quantity} {trade.asset_symbol} (+{realized_pnl})",
                )
            elif realized_pnl < 0:
                loss_amount = abs(realized_pnl)
                current_balance = WalletService.get_balance(trade.user)

                if current_balance >= loss_amount:
                    WalletService.deduct_coins(
                        user=trade.user,
                        amount=loss_amount,
                        description=f"FUTURES LOSS: {quantity} {trade.asset_symbol} (-{loss_amount})",
                    )
                else:
                    if current_balance > 0:
                        WalletService.deduct_coins(
                            user=trade.user,
                            amount=current_balance,
                            description=f"FUTURES LOSS: {quantity} {trade.asset_symbol} (capped)",
                        )
                    logger.warning(
                        f"Insufficient balance for full loss. Loss: {loss_amount}, Available: {current_balance}"
                    )

        elif trade.trade_type == "OPTIONS":
            # OPTIONS CLOSE LOGIC - CORRECTED
            current_value = price * quantity
            premium_paid = trade.total_invested
            realized_pnl = current_value - premium_paid

            logger.info(
                f"OPTIONS CLOSE: current_value={current_value}, premium_paid={premium_paid}, pnl={realized_pnl}"
            )

            # Credit current value
            if current_value > 0:
                WalletService.credit_coins(
                    user=trade.user,
                    amount=current_value,
                    description=f"OPTIONS CLOSE: {quantity} {trade.asset_symbol} @ {price}",
                )
            else:
                logger.info(f"OPTIONS expired worthless, no credit")

        # Update trade
        trade.remaining_quantity = Decimal("0")
        trade.realized_pnl += realized_pnl
        trade.status = "CLOSED"
        trade.closed_at = timezone.now()
        trade.save()

        # Record history
        TradeHistory.objects.create(
            trade=trade,
            user=trade.user,
            action="SELL",
            order_type=data.get("order_type", "MARKET"),
            quantity=quantity,
            price=price,
            amount=quantity * price,
            realized_pnl=realized_pnl,
        )

        # Update portfolio
        portfolio, _ = Portfolio.objects.get_or_create(user=trade.user)
        portfolio.update_portfolio_metrics()

        new_balance = WalletService.get_balance(trade.user)

        logger.info(
            f"TRADE CLOSED: id={trade.id}, pnl={realized_pnl}, new_balance={new_balance}"
        )

        return {
            "trade_id": str(trade.id),
            "trade_type": trade.trade_type,
            "closed_quantity": str(quantity),
            "close_price": str(price),
            "realized_pnl": str(realized_pnl),
            "status": trade.status,
            "wallet_balance": str(new_balance),
        }
# =====================================================================
# PORTFOLIO AND OTHER VIEWS
# =====================================================================




class PortfolioViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PortfolioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Portfolio.objects.filter(user=self.request.user)


class PortfolioSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        print(request.user, "user")
        portfolio, created = Portfolio.objects.get_or_create(user=request.user)
        portfolio.update_portfolio_metrics()

        serializer = PortfolioSerializer(portfolio)

        # ✅ ADD WALLET BALANCE TO RESPONSE
        wallet_balance = WalletService.get_balance(request.user)

        response_data = serializer.data
        response_data["wallet_balance"] = str(wallet_balance)
        response_data["total_net_worth"] = str(wallet_balance + portfolio.total_value)

        return Response(response_data)


class ActivePositionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        trades = Trade.objects.filter(
            user=request.user, status__in=["OPEN", "PARTIALLY_CLOSED"]
        ).order_by("-opened_at")

        serializer = ActivePositionSerializer(trades, many=True)
        return Response(serializer.data)


class PnLReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = PnLReportSerializer(data=request.query_params)
        if serializer.is_valid():
            period = serializer.validated_data.get("period", "today")
            trade_type = serializer.validated_data.get("trade_type")
            asset_symbol = serializer.validated_data.get("asset_symbol")

            # Calculate date range
            now = timezone.now()
            if period == "today":
                start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            elif period == "week":
                start_date = now - timedelta(days=7)
            elif period == "month":
                start_date = now - timedelta(days=30)
            elif period == "year":
                start_date = now - timedelta(days=365)

            # Build query
            query = Q(user=request.user, updated_at__gte=start_date)
            if trade_type:
                query &= Q(trade_type=trade_type)
            if asset_symbol:
                query &= Q(asset_symbol=asset_symbol)

            trades = Trade.objects.filter(query)

            # Calculate metrics
            total_realized_pnl = trades.aggregate(Sum("realized_pnl"))[
                "realized_pnl__sum"
            ] or Decimal("0")
            total_unrealized_pnl = trades.filter(
                status__in=["OPEN", "PARTIALLY_CLOSED"]
            ).aggregate(Sum("unrealized_pnl"))["unrealized_pnl__sum"] or Decimal("0")

            # Get trade history for the period
            history = TradeHistory.objects.filter(
                user=request.user, created_at__gte=start_date
            ).order_by("-created_at")

            if trade_type:
                history = history.filter(trade__trade_type=trade_type)
            if asset_symbol:
                history = history.filter(trade__asset_symbol=asset_symbol)

            return Response(
                {
                    "period": period,
                    "start_date": str(start_date),
                    "total_realized_pnl": str(total_realized_pnl),
                    "total_unrealized_pnl": str(total_unrealized_pnl),
                    "total_pnl": str(total_realized_pnl + total_unrealized_pnl),
                    "trade_count": trades.count(),
                    "recent_trades": TradeHistorySerializer(
                        history[:10], many=True
                    ).data,
                }
            )

        return Response(serializer.errors, status=400)


class TradeHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        history = TradeHistory.objects.filter(user=request.user).order_by("-created_at")

        # Filter by trade type if provided
        trade_type = request.query_params.get("trade_type")
        if trade_type:
            history = history.filter(trade__trade_type=trade_type)

        # Filter by asset if provided
        asset_symbol = request.query_params.get("asset_symbol")
        if asset_symbol:
            history = history.filter(trade__asset_symbol=asset_symbol)

        # Pagination
        page_size = int(request.query_params.get("page_size", 20))
        page = int(request.query_params.get("page", 1))
        start = (page - 1) * page_size
        end = start + page_size

        paginated_history = history[start:end]
        serializer = TradeHistorySerializer(paginated_history, many=True)

        return Response(
            {
                "results": serializer.data,
                "count": history.count(),
                "page": page,
                "page_size": page_size,
            }
        )


class TradeDetailHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, trade_id):
        try:
            trade = Trade.objects.get(id=trade_id, user=request.user)
        except Trade.DoesNotExist:
            return Response({"error": "Trade not found"}, status=404)

        history = TradeHistory.objects.filter(trade=trade).order_by("-created_at")
        serializer = TradeHistorySerializer(history, many=True)

        return Response(
            {
                "trade_id": str(trade.id),
                "asset_symbol": trade.asset_symbol,
                "trade_type": trade.trade_type,
                "history": serializer.data,
            }
        )


class UpdatePricesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UpdatePricesSerializer(data=request.data)
        if serializer.is_valid():
            prices = serializer.validated_data["prices"]

            updated_trades = []
            for symbol, price in prices.items():
                trades = Trade.objects.filter(
                    user=request.user,
                    asset_symbol=symbol,
                    status__in=["OPEN", "PARTIALLY_CLOSED"],
                )

                for trade in trades:
                    old_pnl = trade.unrealized_pnl
                    new_pnl = trade.calculate_unrealized_pnl(price)
                    updated_trades.append(
                        {
                            "trade_id": str(trade.id),
                            "symbol": symbol,
                            "old_pnl": str(old_pnl),
                            "new_pnl": str(new_pnl),
                            "price": str(price),
                        }
                    )

            # Update portfolio
            portfolio, created = Portfolio.objects.get_or_create(user=request.user)
            portfolio.update_portfolio_metrics()

            wallet_balance = WalletService.get_balance(request.user)

            return Response(
                {
                    "updated_trades": updated_trades,
                    "portfolio_value": str(portfolio.total_value),
                    "wallet_balance": str(wallet_balance),
                }
            )

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
            position_value = data["quantity"] * data["price"]
            leverage = data.get("leverage", Decimal("1"))
            margin_required = position_value / leverage

            # ✅ CHECK WALLET BALANCE
            wallet_balance = WalletService.get_balance(request.user)

            # Risk checks
            risks = []
            warnings = []

            # Check balance
            if margin_required > wallet_balance:
                risks.append(
                    f"Insufficient balance. Need: {margin_required}, Available: {wallet_balance}"
                )

            # Check position concentration
            existing_exposure = Trade.objects.filter(
                user=request.user,
                asset_symbol=data["asset_symbol"],
                status__in=["OPEN", "PARTIALLY_CLOSED"],
            ).aggregate(Sum("total_invested"))["total_invested__sum"] or Decimal("0")

            new_total_exposure = existing_exposure + margin_required
            concentration_pct = Decimal("0")

            if portfolio.total_value > 0:
                concentration_pct = (new_total_exposure / portfolio.total_value) * 100
                if concentration_pct > 25:
                    warnings.append(
                        f"High concentration: {concentration_pct:.1f}% in {data['asset_symbol']}"
                    )

            # Check leverage limits
            if leverage > 10:
                risks.append(f"Leverage {leverage}x exceeds maximum allowed (10x)")

            # Check daily trade limit
            today_trades = TradeHistory.objects.filter(
                user=request.user,
                created_at__gte=timezone.now().replace(hour=0, minute=0, second=0),
            ).count()

            if today_trades >= 50:
                warnings.append("Approaching daily trade limit")

            return Response(
                {
                    "allowed": len(risks) == 0,
                    "risks": risks,
                    "warnings": warnings,
                    "position_value": str(position_value),
                    "margin_required": str(margin_required),
                    "concentration_percentage": str(concentration_pct),
                    "wallet_balance": str(wallet_balance),
                }
            )

        return Response(serializer.errors, status=400)


"""
this below is the api for fetchng the trades quatity while placing the order in the chart page 
"""

class GetOpenTradeBySymbol(APIView):
    """
    API View to get a specific open or partially closed trade by asset_symbol for authenticated user.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        POST: Check if user has an open or partially closed trade for given asset_symbol
        Body: {"asset_symbol": "abhjj"}
        """
        asset_symbol = request.data.get("asset_symbol")

        if not asset_symbol:
            return Response(
                {
                    "error": "asset_symbol is required",
                    "message": "Please provide asset_symbol in request body",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the open or partially closed trade for this symbol
        trade = Trade.objects.filter(
            user=request.user,
            asset_symbol=asset_symbol,
            status__in=["OPEN", "PARTIALLY_CLOSED"],
        ).first()

        if not trade:
            return Response(
                {
                    "message": f"No open or partially closed trade found for {asset_symbol}",
                    "asset_symbol": asset_symbol,
                    "status": "not_found",
                    "is_open": False,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TradeSerializer(trade)
        return Response(
            {
                "message": f"Trade found for {asset_symbol}",
                "asset_symbol": asset_symbol,
                "status": "found",
                "is_open": True,
                "trade": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def get(self, request):
        """
        GET: Check using query parameter
        URL: /api/trade/open/?asset_symbol=abhjj
        """
        asset_symbol = request.query_params.get("asset_symbol")

        if not asset_symbol:
            return Response(
                {"error": "asset_symbol query parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        trade = Trade.objects.filter(
            user=request.user,
            asset_symbol=asset_symbol,
            status__in=["OPEN", "PARTIALLY_CLOSED"],
        ).first()

        if not trade:
            return Response(
                {
                    "message": f"No open or partially closed trade found for {asset_symbol}",
                    "asset_symbol": asset_symbol,
                    "is_open": False,
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TradeSerializer(trade)
        return Response(
            {
                "message": f"Trade found for {asset_symbol}",
                "is_open": True,
                "trade": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# class GetOpenTradeBySymbol(APIView):
#     """
#     API View to get a specific open trade by asset_symbol for authenticated user.
#     """

#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         """
#         POST: Check if user has an open trade for given asset_symbol
#         Body: {"asset_symbol": "abhjj"}
#         """
#         asset_symbol = request.data.get("asset_symbol")

#         if not asset_symbol:
#             return Response(
#                 {
#                     "error": "asset_symbol is required",
#                     "message": "Please provide asset_symbol in request body",
#                 },
#                 status=status.HTTP_400_BAD_REQUEST,
#             )

#         # Get the open trade for this symbol
#         trade = Trade.objects.filter(
#             user=request.user, asset_symbol=asset_symbol, status="OPEN"
#         ).first()

#         if not trade:
#             return Response(
#                 {
#                     "message": f"No open trade found for {asset_symbol}",
#                     "asset_symbol": asset_symbol,
#                     "status": "not_found",
#                     "is_open": False,
#                 },
#                 status=status.HTTP_404_NOT_FOUND,
#             )

#         serializer = TradeSerializer(trade)
#         return Response(
#             {
#                 "message": f"Open trade found for {asset_symbol}",
#                 "asset_symbol": asset_symbol,
#                 "status": "found",
#                 "is_open": True,
#                 "trade": serializer.data,
#             },
#             status=status.HTTP_200_OK,
#         )

#     def get(self, request):
#         """
#         GET: Check using query parameter
#         URL: /api/trade/open/?asset_symbol=abhjj
#         """
#         asset_symbol = request.query_params.get("asset_symbol")

#         if not asset_symbol:
#             return Response(
#                 {"error": "asset_symbol query parameter is required"},
#                 status=status.HTTP_400_BAD_REQUEST,
#             )

#         trade = Trade.objects.filter(
#             user=request.user, asset_symbol=asset_symbol, status="OPEN"
#         ).first()

#         if not trade:
#             return Response(
#                 {
#                     "message": f"No open trade found for {asset_symbol}",
#                     "asset_symbol": asset_symbol,
#                     "is_open": False,
#                 },
#                 status=status.HTTP_404_NOT_FOUND,
#             )

#         serializer = TradeSerializer(trade)
#         return Response(
#             {
#                 "message": f"Open trade found for {asset_symbol}",
#                 "is_open": True,
#                 "trade": serializer.data,
#             },
#             status=status.HTTP_200_OK,
#         )







"""
this is for automated margin calulation websocket management 
"""

# views.py - Additional API endpoints
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Trade, FuturesDetails


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_margin_status(request, trade_id):
    """Get current margin status for a futures trade"""
    trade = get_object_or_404(
        Trade.objects.select_related('futures_details'),
        id=trade_id,
        user=request.user,
        trade_type='FUTURES'
    )
    
    if not hasattr(trade, 'futures_details'):
        return Response(
            {'error': 'No futures details found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    futures_details = trade.futures_details
    current_price = trade.current_price or trade.average_price
    
    # Calculate current margin
    if trade.direction == 'BUY':
        pnl = (current_price - trade.average_price) * trade.remaining_quantity
    else:
        pnl = (trade.average_price - current_price) * trade.remaining_quantity
    
    remaining_margin = futures_details.margin_used + pnl
    margin_call_threshold = futures_details.margin_required * Decimal('0.2')
    margin_percentage = (remaining_margin / futures_details.margin_required) * 100 if futures_details.margin_required > 0 else Decimal('0')
    
    return Response({
        'trade_id': str(trade.id),
        'symbol': trade.asset_symbol,
        'status': trade.status,
        'direction': trade.direction,
        'leverage': str(futures_details.leverage),
        'entry_price': str(trade.average_price),
        'current_price': str(current_price),
        'quantity': str(trade.remaining_quantity),
        'margin_required': str(futures_details.margin_required),
        'margin_used': str(futures_details.margin_used),
        'remaining_margin': str(remaining_margin),
        'margin_call_threshold': str(margin_call_threshold),
        'margin_percentage': str(margin_percentage),
        'unrealized_pnl': str(trade.unrealized_pnl),
        'realized_pnl': str(trade.realized_pnl),
        'is_at_risk': remaining_margin <= margin_call_threshold,
        'is_critical': remaining_margin <= margin_call_threshold * Decimal('0.5')
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_positions(request):
    """Get all active positions with current prices and margins"""
    trades = Trade.objects.filter(
        user=request.user,
        status__in=['OPEN', 'PARTIALLY_CLOSED']
    ).select_related('futures_details', 'options_details').order_by('-opened_at')
    
    positions = []
    for trade in trades:
        position = {
            'id': str(trade.id),
            'symbol': trade.asset_symbol,
            'type': trade.trade_type,
            'direction': trade.direction,
            'quantity': str(trade.remaining_quantity),
            'entry_price': str(trade.average_price),
            'current_price': str(trade.current_price) if trade.current_price else str(trade.average_price),
            'unrealized_pnl': str(trade.unrealized_pnl),
            'realized_pnl': str(trade.realized_pnl),
            'total_pnl': str(trade.total_pnl),
            'pnl_percentage': str(trade.pnl_percentage),
            'opened_at': trade.opened_at.isoformat(),
            'status': trade.status
        }
        
        if trade.trade_type == 'FUTURES' and hasattr(trade, 'futures_details'):
            futures = trade.futures_details
            
            # Calculate margin status
            if trade.direction == 'BUY':
                pnl = (trade.current_price - trade.average_price) * trade.remaining_quantity if trade.current_price else Decimal('0')
            else:
                pnl = (trade.average_price - trade.current_price) * trade.remaining_quantity if trade.current_price else Decimal('0')
            
            remaining_margin = futures.margin_used + pnl
            margin_percentage = (remaining_margin / futures.margin_required) * 100 if futures.margin_required > 0 else Decimal('0')
            
            position['leverage'] = str(futures.leverage)
            position['margin_used'] = str(futures.margin_used)
            position['remaining_margin'] = str(remaining_margin)
            position['margin_percentage'] = str(margin_percentage)
            position['is_at_risk'] = remaining_margin <= futures.margin_required * Decimal('0.2')
        
        elif trade.trade_type == 'OPTIONS' and hasattr(trade, 'options_details'):
            options = trade.options_details
            position['option_type'] = options.option_type
            position['strike_price'] = str(options.strike_price)
            position['expiry_date'] = options.expiry_date.isoformat()
            position['premium'] = str(options.premium)
        
        positions.append(position)
    
    return Response({
        'positions': positions,
        'total_positions': len(positions)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def websocket_status(request):
    """Get WebSocket connection status"""
    from .websocket_manager import ws_manager
    
    return Response({
        'connected': ws_manager.websocket is not None and ws_manager.running,
        'subscribed_symbols': list(ws_manager.subscribed_symbols),
        'total_subscriptions': len(ws_manager.subscribed_symbols)
    })

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

#         if trade.remaining_quantity == 0:
#             return Response({'error': 'Trade is already fully closed.'}, status=400)

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
