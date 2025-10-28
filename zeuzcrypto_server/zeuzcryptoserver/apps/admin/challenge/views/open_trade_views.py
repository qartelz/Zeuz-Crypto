# ==================== FILE: apps/admin/challenge/views/open_trade_views.py ====================

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db.models import Q
from apps.admin.challenge.models.trade_models import ChallengeTrade
from apps.admin.challenge.serializers.open_trade_serializers import ChallengeTradeSerializer
# from apps.challenges.models.challenge_models import UserChallengeParticipation
from apps.admin.challenge.models.challenge_models import UserChallengeParticipation

class TradeBySymbolView(APIView):
    """
    Authenticated view:
    Returns open and partially closed trades for the logged-in user,
    filtered by asset symbol, week, and trade type (spot/futures/options).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, symbol):
        user = request.user
        week_id = request.query_params.get('week_id')
        trade_type = request.query_params.get('trade_type')  # SPOT / FUTURES / OPTIONS

        # Validate required fields
        if not week_id:
            return Response({"error": "week_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate week participation for this user
        try:
            participation = UserChallengeParticipation.objects.get(user=user, week_id=week_id)
        except UserChallengeParticipation.DoesNotExist:
            return Response({"error": "User not participating in this week."}, status=status.HTTP_404_NOT_FOUND)

        # Base queryset for the user's trades for this participation and symbol
        trades = (
            ChallengeTrade.objects.filter(
                participation=participation,
                asset_symbol=symbol,
            )
            .select_related('wallet', 'futures_details', 'options_details')
        )

        # Filter by trade type if provided
        if trade_type:
            trade_type = trade_type.upper()
            if trade_type in ['SPOT', 'FUTURES', 'OPTIONS']:
                trades = trades.filter(trade_type=trade_type)
            else:
                return Response({"error": "Invalid trade_type. Must be SPOT, FUTURES, or OPTIONS."}, status=status.HTTP_400_BAD_REQUEST)

        # Filter for OPEN and PARTIALLY_CLOSED trades
        open_and_partial_trades = trades.filter(Q(status='OPEN') | Q(status='PARTIALLY_CLOSED'))

        data = {
            "user_id": user.id,
            "symbol": symbol,
            "week_id": week_id,
            "trade_type": trade_type or "ALL",
            "open_and_partial_trades": ChallengeTradeSerializer(open_and_partial_trades, many=True).data,
        }

        return Response(data, status=status.HTTP_200_OK)



# # views.py
# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from django.db.models import Q
# from apps.admin.challenge.models.trade_models import ChallengeTrade
# from apps.admin.challenge.serializers.open_trade_serializers import ChallengeTradeSerializer
# from rest_framework import status, permissions
# class TradeBySymbolView(APIView):
#     """
#     Authenticated view:
#     Returns open and partially closed trades for the logged-in user,
#     filtered by asset symbol.
#     """
#     permission_classes = [permissions.IsAuthenticated]  # ✅ Require login / valid token

#     def get(self, request, symbol):
#         print("vejfkhvbefjhkvbnrjhvbrjhvnrjv")
#         trades = (
#             ChallengeTrade.objects
#             .filter(user=request.user, asset_symbol=symbol)
#             .select_related('wallet', 'futures_details', 'options_details')
#         )

#         # Filter for OPEN and PARTIALLY_CLOSED trades
#         open_and_partial_trades = trades.filter(Q(status='OPEN') | Q(status='PARTIALLY_CLOSED'))

#         data = {
#             "user": request.user.id,
#             "symbol": symbol,
#             "open_and_partial_trades": ChallengeTradeSerializer(open_and_partial_trades, many=True).data,
#         }

#         return Response(data, status=status.HTTP_200_OK)

