from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from ..models import Trade, Portfolio

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_margin_status(request, trade_id):
    """Get margin status for a specific trade"""
    try:
        trade = Trade.objects.get(id=trade_id, user=request.user)
        if hasattr(trade, 'futures_details'):
            futures = trade.futures_details
            return Response({
                'margin_used': str(futures.margin_used),
                'margin_required': str(futures.margin_required),
                'leverage': futures.leverage,
                'liquidation_price': str(futures.liquidation_price),
                'margin_ratio': str(futures.margin_ratio),
                'status': 'HEALTHY' if futures.margin_ratio < 0.8 else 'WARNING'
            })
        return Response({'error': 'Not a futures trade'}, status=status.HTTP_400_BAD_REQUEST)
    except Trade.DoesNotExist:
        return Response({'error': 'Trade not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_positions(request):
    """Get all active trading positions"""
    try:
        portfolio = Portfolio.objects.get(user=request.user)
        active_trades = Trade.objects.filter(
            user=request.user,
            status__in=['OPEN', 'PARTIALLY_CLOSED']
        ).select_related('futures_details', 'options_details')
        
        positions = []
        for trade in active_trades:
            position = {
                'id': str(trade.id),
                'symbol': trade.asset_symbol,
                'type': trade.trade_type,
                'side': trade.side,
                'quantity': str(trade.total_quantity),
                'entry_price': str(trade.average_price),
                'current_price': str(trade.current_price),
                'unrealized_pnl': str(trade.unrealized_pnl),
                'pnl_percentage': str(trade.pnl_percentage)
            }
            
            if hasattr(trade, 'futures_details'):
                position.update({
                    'leverage': trade.futures_details.leverage,
                    'margin_used': str(trade.futures_details.margin_used),
                    'liquidation_price': str(trade.futures_details.liquidation_price)
                })
            
            positions.append(position)
        
        return Response({
            'positions': positions,
            'total_margin_used': str(portfolio.margin_used),
            'available_margin': str(portfolio.available_margin)
        })
    except Portfolio.DoesNotExist:
        return Response({'error': 'Portfolio not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def websocket_status(request):
    """Check WebSocket connection status"""
    from ..websocket_manager import ws_manager
    
    status_info = {
        'connected': ws_manager.is_connected(),
        'subscribed_symbols': ws_manager.get_subscribed_symbols(),
        'last_heartbeat': ws_manager.last_heartbeat_time.isoformat() if ws_manager.last_heartbeat_time else None,
        'connection_attempts': ws_manager.connection_attempts
    }
    
    return Response(status_info)
