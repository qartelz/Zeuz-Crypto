# """Utility functions for challenge analytics"""
# from decimal import Decimal
# from django.db.models import Sum, Avg, Count, Q
# from .models import *
# from app


# def recalculate_analytics(participation_id):
#     """
#     Recalculate all analytics for a participation
    
#     Args:
#         participation_id: UUID of participation
        
#     Returns:
#         ChallengeTradeAnalytics instance
#     """
    
#     participation = UserChallengeParticipation.objects.get(id=participation_id)
#     wallet = participation.wallet
    
#     # Get or create analytics
#     analytics, created = ChallengeTradeAnalytics.objects.get_or_create(
#         participation=participation,
#         user=participation.user,
#         defaults={'initial_portfolio_value': wallet.initial_balance}
#     )
    
#     # Get all trades
#     trades = ChallengeTrade.objects.filter(participation=participation)
    
#     # Trade statistics
#     analytics.total_trades = trades.count()
#     analytics.open_trades = trades.filter(status='OPEN').count()
#     analytics.closed_trades = trades.filter(status='CLOSED').count()
    
#     # Profitable vs losing trades
#     closed_trades = trades.filter(status='CLOSED')
#     analytics.profitable_trades = closed_trades.filter(realized_pnl__gt=0).count()
#     analytics.losing_trades = closed_trades.filter(realized_pnl__lt=0).count()
    
#     # Trade type breakdown
#     analytics.spot_trades = trades.filter(trade_type='SPOT').count()
#     analytics.futures_trades = trades.filter(trade_type='FUTURES').count()
#     analytics.options_trades = trades.filter(trade_type='OPTIONS').count()
    
#     # P&L metrics
#     pnl_data = trades.aggregate(
#         total_realized=Sum('realized_pnl'),
#         total_unrealized=Sum('unrealized_pnl')
#     )
#     analytics.total_realized_pnl = pnl_data['total_realized'] or Decimal('0')
#     analytics.total_unrealized_pnl = pnl_data['total_unrealized'] or Decimal('0')
    
#     # Win rate
#     if analytics.closed_trades > 0:
#         analytics.win_rate = (analytics.profitable_trades / analytics.closed_trades) * 100
#     else:
#         analytics.win_rate = Decimal('0')
    
#     # Profit factor
#     total_profits = closed_trades.filter(realized_pnl__gt=0).aggregate(
#         Sum('realized_pnl')
#     )['realized_pnl__sum'] or Decimal('0')
#     total_losses = abs(closed_trades.filter(realized_pnl__lt=0).aggregate(
#         Sum('realized_pnl')
#     )['realized_pnl__sum'] or Decimal('0'))
    
#     if total_losses > 0:
#         analytics.profit_factor = total_profits / total_losses
#     else:
#         analytics.profit_factor = total_profits if total_profits > 0 else Decimal('0')
    
#     # Portfolio metrics
#     analytics.initial_portfolio_value = wallet.initial_balance
#     analytics.current_portfolio_value = wallet.total_balance
    
#     if analytics.initial_portfolio_value > 0:
#         analytics.portfolio_return_percentage = (
#             (analytics.current_portfolio_value - analytics.initial_portfolio_value) /
#             analytics.initial_portfolio_value
#         ) * 100
    
#     # Capital allocation metrics
#     allocation_data = trades.aggregate(
#         avg_allocation=Avg('allocation_percentage'),
#         max_allocation=Max('allocation_percentage')
#     )
#     analytics.average_allocation_per_trade = allocation_data['avg_allocation'] or Decimal('0')
#     analytics.max_allocation_per_trade = allocation_data['max_allocation'] or Decimal('0')
    
#     # Calculate scores
#     analytics.pnl_score = _calculate_pnl_score(analytics.portfolio_return_percentage)
#     analytics.money_management_score = _calculate_mm_score(analytics.win_rate, analytics.profit_factor)
#     analytics.capital_allocation_score = _calculate_ca_score(analytics.average_allocation_per_trade)
    
#     # Calculate total score (weighted average)
#     analytics.total_score = (
#         (analytics.pnl_score * Decimal('0.6')) +
#         (analytics.money_management_score * Decimal('0.25')) +
#         (analytics.capital_allocation_score * Decimal('0.15'))
#     )
    
#     # Assign behavioral tag
#     analytics.behavioral_tag = _get_behavioral_tag(analytics.total_score)
    
#     analytics.save()
    
#     return analytics


# def _calculate_pnl_score(return_pct):
#     """Calculate P&L score (0-10)"""
#     if return_pct >= Decimal('50'):
#         return Decimal('10')
#     elif return_pct >= Decimal('30'):
#         return Decimal('9')
#     elif return_pct >= Decimal('20'):
#         return Decimal('8')
#     elif return_pct >= Decimal('15'):
#         return Decimal('7')
#     elif return_pct >= Decimal('10'):
#         return Decimal('6')
#     elif return_pct >= Decimal('5'):
#         return Decimal('5')
#     elif return_pct >= Decimal('0'):
#         return Decimal('4')
#     elif return_pct >= Decimal('-5'):
#         return Decimal('3')
#     elif return_pct >= Decimal('-10'):
#         return Decimal('2')
#     elif return_pct >= Decimal('-20'):
#         return Decimal('1')
#     else:
#         return Decimal('0')


# def _calculate_mm_score(win_rate, profit_factor):
#     """Calculate money management score (0-10)"""
#     score = Decimal('0')
    
#     # Win rate component (0-5 points)
#     if win_rate >= Decimal('70'):
#         score += Decimal('5')
#     elif win_rate >= Decimal('60'):
#         score += Decimal('4')
#     elif win_rate >= Decimal('50'):
#         score += Decimal('3')
#     elif win_rate >= Decimal('40'):
#         score += Decimal('2')
#     else:
#         score += Decimal('1')
    
#     # Profit factor component (0-5 points)
#     if profit_factor >= Decimal('2.5'):
#         score += Decimal('5')
#     elif profit_factor >= Decimal('2.0'):
#         score += Decimal('4')
#     elif profit_factor >= Decimal('1.5'):
#         score += Decimal('3')
#     elif profit_factor >= Decimal('1.0'):
#         score += Decimal('2')
#     else:
#         score += Decimal('1')
    
#     return min(score, Decimal('10'))


# def _calculate_ca_score(avg_allocation):
#     """Calculate capital allocation score (0-10)"""
#     if Decimal('76') <= avg_allocation <= Decimal('100'):
#         return Decimal('0.5')  # Firecracker
#     elif Decimal('51') <= avg_allocation <= Decimal('75'):
#         return Decimal('3')    # Wave Hopper
#     elif Decimal('26') <= avg_allocation <= Decimal('50'):
#         return Decimal('6')    # Coin Scout
#     elif Decimal('15') <= avg_allocation <= Decimal('25'):
#         return Decimal('10')   # Byte Bouncer (Ideal)
#     elif Decimal('11') <= avg_allocation <= Decimal('14'):
#         return Decimal('9')    # Byte Bouncer
#     elif Decimal('5') <= avg_allocation <= Decimal('10'):
#         return Decimal('8')    # Byte Bouncer
#     elif Decimal('1') <= avg_allocation <= Decimal('4'):
#         return Decimal('0.25') # Too low
#     else:
#         return Decimal('0')


# def _get_behavioral_tag(total_score):
#     """Get behavioral tag based on score"""
#     if total_score >= Decimal('8'):
#         return 'Disciplined Trader ✓'
#     elif total_score >= Decimal('5'):
#         return 'Balanced Trader ⚖️'
#     elif total_score >= Decimal('2'):
#         return 'Aggressive Trader ⚡'
#     else:
#         return 'Reckless Trader ⚠️'


# def update_leaderboard(week_id):
#     """
#     Update leaderboard for a challenge week
    
#     Args:
#         week_id: UUID of challenge week
        
#     Returns:
#         Number of entries created
#     """
#     participations = UserChallengeParticipation.objects.filter(
#         week_id=week_id,
#         status='IN_PROGRESS'
#     ).select_related('user', 'analytics').order_by('-analytics__total_score')
    
#     # Clear existing entries
#     ChallengeLeaderboard.objects.filter(challenge_week_id=week_id).delete()
    
#     # Create new entries
#     leaderboard_entries = []
#     for rank, participation in enumerate(participations, start=1):
#         if hasattr(participation, 'analytics'):
#             analytics = participation.analytics
#             entry = ChallengeLeaderboard(
#                 challenge_week_id=week_id,
#                 participation=participation,
#                 user=participation.user,
#                 rank=rank,
#                 total_score=analytics.total_score,
#                 portfolio_return_percentage=analytics.portfolio_return_percentage,
#                 total_trades=analytics.total_trades,
#                 win_rate=analytics.win_rate,
#                 behavioral_tag=analytics.behavioral_tag,
#                 user_display_name=participation.user.get_full_name() or participation.user.email
#             )
#             leaderboard_entries.append(entry)
    
#     ChallengeLeaderboard.objects.bulk_create(leaderboard_entries)
    
#     return len(leaderboard_entries)


# def validate_trade_entry(wallet, entry_amount):
#     """
#     Validate trade constraints
    
#     Args:
#         wallet: ChallengeWallet instance
#         entry_amount: Decimal amount for trade
        
#     Returns:
#         tuple: (is_valid, error_dict)
#     """
#     # Check balance
#     if not wallet.check_sufficient_balance(entry_amount):
#         return False, {
#             'error': 'Insufficient balance',
#             'required': str(entry_amount),
#             'available': str(wallet.available_balance)
#         }
    
#     # Check per-trade allocation (max 30%)
#     allocation_pct = (entry_amount / wallet.initial_balance) * 100
#     if allocation_pct > 30:
#         return False, {
#             'error': 'Trade exceeds 30% allocation limit',
#             'allocation_percentage': str(allocation_pct)
#         }
    
#     # Check total locked (max 75%)
#     total_locked_after = wallet.locked_balance + entry_amount
#     total_locked_pct = (total_locked_after / wallet.initial_balance) * 100
#     if total_locked_pct > 75:
#         return False, {
#             'error': 'Total locked balance exceeds 75% limit',
#             'total_locked_percentage': str(total_locked_pct)
#         }
    
#     return True, None


# def calculate_trade_pnl(trade, exit_price, exit_quantity):
#     """
#     Calculate P&L for trade closure
    
#     Args:
#         trade: ChallengeTrade instance
#         exit_price: Decimal exit price
#         exit_quantity: Decimal quantity to close
        
#     Returns:
#         Decimal: P&L amount
#     """
#     if trade.direction == 'BUY':
#         pnl = (exit_price - trade.average_entry_price) * exit_quantity
#     else:  # SELL (short)
#         pnl = (trade.average_entry_price - exit_price) * exit_quantity
    
#     return pnl