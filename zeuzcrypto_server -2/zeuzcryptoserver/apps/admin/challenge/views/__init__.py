# ==================== FILE: apps/challenges/views/__init__.py ====================

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

__all__ = [
    'challenge_views',
    'wallet_views',
    'trade_views',
    'admin_views',
    'leaderboard_views'
]

