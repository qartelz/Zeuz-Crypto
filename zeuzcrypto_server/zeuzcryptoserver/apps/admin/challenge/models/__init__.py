# ==================== FILE: apps/admin/challenge/models/__init__.py ====================

from apps.admin.challenge.models.challenge_models import (
    ChallengeProgram,
    ChallengeWeek,
    ChallengeTask,
    ChallengeReward,
    UserChallengeParticipation,
    ChallengeTaskCompletion,
    ChallengeStatistics,
)

from apps.admin.challenge.models.wallet_models import (
    ChallengeWallet,
    ChallengeWalletTransaction,
)

from apps.admin.challenge.models.trade_models import (
    ChallengeTrade,
    ChallengeFuturesDetails,
    ChallengeOptionsDetails,
    ChallengeTradeHistory,
)

from apps.admin.challenge.models.analytics_models import (
    ChallengeTradeAnalytics,
    ChallengeScore,
    ChallengeLeaderboard,
)

from apps.admin.challenge.models.reward_models import (
    UserChallengeReward,
    ChallengeRewardDistribution,
)

__all__ = [
    "ChallengeProgram",
    "ChallengeWeek",
    "ChallengeTask",
    "ChallengeReward",
    "UserChallengeParticipation",
    "ChallengeTaskCompletion",
    "ChallengeStatistics",
    "ChallengeWallet",
    "ChallengeWalletTransaction",
    "ChallengeTrade",
    "ChallengeFuturesDetails",
    "ChallengeOptionsDetails",
    "ChallengeTradeHistory",
    "ChallengeTradeAnalytics",
    "ChallengeScore",
    "ChallengeLeaderboard",
    "UserChallengeReward",
    "ChallengeRewardDistribution",
]
