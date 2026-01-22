from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum

from apps.admin.challenge.models.challenge_models import UserChallengeParticipation
from apps.admin.challenge.models.trade_models import ChallengeTrade
from apps.admin.challenge.models.analytics_models import ChallengeTradeAnalytics
from apps.admin.challenge.serializers.trade_serializers import (
    ChallengeTradeSerializer, ChallengeTradeAnalyticsSerializer,
    ChallengeTradeCreateSerializer, ChallengeTradeCloseSerializer,
    ChallengeTradeHistorySerializer, ChallengeTradeDetailSerializer
)   
from apps.admin.challenge.services.trade_service import TradeService


class ChallengeTradeViewSet(viewsets.ModelViewSet):
    """
    Challenge trade management ViewSet.
    Delegates complex logic to TradeService.
    """
    serializer_class = ChallengeTradeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChallengeTrade.objects.filter(user=self.request.user).order_by('-updated_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ChallengeTradeCreateSerializer
        elif self.action == 'retrieve':
            return ChallengeTradeDetailSerializer
        return ChallengeTradeSerializer
    
    def list(self, request, *args, **kwargs):
        """List user's trades with filtering"""
        queryset = self.get_queryset()
        
        participation_id = request.query_params.get('participation_id')
        if participation_id:
            queryset = queryset.filter(participation_id=participation_id)
        
        week_id = request.query_params.get('week_id')
        if week_id:
            queryset = queryset.filter(participation__week_id=week_id)

        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        trade_type = request.query_params.get('trade_type')
        if trade_type:
            queryset = queryset.filter(trade_type=trade_type)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
             serializer = self.get_serializer(page, many=True)
             return self.get_paginated_response(serializer.data)
             
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Execute a new trade (Spot, Futures, Options)"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Delegate to Service
            trade = TradeService.execute_trade(request.user, serializer.validated_data)
            response_serializer = ChallengeTradeDetailSerializer(trade)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': f'Trade execution failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close or partially close a trade manually"""
        trade = self.get_object()
        serializer = ChallengeTradeCloseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            trade = TradeService.close_trade(trade, serializer.validated_data)
            response_serializer = ChallengeTradeSerializer(trade)
            return Response(response_serializer.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Trade closure failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def update_price(self, request, pk=None):
        """Update current market price and Unrealized PnL"""
        trade = self.get_object()
        try:
            current_price = Decimal(request.data.get('current_price'))
            trade.calculate_unrealized_pnl(current_price)
            serializer = self.get_serializer(trade)
            return Response(serializer.data)
        except (ValueError, TypeError):
             return Response({'error': 'Invalid price'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get trade action history"""
        trade = self.get_object()
        history = trade.history.all().order_by('-created_at')
        serializer = ChallengeTradeHistorySerializer(history, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get comprehensive trade summary for participation"""
        participation_id = request.query_params.get('participation_id')
        
        if not participation_id:
            return Response({'error': 'participation_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            participation = UserChallengeParticipation.objects.get(
                id=participation_id,
                user=request.user
            )
            summary = TradeService.get_trade_summary(participation)
            return Response(summary)
        except UserChallengeParticipation.DoesNotExist:
            return Response({'error': 'Participation not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def auto_square_off(self, request):
        """Auto square-off all intraday positions"""
        participation_id = request.data.get('participation_id')
        if not participation_id:
             return Response({'error': 'participation_id required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
             participation = UserChallengeParticipation.objects.get(id=participation_id, user=request.user)
             squared_off_trades = TradeService.auto_square_off_intraday(participation)
             return Response({
                 'message': f'Squared off {len(squared_off_trades)} positions',
                 'trade_ids': [str(t.id) for t in squared_off_trades]
             })
        except UserChallengeParticipation.DoesNotExist:
             return Response({'error': 'Participation not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def settle_expiry(self, request, pk=None):
        """Settle futures/options on expiry"""
        trade = self.get_object()
        
        if trade.trade_type not in ['FUTURES', 'OPTIONS']:
            return Response({'error': 'Only Futures/Options can be settled'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            settlement_price = Decimal(request.data.get('settlement_price'))
            
            if trade.trade_type == 'FUTURES':
                settled_trade = TradeService.settle_futures_expiry(trade, settlement_price)
            else:
                settled_trade = TradeService.settle_options_expiry(trade, settlement_price)
            
            serializer = ChallengeTradeDetailSerializer(settled_trade)
            return Response(serializer.data)
            
        except (ValueError, TypeError):
            return Response({'error': 'Invalid settlement price'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def positions(self, request):
        """Get all open positions grouped by type and asset (Helper view)"""
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
            
            # Simple grouping logic here just for display
            positions = {}
            for trade in open_trades:
                key = f"{trade.trade_type}_{trade.asset_symbol}"
                if key not in positions:
                    positions[key] = {
                        'asset_symbol': trade.asset_symbol,
                        'trade_type': trade.trade_type,
                        'quantity': Decimal('0'),
                        'invested': Decimal('0'),
                        'trades': []
                    }
                positions[key]['quantity'] += trade.remaining_quantity
                positions[key]['invested'] += trade.total_invested
                positions[key]['trades'].append(ChallengeTradeSerializer(trade).data)
                
            return Response({'positions': list(positions.values())})
            
        except UserChallengeParticipation.DoesNotExist:
            return Response({'error': 'Participation not found'}, status=status.HTTP_404_NOT_FOUND)


class ChallengeTradeAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    """Trade analytics"""
    serializer_class = ChallengeTradeAnalyticsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChallengeTradeAnalytics.objects.filter(
            participation__user=self.request.user
        )
    
    @action(detail=False, methods=['get'])
    def participation_analytics(self, request):
        """Get analytics for specific participation"""
        participation_id = request.query_params.get('participation_id')
        
        if not participation_id:
            return Response({'error': 'participation_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            participation = UserChallengeParticipation.objects.get(
                id=participation_id,
                user=request.user
            )
            
            analytics, _ = ChallengeTradeAnalytics.objects.get_or_create(
                participation=participation
            )
            
            # Auto-recalculate if stale (optional logic)
            # analytics.recalculate() 
            
            serializer = self.get_serializer(analytics)
            return Response(serializer.data)
        except UserChallengeParticipation.DoesNotExist:
            return Response({'error': 'Participation not found'}, status=status.HTTP_404_NOT_FOUND)
