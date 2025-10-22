
# ==================== FILE: apps/challenges/views/trade_views.py ====================

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from django.utils import timezone

# from apps.challenges.models import (
#     ChallengeTrade, ChallengeTradeAnalytics, 
#     UserChallengeParticipation
# )
from apps.admin.challenge.models.challenge_models import UserChallengeParticipation
from apps.admin.challenge.models.trade_models import ChallengeTrade
from apps.admin.challenge.models.analytics_models import ChallengeTradeAnalytics
# from apps.challenges.serializers.trade_serializers import (
#     ChallengeTradeSerializer, ChallengeTradeAnalyticsSerializer,
#     ChallengeTradeCreateSerializer, ChallengeTradeCloseSerializer,
#     ChallengeTradeHistorySerializer, ChallengeTradeDetailSerializer
# )
from apps.admin.challenge.serializers.trade_serializers import (
    ChallengeTradeSerializer, ChallengeTradeAnalyticsSerializer,
    ChallengeTradeCreateSerializer, ChallengeTradeCloseSerializer,
    ChallengeTradeHistorySerializer, ChallengeTradeDetailSerializer
)   
# from apps.challenges.services.trade_service import TradeService
from apps.admin.challenge.services.trade_service import TradeService


class ChallengeTradeViewSet(viewsets.ModelViewSet):
    """Challenge trade management"""
    serializer_class = ChallengeTradeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChallengeTrade.objects.filter(user=self.request.user)
    
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
        
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        trade_type = request.query_params.get('trade_type')
        if trade_type:
            queryset = queryset.filter(trade_type=trade_type)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Execute a new trade"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            trade = TradeService.execute_trade(request.user, serializer.validated_data)
            response_serializer = ChallengeTradeSerializer(trade)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': 'Trade execution failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """Close or partially close a trade"""
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
        """Update current market price"""
        trade = self.get_object()
        current_price = Decimal(request.data.get('current_price'))
        
        trade.calculate_unrealized_pnl(current_price)
        
        serializer = self.get_serializer(trade)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get trade action history"""
        trade = self.get_object()
        history = trade.history.all()
        
        serializer = ChallengeTradeHistorySerializer(history, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get trade summary for participation"""
        participation_id = request.query_params.get('participation_id')
        
        if not participation_id:
            return Response(
                {'error': 'participation_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            participation = UserChallengeParticipation.objects.get(
                id=participation_id,
                user=request.user
            )
            
            summary = TradeService.get_trade_summary(participation)
            return Response(summary)
        except UserChallengeParticipation.DoesNotExist:
            return Response(
                {'error': 'Participation not found'},
                status=status.HTTP_404_NOT_FOUND
            )


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
            return Response(
                {'error': 'participation_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            participation = UserChallengeParticipation.objects.get(
                id=participation_id,
                user=request.user
            )
            
            analytics, created = ChallengeTradeAnalytics.objects.get_or_create(
                participation=participation
            )
            
            from datetime import timedelta
            if timezone.now() - analytics.last_calculated_at > timedelta(minutes=5):
                analytics.recalculate()
            
            serializer = self.get_serializer(analytics)
            return Response(serializer.data)
        except UserChallengeParticipation.DoesNotExist:
            return Response(
                {'error': 'Participation not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def recalculate(self, request):
        """Force recalculate analytics"""
        participation_id = request.data.get('participation_id')
        
        if not participation_id:
            return Response(
                {'error': 'participation_id required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            participation = UserChallengeParticipation.objects.get(
                id=participation_id,
                user=request.user
            )
            
            analytics, created = ChallengeTradeAnalytics.objects.get_or_create(
                participation=participation
            )
            analytics.recalculate()
            
            serializer = self.get_serializer(analytics)
            return Response(serializer.data)
        except UserChallengeParticipation.DoesNotExist:
            return Response(
                {'error': 'Participation not found'},
                status=status.HTTP_404_NOT_FOUND
            )

