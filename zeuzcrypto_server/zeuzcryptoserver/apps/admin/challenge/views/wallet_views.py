
# ==================== FILE: apps/challenges/views/wallet_views.py ====================

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.paginator import Paginator

# from apps.challenges.models import ChallengeWallet, ChallengeWalletTransaction
from apps.admin.challenge.models.wallet_models import ChallengeWallet, ChallengeWalletTransaction
# from apps.challenges.serializers.wallet_serializers import (
#     ChallengeWalletSerializer, ChallengeWalletTransactionSerializer
# )
from apps.admin.challenge.serializers.wallet_serializers import (
    ChallengeWalletSerializer, ChallengeWalletTransactionSerializer
)

class ChallengeWalletViewSet(viewsets.ReadOnlyModelViewSet):
    """Challenge wallet management"""
    serializer_class = ChallengeWalletSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ChallengeWallet.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['get'])
    def balance(self, request, pk=None):
        """Get wallet balance details"""
        wallet = self.get_object()
        return Response({
            'initial_balance': str(wallet.initial_balance),
            'available_balance': str(wallet.available_balance),
            'locked_balance': str(wallet.locked_balance),
            'earned_balance': str(wallet.earned_balance),
            'total_balance': str(wallet.total_balance),
            'current_balance': str(wallet.current_balance),
        })
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """Get wallet transaction history"""
        wallet = self.get_object()
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        transactions = wallet.transactions.all()
        
        tx_type = request.query_params.get('transaction_type')
        if tx_type:
            transactions = transactions.filter(transaction_type=tx_type)
        
        paginator = Paginator(transactions, page_size)
        page_obj = paginator.get_page(page)
        
        serializer = ChallengeWalletTransactionSerializer(page_obj, many=True)
        return Response({
            'count': paginator.count,
            'pages': paginator.num_pages,
            'current_page': page,
            'results': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def reset(self, request, pk=None):
        """Reset wallet to initial state (admin only)"""
        wallet = self.get_object()
        
        if not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        from decimal import Decimal
        wallet.reset_wallet()
        
        ChallengeWalletTransaction.objects.create(
            wallet=wallet,
            transaction_type='RESET',
            amount=wallet.initial_balance,
            balance_before=Decimal('0'),
            balance_after=wallet.total_balance,
            description='Wallet reset by admin'
        )
        
        return Response({'message': 'Wallet reset successfully'})

