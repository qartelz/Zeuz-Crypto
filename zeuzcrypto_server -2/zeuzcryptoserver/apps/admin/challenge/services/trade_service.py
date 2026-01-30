from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.db.models import Q
from apps.admin.challenge.models.challenge_models import UserChallengeParticipation
from apps.admin.challenge.models.trade_models import (
    ChallengeTrade, ChallengeTradeHistory,
    ChallengeFuturesDetails, ChallengeOptionsDetails
)

class TradeService:
    """Service for robust trade operations handling Spot, Futures, and Options"""
    
    @staticmethod
    def validate_trade_constraints(participation, investment_amount):
        """Validate trading constraints"""
        wallet = participation.wallet
        
        # Check sufficient balance
        if not wallet.check_sufficient_balance(investment_amount):
            raise ValueError(f"Insufficient balance. Current Balance: {wallet.current_balance}")
        
        # Max 30% per trade (Risk Management Rule)
        if wallet.initial_balance > 0:
            allocation_pct = (investment_amount / wallet.initial_balance) * 100
            if allocation_pct > 30:
                raise ValueError(f"Position size {allocation_pct:.2f}% exceeds limit of 30%")
            
            # Max 75% total locked
            total_locked = wallet.locked_balance + investment_amount
            total_locked_pct = (total_locked / wallet.initial_balance) * 100
            if total_locked_pct > 75:
                raise ValueError(f"Total locked {total_locked_pct:.2f}% exceeds limit of 75%")
        
        return True
    
    @classmethod
    @transaction.atomic
    def execute_trade(cls, user, trade_data):
        """
        Main entry point for all trade types.
        Routes to specific handlers based on trade_type.
        """
        participation = UserChallengeParticipation.objects.select_for_update().get(
            id=trade_data['participation_id'],
            user=user
        )
        
        trade_type = trade_data['trade_type']
        
        if trade_type == 'SPOT':
            return cls._handle_spot_trade(user, participation, trade_data)
        elif trade_type == 'FUTURES':
            return cls._handle_futures_trade(user, participation, trade_data)
        elif trade_type == 'OPTIONS':
            return cls._handle_options_trade(user, participation, trade_data)
        else:
            raise ValueError(f"Invalid trade type: {trade_type}")

    # ==================== SPOT TRADING LOGIC ====================
    
    @classmethod
    def _handle_spot_trade(cls, user, participation, trade_data):
        """
        Complete SPOT trading logic.
        - BUY: Long position (New or Average)
        - SELL: Close Long position (Partial or Full)
        - PREVENTS: Short selling in Spot
        """
        wallet = participation.wallet
        asset_symbol = trade_data['asset_symbol']
        direction = trade_data['direction']
        quantity = trade_data['total_quantity']
        price = trade_data['entry_price']
        
        # For Spot Buy: Investment = Quantity * Price
        # For Spot Sell: Logic handles unlocking, so 0 initial investment check here
        total_invested = quantity * price if direction == 'BUY' else Decimal('0')
        
        if direction == 'BUY':
            cls.validate_trade_constraints(participation, total_invested)
        
        existing_positions = ChallengeTrade.objects.filter(
            user=user,
            participation=participation,
            asset_symbol=asset_symbol,
            trade_type='SPOT',
            status__in=['OPEN', 'PARTIALLY_CLOSED']
        )
        
        # Spot logic is simpler: 
        # BUY -> Add to position (Average) or Create New
        # SELL -> Reduce position (Cover)
        
        if direction == 'SELL':
            # In Spot, you can only sell what you have (Long positions)
            long_positions = existing_positions.filter(direction='BUY')
            if not long_positions.exists():
                raise ValueError("Cannot sell Spot asset you do not own (Shorting not allowed in Spot).")
            
            # Check total holding
            total_held = sum(p.remaining_quantity for p in long_positions)
            if quantity > total_held:
                 raise ValueError(f"Insufficient funds. You hold {total_held} {asset_symbol}, but tried to sell {quantity}.")

            return cls._process_covering(user, participation, wallet, trade_data, long_positions, asset_type='SPOT')
            
        elif direction == 'BUY':
            # Check for existing Longs to average
            long_positions = existing_positions.filter(direction='BUY')
            if long_positions.exists():
                return cls._process_averaging(user, participation, wallet, trade_data, long_positions, total_invested)
            else:
                return cls._create_new_position(user, participation, wallet, trade_data, total_invested)

    # ==================== FUTURES TRADING LOGIC ====================

    @classmethod
    def _handle_futures_trade(cls, user, participation, trade_data):
        """
        FUTURES trading logic.
        - BUY: Open Long (or Close Short)
        - SELL: Open Short (or Close Long)
        - Handles Leverage & Margin
        """
        wallet = participation.wallet
        asset_symbol = trade_data['asset_symbol']
        direction = trade_data['direction']
        quantity = trade_data['total_quantity']
        price = trade_data['entry_price']
        leverage = trade_data.get('leverage', Decimal('1'))
        contract_size = trade_data.get('contract_size', Decimal('1'))
        expiry_date = trade_data.get('expiry_date')
        
        # Margin Calculation
        total_notional_value = quantity * price * contract_size
        margin_required = total_notional_value / leverage
        
        # Filter relevant positions (Same Symbol, Type, and Expiry)
        existing_positions = ChallengeTrade.objects.filter(
            user=user,
            participation=participation,
            asset_symbol=asset_symbol,
            trade_type='FUTURES',
            status__in=['OPEN', 'PARTIALLY_CLOSED']
        )
        if expiry_date:
             existing_positions = existing_positions.filter(futures_details__expiry_date=expiry_date)

        # Determine intention: Open or Close?
        opposite_direction = 'SELL' if direction == 'BUY' else 'BUY'
        opposite_positions = existing_positions.filter(direction=opposite_direction)
        
        if opposite_positions.exists():
            # COVERING rule: If opposite exists, we are closing/reducing them first
            # Note: If quantity > opposite holdings, we handle the overflow as a new position (Flip)
            return cls._process_covering(user, participation, wallet, trade_data, opposite_positions, asset_type='FUTURES', margin_required_per_unit=margin_required/quantity)
        
        else:
            # OPENING or ADDING
            cls.validate_trade_constraints(participation, margin_required)
            same_direction_positions = existing_positions.filter(direction=direction)
            if same_direction_positions.exists():
                 return cls._process_averaging(user, participation, wallet, trade_data, same_direction_positions, margin_required)
            else:
                 return cls._create_new_position(user, participation, wallet, trade_data, margin_required)

    # ==================== OPTIONS TRADING LOGIC ====================

    @classmethod
    def _handle_options_trade(cls, user, participation, trade_data):
        """
        OPTIONS trading logic.
        - BUY (Long): Pay Premium
        - SELL (Short): Receive Premium, Lock Margin
        - Matches based on: Option Type (Call/Put), Strike, Expiry
        """
        wallet = participation.wallet
        asset_symbol = trade_data['asset_symbol']
        direction = trade_data['direction']
        quantity = trade_data['total_quantity']
        premium = trade_data['premium'] # Price per unit
        option_type = trade_data['option_type'] # CALL / PUT
        strike_price = trade_data['strike_price']
        expiry_date = trade_data['expiry_date']
        
        total_premium = quantity * premium
        
        # Investment/Margin Logic
        if direction == 'BUY':
             # Long Option: Cost is the premium paid
             required_funds = total_premium
        else:
             # Short Option: Selling to open. Requires Margin.
             # Simple rule: 20% of Notional Value as Margin (Virtual rule)
             # Notional = Strike * Quantity
             notional_value = strike_price * quantity
             required_funds = notional_value * Decimal('0.20') 
        
        # Filter SPECIFIC Option contract
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
        
        # Map Trade direction to Position type
        # Trade BUY -> Position LONG
        # Trade SELL -> Position SHORT
        target_position = 'LONG' if direction == 'BUY' else 'SHORT'
        opposite_position = 'SHORT' if target_position == 'LONG' else 'LONG'
        
        opposite_existing = existing_positions.filter(options_details__position=opposite_position)
        
        if opposite_existing.exists():
            # Closing/Covering
            # Note: If Long covering Short, we pay premium but unlock margin
            # If Short covering Long, we receive premium (selling to close) 
            return cls._process_covering(user, participation, wallet, trade_data, opposite_existing, asset_type='OPTIONS', investment_per_unit=required_funds/quantity)
        else:
            # Opening
            cls.validate_trade_constraints(participation, required_funds)
            same_existing = existing_positions.filter(options_details__position=target_position)
            
            if same_existing.exists():
                 return cls._process_averaging(user, participation, wallet, trade_data, same_existing, required_funds)
            else:
                 return cls._create_new_position(user, participation, wallet, trade_data, required_funds)

    # ==================== GENERIC HELPERS ====================

    @classmethod
    def _create_new_position(cls, user, participation, wallet, trade_data, investment_amount):
        """Creates a fresh trade record and details"""
        quantity = trade_data['total_quantity']
        price = trade_data['entry_price'] # premium for options
        
        # For Options, price is premium. For others, it's asset price.
        trade = ChallengeTrade.objects.create(
            user=user,
            participation=participation,
            wallet=wallet,
            asset_symbol=trade_data['asset_symbol'],
            asset_name=trade_data.get('asset_name', ''),
            trade_type=trade_data['trade_type'],
            direction=trade_data['direction'],
            total_quantity=quantity,
            remaining_quantity=quantity,
            average_entry_price=price,
            total_invested=investment_amount,
            holding_type=trade_data.get('holding_type', 'INTRADAY'),
            status='OPEN'
        )
        
        # Create details if needed
        if trade_data['trade_type'] == 'FUTURES':
            ChallengeFuturesDetails.objects.create(
                trade=trade,
                leverage=trade_data.get('leverage', Decimal('1')),
                margin_required=investment_amount,
                expiry_date=trade_data.get('expiry_date'),
                contract_size=trade_data.get('contract_size', Decimal('1'))
            )
        elif trade_data['trade_type'] == 'OPTIONS':
             position = 'LONG' if trade_data['direction'] == 'BUY' else 'SHORT'
             ChallengeOptionsDetails.objects.create(
                trade=trade,
                option_type=trade_data['option_type'],
                position=position,
                strike_price=trade_data['strike_price'],
                expiry_date=trade_data['expiry_date'],
                premium=price
            )
             
        # Wallet Actions
        # Options Sell -> Receive Premium immediately? 
        # Usually premium is credited, but margin locked. 
        # Simplified: If writing option (SELL), we lock margin. Premium is "unrealized" profit until close?
        # Let's follow standard: Premium is CASH IN. Margin is LOCKED.
        if trade_data['trade_type'] == 'OPTIONS' and trade_data['direction'] == 'SELL':
             # Shorting Option
             premium_total = quantity * price
             wallet.add_profit(premium_total) # Cash in
             wallet.lock_coins(investment_amount) # Margin lock
        else:
             wallet.lock_coins(investment_amount)

        cls._log_history(trade, user, trade_data, investment_amount)
        cls.update_participation_metrics(participation)
        return trade

    @classmethod
    def _process_averaging(cls, user, participation, wallet, trade_data, positions, additional_investment):
        """Adds to an existing position, updating average price"""
        main_position = positions.first() # Should primarily be one consolidated position ideally, but user might have multiple
        
        quantity = trade_data['total_quantity']
        price = trade_data['entry_price']
        
        # Calculate new weighted average
        total_old_val = main_position.average_entry_price * main_position.remaining_quantity
        total_new_val = price * quantity
        
        new_total_qty = main_position.remaining_quantity + quantity
        new_avg_price = (total_old_val + total_new_val) / new_total_qty
        
        main_position.remaining_quantity = new_total_qty
        main_position.total_quantity += quantity # Update total tracked
        main_position.average_entry_price = new_avg_price
        main_position.total_invested += additional_investment
        main_position.save()
        
        if trade_data['trade_type'] == 'FUTURES' and hasattr(main_position, 'futures_details'):
             main_position.futures_details.margin_required += additional_investment
             main_position.futures_details.save()
        
        # Wallet
        if trade_data['trade_type'] == 'OPTIONS' and trade_data['direction'] == 'SELL':
             # Selling MORE options (Shorting more)
             premium_total = quantity * price
             wallet.add_profit(premium_total)
             wallet.lock_coins(additional_investment)
        else:
             wallet.lock_coins(additional_investment)
             
        cls._log_history(main_position, user, trade_data, additional_investment)
        cls.update_participation_metrics(participation)
        return main_position

    @classmethod
    def _process_covering(cls, user, participation, wallet, trade_data, opposite_positions, asset_type='SPOT', margin_required_per_unit=None, investment_per_unit=None):
        """
        Reduces/Closes opposite positions.
        - Spot: Sell to close Buy.
        - Futures: Buy to close Short, Sell to close Long.
        - Options: Buy back Short, Sell owned Long.
        """
        qty_to_process = trade_data['total_quantity']
        price = trade_data['entry_price'] # Execution price
        direction = trade_data['direction']
        
        contract_size = trade_data.get('contract_size', Decimal('1'))
        if asset_type == 'SPOT':
             contract_size = Decimal('1') 
        
        pnl_accumulated = Decimal('0')
        trades_fully_closed = []
        
        # Iterate and close logic
        for position in opposite_positions.order_by('opened_at'):
            if qty_to_process <= 0:
                break
                
            closing_qty = min(qty_to_process, position.remaining_quantity)
            
            # PnL Calculation
            # If Position was BUY (Long), and now we SELL -> (Exit - Entry)
            # If Position was SELL (Short), and now we BUY -> (Entry - Exit)
            
            if position.direction == 'BUY':
                 # Closing Long
                 trade_pnl = (price - position.average_entry_price) * closing_qty * contract_size
            else:
                 # Closing Short
                 trade_pnl = (position.average_entry_price - price) * closing_qty * contract_size
            
            # Options specific: PnL Calculation
            if asset_type == 'OPTIONS':
                # Long Option Close (Sell): PnL = (Exit Premium - Entry Premium) * Qty
                # Short Option Close (Buy): PnL = (Entry Premium - Exit Premium) * Qty
                if position.direction == 'BUY':
                    # Closing Long (Selling owned option)
                    trade_pnl = (price - position.average_entry_price) * closing_qty
                else:
                    # Closing Short (Buying back written option)
                    trade_pnl = (position.average_entry_price - price) * closing_qty

            position.remaining_quantity -= closing_qty
            position.realized_pnl += trade_pnl
            
            # Unlock logic
            funds_to_unlock = Decimal('0')
            if asset_type == 'SPOT':
                 funds_to_unlock = closing_qty * position.average_entry_price # Unlock original cost
            elif asset_type == 'FUTURES':
                 # Unlock proportional margin
                 if hasattr(position, 'futures_details'):
                      total_marg = position.futures_details.margin_required
                      funds_to_unlock = (total_marg / position.total_quantity) * closing_qty
            elif asset_type == 'OPTIONS':
                 # If we are closing a Short (Buying back), we unlock margin
                 if position.direction == 'SELL': # Short Position
                      # Proportional margin unlock
                      total_marg = position.total_invested
                      funds_to_unlock = (total_marg / position.total_quantity) * closing_qty
                 else:
                      # Closing Long (Selling owned option) - No margin to unlock, just PnL realization
                      # However, original investment (premium paid) is effectively returned plus PnL
                      # We used lock_coins for premium paid. So we unlock that amount.
                      funds_to_unlock = (position.total_invested / position.total_quantity) * closing_qty

            # Update Status
            if position.remaining_quantity == 0:
                position.status = 'CLOSED'
                position.closed_at = timezone.now()
                trades_fully_closed.append(position)
            else:
                position.status = 'PARTIALLY_CLOSED'
            position.save()
            
            # Wallet Updates
            if funds_to_unlock > 0:
                 wallet.unlock_coins(funds_to_unlock)
                 
            if trade_pnl > 0:
                 wallet.add_profit(trade_pnl)
            else:
                 wallet.deduct_loss(abs(trade_pnl))
                 
            # Log
            cls._log_history(position, user, trade_data, closing_qty * price, quantity=closing_qty, pnl=trade_pnl, is_close=True)
            
            qty_to_process -= closing_qty
            
        # Handling Overflow (Flip Position)
        if qty_to_process > 0:
             # Requirements for new position
             new_trade_data = trade_data.copy()
             new_trade_data['total_quantity'] = qty_to_process
             
             # Constraints Check & Creation
             # Re-verify logic for generic creation
             if asset_type == 'SPOT':
                  # Spot flip to Short not allowed
                  raise ValueError(f"Cannot sell more than held. Remaining {qty_to_process} {asset_symbol} rejected.")
             elif asset_type == 'FUTURES':
                  new_margin = margin_required_per_unit * qty_to_process
                  cls.validate_trade_constraints(participation, new_margin)
                  return cls._create_new_position(user, participation, wallet, new_trade_data, new_margin)
             elif asset_type == 'OPTIONS':
                  new_invest = investment_per_unit * qty_to_process
                  cls.validate_trade_constraints(participation, new_invest)
                  return cls._create_new_position(user, participation, wallet, new_trade_data, new_invest)
                  
        return opposite_positions.first() # Return last touched or None

    @staticmethod
    def _log_history(trade, user, trade_data, amount, quantity=None, pnl=Decimal('0'), is_close=False):
        action = trade_data['direction']
        if is_close:
             action = 'SELL' if trade.direction == 'BUY' else 'BUY' # Opposite action
             # Or "CLOSE_LONG", "CLOSE_SHORT" - stick to simple BUY/SELL
             
        ChallengeTradeHistory.objects.create(
            trade=trade,
            user=user,
            action=action,
            order_type=trade_data.get('order_type', 'MARKET'),
            quantity=quantity if quantity else trade_data['total_quantity'],
            price=trade_data['entry_price'], # or exit price
            amount=amount,
            realized_pnl=pnl
        )

    @staticmethod
    def update_participation_metrics(participation):
        """Update trade counts and portfolio return for participation"""
        trades = participation.trades.all()
        
        participation.total_trades = trades.count()
        participation.spot_trades = trades.filter(trade_type='SPOT').count()
        participation.futures_trades = trades.filter(trade_type='FUTURES').count()
        participation.options_trades = trades.filter(trade_type='OPTIONS').count()
        
        if hasattr(participation, 'wallet'):
            participation.current_balance = participation.wallet.current_balance
        
        participation.save()

