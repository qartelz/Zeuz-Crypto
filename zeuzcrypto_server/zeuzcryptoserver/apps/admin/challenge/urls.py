# ==================== FILE: apps/challenges/urls.py ====================

from django.urls import path, include
from rest_framework.routers import DefaultRouter
# from apps.challenges.views import (
#     challenge_views,
#     wallet_views,
#     trade_views,
#     admin_views,
#     leaderboard_views
# )
from apps.admin.challenge.views import (
    challenge_views,
    wallet_views,    
    trade_views,
    admin_views,    
    leaderboard_views
)

from apps.admin.challenge.views.open_trade_views import TradeBySymbolView
router = DefaultRouter()

# Challenge endpoints
router.register(r'programs', challenge_views.ChallengeProgramViewSet, basename='program')
router.register(r'weeks', challenge_views.ChallengeWeekViewSet, basename='week')
router.register(r'tasks', challenge_views.ChallengeTaskViewSet, basename='task')
router.register(r'participations', challenge_views.UserChallengeParticipationViewSet, basename='participation')

# Wallet endpoints
router.register(r'wallets', wallet_views.ChallengeWalletViewSet, basename='wallet')

# Trade endpoints
# router.register(r'trades', trade_views.ChallengeTradeViewSet, basename='trade')
router.register(r'trades', trade_views.CompleteTradingViewSet, basename='trade')
# router.register(r'trade-analytics', trade_views.ChallengeTradeAnalyticsViewSet, basename='trade-analytics')

# Admin endpoints
router.register(r'admin/challenges', admin_views.ChallengeAdminViewSet, basename='admin-challenge')
router.register(r'admin/weeks', admin_views.ChallengeWeekAdminViewSet, basename='admin-week')

# Leaderboard endpoints
router.register(r'leaderboards', leaderboard_views.LeaderboardViewSet, basename='leaderboard')

app_name = 'challenges'

urlpatterns = [
    path('', include(router.urls)),
    path('challenge-trades/<str:symbol>/', TradeBySymbolView.as_view(), name='trades-by-symbol'),
    # this is the above scenorio 
    # http://127.0.0.1:8000/api/v1/challenges/challenge-trades/ALGO/?week_id=b5282ddb-f3ff-4a55-b398-f820697b3c2e&trade_type=SPOT
]
