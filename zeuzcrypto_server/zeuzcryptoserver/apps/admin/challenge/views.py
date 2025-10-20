# from rest_framework import viewsets, status
# from rest_framework.decorators import action
# from rest_framework.response import Response
# from rest_framework.permissions import IsAuthenticated, IsAdminUser
# from django.db import transaction
# from django.shortcuts import get_object_or_404
# from django.db.models import Sum, Count, Q
# from decimal import Decimal

# from .models import *
# from .serializers import *
# from .utils import recalculate_analytics, update_leaderboard


# # ============================================================================
# # USER VIEWS - Challenge Participation & Viewing
# # ============================================================================

# class UserChallengeViewSet(viewsets.ReadOnlyModelViewSet):
#     """
#     User: View available challenges
    
#     GET /api/challenges/             - List all active challenges
#     GET /api/challenges/{id}/        - Get challenge details
#     """
#     permission_classes = [IsAuthenticated]
    
#     def get_queryset(self):
#         from apps.challenges.models import ChallengeWeek
#         return ChallengeWeek.objects.filter(
#             is_active=True,
#             start_date__lte=timezone.now(),
#             end_date__gte=timezone.now()
#         ).select_related('program')
    
#     def get_serializer_class(self):
#         from .serializers import ChallengeWeekSerializer
#         return ChallengeWeekSerializer


# # ============================================================================
# # WALLET VIEWS
# # ============================================================================

# class WalletViewSet(viewsets.ReadOnlyModelViewSet):
#     """
#     User: View wallet details
    
#     GET /api/wallets/                - List user's wallets
#     GET /api/wallets/{id}/           - Get wallet details
#     GET /api/wallets/{id}/balance/   - Get balance breakdown
#     """
#     serializer_class = ChallengeWalletSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_queryset(self):
#         return ChallengeWallet.objects.filter(
#             user=self.request.user
#         ).select_related('user', 'participation', 'participation__week')
    
#     @action(detail=True, methods=['get'])
#     def balance(self, request, pk=None):
#         """Detailed balance breakdown"""
#         wallet = self.get_object()
        
#         data = {
#             'wallet_id': str(wallet.id),
#             'initial_balance': str(wallet.initial_balance),
#             'available_balance': str(wallet.available_balance),
#             'locked_balance': str(wallet.locked_balance),
#             'earned_balance': str(wallet.earned_balance),
#             'total_balance': str(wallet.total_balance),
#             'locked_percentage': str((wallet.locked_balance / wallet.initial_balance * 100) if wallet.initial_balance > 0 else 0),
#             'earned_percentage': str((wallet.earned_balance / wallet.initial_balance * 100) if wallet.initial_balance > 0 else 0),
#             'challenge_week': wallet.participation.week.title,
#             'participation_status': wallet.participation.status,
#         }
        
#         return Response(data)
    
#     @action(detail=True, methods=['get'])
#     def transactions(self, request, pk=None):
#         """Get transaction history"""
#         wallet = self.get_object()
#         transactions = wallet.transactions.all()[:50]
#         serializer = WalletTransactionSerializer(transactions, many=True)
#         return Response(serializer.data)


# # ============================================================================
# # TRADE VIEWS - User Side
# # ============================================================================

# class TradeViewSet(viewsets.ModelViewSet):
#     """
#     User: Manage trades
    
#     GET  /api/trades/                        - List user's trades
#     POST /api/trades/place/                  - Place new trade
#     POST /api/trades/{id}/close/             - Close trade
#     POST /api/trades/{id}/update_price/      - Update current price
#     GET  /api/trades/{id}/history/           - Get trade history
#     """
#     serializer_class = ChallengeTradeSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_queryset(self):
#         queryset = ChallengeTrade.objects.filter(
#             user=self.request.user
#         ).select_related('user', 'participation', 'wallet', 'challenge_week')
        
#         # Filter by participation
#         participation_id = self.request.query_params.get('participation_id')
#         if participation_id:
#             queryset = queryset.filter(participation_id=participation_id)
        
#         # Filter by status
#         status_filter = self.request.query_params.get('status')
#         if status_filter:
#             queryset = queryset.filter(status=status_filter)
        
#         return queryset
    
#     @action(detail=False, methods=['post'])
#     @transaction.atomic
#     def place(self, request):
#         """
#         Place a new trade
        
#         Request:
#         {
#             "participation_id": "uuid",
#             "asset_symbol": "BTC",
#             "asset_name": "Bitcoin",
#             "trade_type": "SPOT",
#             "direction": "BUY",
#             "quantity": "0.5",
#             "price": "50000.00"
#         }
#         """
#         serializer = PlaceTradeSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         data = serializer.validated_data
        
#         # Get participation and wallet
#         participation = get_object_or_404(
#             UserChallengeParticipation,
#             id=data['participation_id'],
#             user=request.user
#         )
#         wallet = participation.wallet
        
#         # Calculate entry amount
#         entry_amount = data['quantity'] * data['price']
        
#         # Validate balance
#         if not wallet.check_sufficient_balance(entry_amount):
#             return Response({
#                 'error': 'Insufficient balance',
#                 'required': str(entry_amount),
#                 'available': str(wallet.available_balance)
#             }, status=status.HTTP_400_BAD_REQUEST)
        
#         # Validate allocation (max 30%)
#         allocation_pct = (entry_amount / wallet.initial_balance) * 100
#         if allocation_pct > 30:
#             return Response({
#                 'error': 'Trade exceeds 30% allocation limit',
#                 'allocation_percentage': str(allocation_pct)
#             }, status=status.HTTP_400_BAD_REQUEST)
        
#         # Validate total locked (max 75%)
#         total_locked_after = wallet.locked_balance + entry_amount
#         total_locked_pct = (total_locked_after / wallet.initial_balance) * 100
#         if total_locked_pct > 75:
#             return Response({
#                 'error': 'Total locked balance exceeds 75% limit',
#                 'total_locked_percentage': str(total_locked_pct)
#             }, status=status.HTTP_400_BAD_REQUEST)
        
#         try:
#             # Lock coins
#             wallet.lock_coins(entry_amount, f"Trade entry - {data['asset_symbol']}")
            
#             # Create trade
#             trade = ChallengeTrade.objects.create(
#                 user=request.user,
#                 participation=participation,
#                 wallet=wallet,
#                 challenge_week=participation.week,
#                 asset_symbol=data['asset_symbol'],
#                 asset_name=data.get('asset_name', ''),
#                 trade_type=data['trade_type'],
#                 direction=data['direction'],
#                 total_quantity=data['quantity'],
#                 remaining_quantity=data['quantity'],
#                 average_entry_price=data['price'],
#                 current_price=data['price'],
#                 status='OPEN'
#             )
            
#             # Create futures details if applicable
#             if data['trade_type'] == 'FUTURES':
#                 ChallengeFuturesDetails.objects.create(
#                     trade=trade,
#                     leverage=data.get('leverage', Decimal('1')),
#                     margin_required=data.get('margin_required', Decimal('0')),
#                     expiry_date=data.get('futures_expiry_date')
#                 )
            
#             # Create options details if applicable
#             if data['trade_type'] == 'OPTIONS':
#                 ChallengeOptionsDetails.objects.create(
#                     trade=trade,
#                     option_type=data.get('option_type'),
#                     position=data.get('option_position', 'LONG'),
#                     strike_price=data.get('strike_price'),
#                     expiry_date=data.get('options_expiry_date'),
#                     premium=data.get('premium', Decimal('0'))
#                 )
            
#             # Create history entry
#             ChallengeTradeHistory.objects.create(
#                 trade=trade,
#                 user=request.user,
#                 action=data['direction'],
#                 quantity=data['quantity'],
#                 price=data['price'],
#                 amount=entry_amount,
#                 realized_pnl=Decimal('0')
#             )
            
#             # Recalculate analytics
#             recalculate_analytics(participation.id)
            
#             return Response(
#                 ChallengeTradeSerializer(trade).data,
#                 status=status.HTTP_201_CREATED
#             )
            
#         except Exception as e:
#             return Response(
#                 {'error': str(e)},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
    
#     @action(detail=True, methods=['post'])
#     @transaction.atomic
#     def close(self, request, pk=None):
#         """
#         Close trade (full or partial)
        
#         Request:
#         {
#             "exit_price": "52000.00",
#             "exit_quantity": "0.5"
#         }
#         """
#         trade = self.get_object()
        
#         if trade.status not in ['OPEN', 'PARTIALLY_CLOSED']:
#             return Response(
#                 {'error': 'Trade is not open'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         serializer = CloseTradeSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
        
#         try:
#             pnl = trade.close_position(
#                 exit_price=serializer.validated_data['exit_price'],
#                 exit_quantity=serializer.validated_data['exit_quantity']
#             )
            
#             # Recalculate analytics
#             recalculate_analytics(trade.participation.id)
            
#             return Response({
#                 'message': 'Trade closed successfully',
#                 'pnl': str(pnl),
#                 'status': trade.status,
#                 'remaining_quantity': str(trade.remaining_quantity),
#                 'trade': ChallengeTradeSerializer(trade).data
#             })
            
#         except Exception as e:
#             return Response(
#                 {'error': str(e)},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
    
#     @action(detail=True, methods=['post'])
#     def update_price(self, request, pk=None):
#         """
#         Update current market price
        
#         Request:
#         {
#             "current_price": "51500.00"
#         }
#         """
#         trade = self.get_object()
        
#         serializer = UpdatePriceSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
        
#         unrealized_pnl = trade.calculate_unrealized_pnl(
#             serializer.validated_data['current_price']
#         )
        
#         return Response({
#             'message': 'Price updated successfully',
#             'current_price': str(trade.current_price),
#             'unrealized_pnl': str(unrealized_pnl),
#             'total_pnl': str(trade.total_pnl)
#         })
    
#     @action(detail=True, methods=['get'])
#     def history(self, request, pk=None):
#         """Get trade history"""
#         trade = self.get_object()
#         history = trade.history.all()
#         serializer = TradeHistorySerializer(history, many=True)
#         return Response(serializer.data)
    
#     @action(detail=False, methods=['get'])
#     def summary(self, request):
#         """
#         Get trade summary
        
#         Query params: ?participation_id=uuid
#         """
#         participation_id = request.query_params.get('participation_id')
#         if not participation_id:
#             return Response(
#                 {'error': 'participation_id is required'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         trades = self.get_queryset().filter(participation_id=participation_id)
        
#         summary = trades.aggregate(
#             total_trades=Count('id'),
#             open_trades=Count('id', filter=Q(status='OPEN')),
#             closed_trades=Count('id', filter=Q(status='CLOSED')),
#             total_realized_pnl=Sum('realized_pnl'),
#             total_unrealized_pnl=Sum('unrealized_pnl'),
#         )
        
#         summary['total_pnl'] = (summary['total_realized_pnl'] or Decimal('0')) + (summary['total_unrealized_pnl'] or Decimal('0'))
        
#         # Convert to strings
#         for key in ['total_realized_pnl', 'total_unrealized_pnl', 'total_pnl']:
#             summary[key] = str(summary[key])
        
#         return Response(summary)


# # ============================================================================
# # ANALYTICS VIEWS
# # ============================================================================

# class AnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
#     """
#     User: View analytics
    
#     GET /api/analytics/                              - List user's analytics
#     GET /api/analytics/by_participation/?id=uuid     - Get by participation
#     """
#     serializer_class = AnalyticsSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_queryset(self):
#         return ChallengeTradeAnalytics.objects.filter(
#             user=self.request.user
#         ).select_related('user', 'participation', 'participation__week')
    
#     @action(detail=False, methods=['get'])
#     def by_participation(self, request):
#         """Get analytics for participation"""
#         participation_id = request.query_params.get('id')
#         if not participation_id:
#             return Response(
#                 {'error': 'participation id is required'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         try:
#             analytics = ChallengeTradeAnalytics.objects.get(
#                 participation_id=participation_id,
#                 user=request.user
#             )
#             return Response(AnalyticsSerializer(analytics).data)
#         except ChallengeTradeAnalytics.DoesNotExist:
#             return Response(
#                 {'error': 'Analytics not found'},
#                 status=status.HTTP_404_NOT_FOUND
#             )


# # ============================================================================
# # LEADERBOARD VIEWS
# # ============================================================================

# class LeaderboardViewSet(viewsets.ReadOnlyModelViewSet):
#     """
#     User: View leaderboard
    
#     GET /api/leaderboard/?week_id=uuid&limit=50    - Get leaderboard
#     GET /api/leaderboard/my_rank/?week_id=uuid     - Get my rank
#     """
#     serializer_class = LeaderboardSerializer
#     permission_classes = [IsAuthenticated]
    
#     def get_queryset(self):
#         return ChallengeLeaderboard.objects.all().select_related(
#             'user', 'participation', 'challenge_week'
#         ).order_by('rank')
    
#     def list(self, request):
#         """Get leaderboard for week"""
#         week_id = request.query_params.get('week_id')
#         if not week_id:
#             return Response(
#                 {'error': 'week_id is required'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         limit = int(request.query_params.get('limit', 50))
#         leaderboard = self.get_queryset().filter(challenge_week_id=week_id)[:limit]
        
#         serializer = self.get_serializer(leaderboard, many=True)
#         return Response(serializer.data)
    
#     @action(detail=False, methods=['get'])
#     def my_rank(self, request):
#         """Get current user's rank"""
#         week_id = request.query_params.get('week_id')
#         if not week_id:
#             return Response(
#                 {'error': 'week_id is required'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         try:
#             entry = ChallengeLeaderboard.objects.get(
#                 challenge_week_id=week_id,
#                 user=request.user
#             )
#             return Response(LeaderboardSerializer(entry).data)
#         except ChallengeLeaderboard.DoesNotExist:
#             return Response(
#                 {'message': 'Not ranked yet'},
#                 status=status.HTTP_404_NOT_FOUND
#             )


# # ============================================================================
# # ADMIN VIEWS
# # ============================================================================

# class AdminChallengeViewSet(viewsets.ModelViewSet):
#     """
#     Admin: Manage challenges
    
#     POST /api/admin/challenges/                      - Create challenge
#     GET  /api/admin/challenges/                      - List all challenges
#     GET  /api/admin/challenges/{id}/                 - Get challenge details
#     PUT  /api/admin/challenges/{id}/                 - Update challenge
#     DELETE /api/admin/challenges/{id}/               - Delete challenge
#     """
#     permission_classes = [IsAdminUser]
    
#     def get_queryset(self):
#         from apps.admin.challenges.models import ChallengeWeek
        
#         return ChallengeWeek.objects.all().select_related('program')
    
#     def get_serializer_class(self):
#         from .serializers import ChallengeWeekSerializer
#         return ChallengeWeekSerializer


# class AdminTradeViewSet(viewsets.ModelViewSet):
#     """
#     Admin: Manage trades
    
#     POST /api/admin/trades/create/                   - Create trade for user
#     GET  /api/admin/trades/                          - List all trades
#     POST /api/admin/trades/{id}/force_close/         - Force close trade
#     """
#     permission_classes = [IsAdminUser]
#     serializer_class = ChallengeTradeSerializer
    
#     def get_queryset(self):
#         return ChallengeTrade.objects.all().select_related(
#             'user', 'participation', 'wallet', 'challenge_week'
#         )
    
#     @action(detail=False, methods=['post'])
#     @transaction.atomic
#     def create_for_user(self, request):
#         """Admin creates trade for user"""
#         serializer = PlaceTradeSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         data = serializer.validated_data
        
#         participation = get_object_or_404(
#             UserChallengeParticipation,
#             id=data['participation_id']
#         )
#         wallet = participation.wallet
#         entry_amount = data['quantity'] * data['price']
        
#         try:
#             wallet.lock_coins(entry_amount, f"Admin trade - {data['asset_symbol']}")
            
#             trade = ChallengeTrade.objects.create(
#                 user=participation.user,
#                 participation=participation,
#                 wallet=wallet,
#                 challenge_week=participation.week,
#                 asset_symbol=data['asset_symbol'],
#                 asset_name=data.get('asset_name', ''),
#                 trade_type=data['trade_type'],
#                 direction=data['direction'],
#                 total_quantity=data['quantity'],
#                 remaining_quantity=data['quantity'],
#                 average_entry_price=data['price'],
#                 current_price=data['price'],
#                 status='OPEN'
#             )
            
#             return Response(
#                 ChallengeTradeSerializer(trade).data,
#                 status=status.HTTP_201_CREATED
#             )
#         except Exception as e:
#             return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# class AdminRewardViewSet(viewsets.ModelViewSet):
#     """
#     Admin: Manage rewards
    
#     POST /api/admin/rewards/                         - Create reward
#     GET  /api/admin/rewards/                         - List rewards
#     POST /api/admin/rewards/{id}/process/            - Process reward
#     """
#     permission_classes = [IsAdminUser]
#     serializer_class = RewardDistributionSerializer
    
#     def get_queryset(self):
#         return ChallengeRewardDistribution.objects.all().select_related(
#             'user', 'participation', 'processed_by'
#         )
    
#     def get_serializer_class(self):
#         if self.action == 'create':
#             return CreateRewardSerializer
#         return RewardDistributionSerializer
    
#     @transaction.atomic
#     def create(self, request):
#         """Create reward"""
#         serializer = CreateRewardSerializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#         data = serializer.validated_data
        
#         participation = get_object_or_404(
#             UserChallengeParticipation,
#             id=data['participation_id']
#         )
        
#         reward = ChallengeRewardDistribution.objects.create(
#             user=participation.user,
#             participation=participation,
#             reward_type=data['reward_type'],
#             coin_amount=data['coin_amount'],
#             description=data['description'],
#             status='PENDING'
#         )
        
#         return Response(
#             RewardDistributionSerializer(reward).data,
#             status=status.HTTP_201_CREATED
#         )
    
#     @action(detail=True, methods=['post'])
#     def process(self, request, pk=None):
#         """Process reward"""
#         reward = self.get_object()
        
#         try:
#             reward.process_reward(processed_by=request.user)
#             return Response({
#                 'message': 'Reward processed successfully',
#                 'reward': RewardDistributionSerializer(reward).data
#             })
#         except Exception as e:
#             return Response(
#                 {'error': str(e)},
#                 status=status.HTTP_400_BAD_REQUEST
#             )


# class AdminAnalyticsViewSet(viewsets.ViewSet):
#     """
#     Admin: Analytics management
    
#     POST /api/admin/analytics/recalculate/           - Recalculate analytics
#     POST /api/admin/analytics/update_leaderboard/    - Update leaderboard
#     """
#     permission_classes = [IsAdminUser]
    
#     @action(detail=False, methods=['post'])
#     def recalculate(self, request):
#         """Recalculate analytics"""
#         participation_id = request.data.get('participation_id')
#         if not participation_id:
#             return Response(
#                 {'error': 'participation_id is required'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         try:
#             analytics = recalculate_analytics(participation_id)
#             return Response({
#                 'message': 'Analytics recalculated successfully',
#                 'total_score': str(analytics.total_score)
#             })
#         except Exception as e:
#             return Response(
#                 {'error': str(e)},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
    
#     @action(detail=False, methods=['post'])
#     def update_leaderboard(self, request):
#         """Update leaderboard"""
#         week_id = request.data.get('week_id')
#         if not week_id:
#             return Response(
#                 {'error': 'week_id is required'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
        
#         try:
#             count = update_leaderboard(week_id)
#             return Response({
#                 'message': 'Leaderboard updated successfully',
#                 'entries_created': count
#             })
#         except Exception as e:
#             return Response(
#                 {'error': str(e)},
#                 status=status.HTTP_400_BAD_REQUEST
#             )