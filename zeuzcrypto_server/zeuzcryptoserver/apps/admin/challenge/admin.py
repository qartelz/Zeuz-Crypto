

# ==================== FILE: apps/challenges/admin.py ====================

from django.contrib import admin
from django.utils.html import format_html
# from apps.challenges.models import (
#     ChallengeProgram, ChallengeWeek, ChallengeTask, ChallengeReward,
#     UserChallengeParticipation, ChallengeTaskCompletion, ChallengeStatistics,
#     ChallengeWallet, ChallengeWalletTransaction,
#     ChallengeTrade, ChallengeTradeHistory,
#     ChallengeScore, ChallengeTradeAnalytics, ChallengeLeaderboard,
#     UserChallengeReward, ChallengeRewardDistribution
# )
from apps.admin.challenge.models.challenge_models import (
    ChallengeProgram, ChallengeWeek, ChallengeTask, ChallengeReward,
    UserChallengeParticipation, ChallengeTaskCompletion, ChallengeStatistics,
    ChallengeWallet, ChallengeWalletTransaction,
)   
from apps.admin.challenge.models.trade_models import (
    ChallengeTrade, ChallengeTradeHistory,)
from apps.admin.challenge.models.analytics_models import (
    ChallengeScore, ChallengeTradeAnalytics, ChallengeLeaderboard,
)
from apps.admin.challenge.models.reward_models import (
    UserChallengeReward, ChallengeRewardDistribution,
)

@admin.register(ChallengeProgram)
class ChallengeProgramAdmin(admin.ModelAdmin):
    list_display = ['name', 'difficulty', 'is_active', 'weeks_count', 'created_at']
    list_filter = ['difficulty', 'is_active', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    def weeks_count(self, obj):
        return obj.weeks.count()
    weeks_count.short_description = "Weeks"


@admin.register(ChallengeWeek)
class ChallengeWeekAdmin(admin.ModelAdmin):
    list_display = ['title', 'program', 'week_number', 'trading_type', 'is_active', 'participants_count', 'status_badge']
    list_filter = ['program', 'trading_type', 'is_active', 'start_date']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at']
    
    def participants_count(self, obj):
        count = obj.participants.count()
        completed = obj.participants.filter(status='COMPLETED').count()
        return f"{completed}/{count}"
    participants_count.short_description = "Completed/Total"
    
    def status_badge(self, obj):
        if obj.is_ongoing():
            return format_html('<span style="color: green;">🟢 Active</span>')
        elif obj.is_completed():
            return format_html('<span style="color: gray;">⚪ Completed</span>')
        else:
            return format_html('<span style="color: blue;">🔵 Upcoming</span>')
    status_badge.short_description = "Status"


@admin.register(ChallengeTask)
class ChallengeTaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'week', 'task_type', 'target_value', 'is_mandatory', 'order']
    list_filter = ['week', 'task_type', 'is_mandatory']
    search_fields = ['title', 'description']


@admin.register(ChallengeReward)
class ChallengeRewardAdmin(admin.ModelAdmin):
    list_display = ['badge_name', 'week', 'profit_bonus_coins', 'loss_recovery_coins', 'is_active']
    list_filter = ['is_active', 'week__program']
    search_fields = ['badge_name', 'week__title']


@admin.register(UserChallengeParticipation)
class UserChallengeParticipationAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'week_title', 'status', 'portfolio_return_pct', 'total_trades', 'joined_at']
    list_filter = ['status', 'week__week_number', 'joined_at']
    search_fields = ['user__email', 'week__title']
    readonly_fields = ['joined_at', 'completed_at']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "User"
    
    def week_title(self, obj):
        return obj.week.title
    week_title.short_description = "Week"


@admin.register(ChallengeWallet)
class ChallengeWalletAdmin(admin.ModelAdmin):
    list_display = [
        'user_email', 'week_title', 'initial_balance_display',
        'available_balance_display', 'locked_balance_display',
        'earned_balance_display', 'total_balance_display', 'is_active'
    ]
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__email', 'participation__week__title']
    readonly_fields = ['created_at', 'updated_at']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "User"
    
    def week_title(self, obj):
        return obj.participation.week.title
    week_title.short_description = "Week"
    
    def initial_balance_display(self, obj):
        return format_html(f'<span style="color: blue;">${obj.initial_balance:,.2f}</span>')
    initial_balance_display.short_description = "Initial"
    
    def available_balance_display(self, obj):
        color = 'green' if obj.available_balance > 0 else 'red'
        return format_html(f'<span style="color: {color};">${obj.available_balance:,.2f}</span>')
    available_balance_display.short_description = "Available"
    
    def locked_balance_display(self, obj):
        color = 'orange' if obj.locked_balance > 0 else 'gray'
        return format_html(f'<span style="color: {color};">${obj.locked_balance:,.2f}</span>')
    locked_balance_display.short_description = "Locked"
    
    def earned_balance_display(self, obj):
        color = 'green' if obj.earned_balance > 0 else 'red'
        return format_html(f'<span style="color: {color};">${obj.earned_balance:,.2f}</span>')
    earned_balance_display.short_description = "Earned"
    
    def total_balance_display(self, obj):
        color = 'darkgreen' if obj.total_balance > obj.initial_balance else ('darkred' if obj.total_balance < obj.initial_balance else 'blue')
        return format_html(f'<span style="color: {color}; font-weight: bold;">${obj.total_balance:,.2f}</span>')
    total_balance_display.short_description = "Total"


@admin.register(ChallengeWalletTransaction)
class ChallengeWalletTransactionAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'transaction_type_badge', 'amount_display', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['wallet__user__email']
    readonly_fields = ['created_at']
    
    def user_email(self, obj):
        return obj.wallet.user.email
    user_email.short_description = "User"
    
    def transaction_type_badge(self, obj):
        colors = {
            'INITIAL_DEPOSIT': 'blue',
            'TRADE_LOCK': 'orange',
            'TRADE_UNLOCK': 'cyan',
            'PROFIT_ADD': 'green',
            'LOSS_DEDUCT': 'red',
            'REWARD_BONUS': 'gold',
            'RESET': 'gray',
        }
        color = colors.get(obj.transaction_type, 'gray')
        return format_html(
            f'<span style="background-color: {color}; color: white; padding: 3px 8px; border-radius: 3px;">{obj.get_transaction_type_display()}</span>'
        )
    transaction_type_badge.short_description = "Type"
    
    def amount_display(self, obj):
        color = 'green' if obj.transaction_type in ['PROFIT_ADD', 'INITIAL_DEPOSIT', 'REWARD_BONUS'] else 'red'
        return format_html(f'<span style="color: {color}; font-weight: bold;">${obj.amount:,.2f}</span>')
    amount_display.short_description = "Amount"


@admin.register(ChallengeTrade)
class ChallengeTradeAdmin(admin.ModelAdmin):
    list_display = [
        'asset_symbol', 'user_email', 'direction_badge', 'trade_type',
        'total_quantity', 'average_entry_price', 'pnl_display',
        'allocation_badge', 'status_badge', 'opened_at'
    ]
    list_filter = ['trade_type', 'direction', 'status', 'participation__week', 'opened_at']
    search_fields = ['user__email', 'asset_symbol']
    readonly_fields = ['opened_at', 'updated_at']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "User"
    
    def direction_badge(self, obj):
        color = 'green' if obj.direction == 'BUY' else 'red'
        return format_html(
            f'<span style="background-color: {color}; color: white; padding: 3px 6px; border-radius: 3px; font-weight: bold;">{obj.direction}</span>'
        )
    direction_badge.short_description = "Direction"
    
    def pnl_display(self, obj):
        color = 'green' if obj.total_pnl > 0 else ('red' if obj.total_pnl < 0 else 'gray')
        return format_html(f'<span style="color: {color}; font-weight: bold;">${obj.total_pnl:,.2f} ({obj.pnl_percentage:.2f}%)</span>')
    pnl_display.short_description = "P&L"
    
    def allocation_badge(self, obj):
        if obj.allocation_percentage >= 76:
            color, label = 'darkred', 'Firecracker'
        elif obj.allocation_percentage >= 51:
            color, label = 'red', 'Wave Hopper'
        elif obj.allocation_percentage >= 26:
            color, label = 'orange', 'Coin Scout'
        elif obj.allocation_percentage >= 15:
            color, label = 'green', 'Byte Bouncer'
        else:
            color, label = 'blue', 'Conservative'
        
        return format_html(
            f'<span style="background-color: {color}; color: white; padding: 3px 8px; border-radius: 3px;">{label} ({obj.allocation_percentage:.1f}%)</span>'
        )
    allocation_badge.short_description = "Allocation"
    
    def status_badge(self, obj):
        colors = {'OPEN': 'blue', 'CLOSED': 'gray', 'PARTIALLY_CLOSED': 'orange'}
        color = colors.get(obj.status, 'gray')
        return format_html(f'<span style="background-color: {color}; color: white; padding: 3px 6px; border-radius: 3px;">{obj.status}</span>')
    status_badge.short_description = "Status"


@admin.register(ChallengeTradeHistory)
class ChallengeTradeHistoryAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'trade_asset', 'action_badge', 'quantity', 'price', 'realized_pnl_display', 'created_at']
    list_filter = ['action', 'created_at']
    search_fields = ['user__email', 'trade__asset_symbol']
    readonly_fields = ['created_at']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "User"
    
    def trade_asset(self, obj):
        return f"{obj.trade.asset_symbol} ({obj.trade.trade_type})"
    trade_asset.short_description = "Trade"
    
    def action_badge(self, obj):
        colors = {'BUY': 'green', 'SELL': 'red', 'PARTIAL_SELL': 'orange', 'CANCEL': 'gray', 'MODIFY': 'blue'}
        color = colors.get(obj.action, 'gray')
        return format_html(f'<span style="background-color: {color}; color: white; padding: 3px 6px; border-radius: 3px;">{obj.action}</span>')
    action_badge.short_description = "Action"
    
    def realized_pnl_display(self, obj):
        color = 'green' if obj.realized_pnl > 0 else ('red' if obj.realized_pnl < 0 else 'gray')
        return format_html(f'<span style="color: {color}; font-weight: bold;">${obj.realized_pnl:,.2f}</span>')
    realized_pnl_display.short_description = "P&L"


@admin.register(ChallengeScore)
class ChallengeScoreAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'week_title', 'total_score_display', 'behavioral_tag_badge', 'calculated_at']
    list_filter = ['behavioral_tag', 'participation__week', 'calculated_at']
    search_fields = ['participation__user__email']
    readonly_fields = ['calculated_at']
    
    def user_email(self, obj):
        return obj.participation.user.email
    user_email.short_description = "User"
    
    def week_title(self, obj):
        return obj.participation.week.title
    week_title.short_description = "Week"
    
    def total_score_display(self, obj):
        color = 'green' if obj.total_score >= 7 else ('orange' if obj.total_score >= 5 else 'red')
        return format_html(f'<span style="color: {color}; font-weight: bold;">{obj.total_score:.2f}/10</span>')
    total_score_display.short_description = "Score"
    
    def behavioral_tag_badge(self, obj):
        colors = {
            'DISCIPLINED': 'green',
            'BALANCED': 'blue',
            'AGGRESSIVE': 'orange',
            'RECKLESS': 'red'
        }
        color = colors.get(obj.behavioral_tag, 'gray')
        return format_html(
            f'<span style="background-color: {color}; color: white; padding: 3px 8px; border-radius: 3px;">{obj.behavioral_tag}</span>'
        )
    behavioral_tag_badge.short_description = "Behavior"


@admin.register(ChallengeTradeAnalytics)
class ChallengeTradeAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'week_title', 'total_trades', 'win_rate_display', 'total_pnl_display', 'last_calculated_at']
    list_filter = ['last_calculated_at', 'participation__week__program']
    search_fields = ['participation__user__email']
    readonly_fields = ['last_calculated_at']
    
    def user_email(self, obj):
        return obj.participation.user.email
    user_email.short_description = "User"
    
    def week_title(self, obj):
        return obj.participation.week.title
    week_title.short_description = "Week"
    
    def win_rate_display(self, obj):
        color = 'green' if obj.win_rate >= 50 else 'red'
        return format_html(f'<span style="color: {color}; font-weight: bold;">{obj.win_rate:.2f}%</span>')
    win_rate_display.short_description = "Win Rate"
    
    def total_pnl_display(self, obj):
        color = 'green' if obj.total_pnl > 0 else ('red' if obj.total_pnl < 0 else 'gray')
        return format_html(f'<span style="color: {color}; font-weight: bold;">${obj.total_pnl:,.2f}</span>')
    total_pnl_display.short_description = "Total P&L"


@admin.register(ChallengeLeaderboard)
class ChallengeLeaderboardAdmin(admin.ModelAdmin):
    list_display = ['rank', 'user_email', 'week_title', 'total_score', 'portfolio_return_pct', 'total_trades', 'win_rate']
    list_filter = ['week', 'behavioral_tag', 'last_updated']
    search_fields = ['user__email', 'week__title']
    readonly_fields = ['last_updated', 'created_at']
    ordering = ['week', 'rank']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "User"
    
    def week_title(self, obj):
        return obj.week.title
    week_title.short_description = "Week"


@admin.register(UserChallengeReward)
class UserChallengeRewardAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'badge_name', 'coins_earned', 'badge_earned', 'earned_at']
    list_filter = ['badge_earned', 'earned_at']
    search_fields = ['user__email', 'reward_template__badge_name']
    readonly_fields = ['earned_at']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "User"
    
    def badge_name(self, obj):
        return obj.reward_template.badge_name
    badge_name.short_description = "Badge"


@admin.register(ChallengeRewardDistribution)
class ChallengeRewardDistributionAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'reward_type', 'coin_amount', 'status_badge', 'created_at']
    list_filter = ['reward_type', 'status', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['created_at', 'processed_at']
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = "User"
    
    def status_badge(self, obj):
        colors = {'PENDING': 'orange', 'COMPLETED': 'green', 'FAILED': 'red'}
        color = colors.get(obj.status, 'gray')
        return format_html(f'<span style="background-color: {color}; color: white; padding: 3px 6px; border-radius: 3px;">{obj.status}</span>')
    status_badge.short_description = "Status"


@admin.register(ChallengeStatistics)
class ChallengeStatisticsAdmin(admin.ModelAdmin):
    list_display = ['week_title', 'total_enrollments', 'completions', 'completion_rate', 'calculated_at']
    list_filter = ['calculated_at', 'week__program']
    search_fields = ['week__title']
    readonly_fields = ['calculated_at']
    
    def week_title(self, obj):
        return obj.week.title
    week_title.short_description = "Week"


@admin.register(ChallengeTaskCompletion)
class ChallengeTaskCompletionAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'task_title', 'is_completed', 'actual_value', 'completion_date']
    list_filter = ['is_completed', 'completion_date']
    search_fields = ['participation__user__email', 'task__title']
    readonly_fields = ['created_at', 'updated_at']
    
    def user_email(self, obj):
        return obj.participation.user.email
    user_email.short_description = "User"
    
    def task_title(self, obj):
        return obj.task.title
    task_title.short_description = "Task"



# ==================== FILE: project/urls.py (ADD THIS TO YOUR MAIN URLS) ====================
"""
Add this to your main project urls.py:

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/challenges/', include('apps.challenges.urls')),
    # ... other urls
]
"""


# ==================== COMPLETE API ENDPOINTS REFERENCE ====================
"""
BASE URL: /api/challenges/

CHALLENGE ENDPOINTS:
    GET     /programs/                          - List all programs
    GET     /programs/{id}/                     - Get program details
    
    GET     /weeks/                             - List all weeks
    GET     /weeks/{id}/                        - Get week details
    POST    /weeks/{id}/join/                   - Join a challenge week
    GET     /weeks/{id}/user_progress/          - Get user progress
    POST    /weeks/{id}/calculate_score/        - Calculate user score
    POST    /weeks/{id}/complete_challenge/     - Complete and claim rewards
    POST    /weeks/{id}/verify_tasks/           - Verify all tasks
    
    GET     /tasks/                             - List all tasks
    GET     /tasks/{id}/                        - Get task details
    POST    /tasks/{id}/verify/                 - Verify single task
    
    GET     /participations/                    - List user participations
    GET     /participations/{id}/               - Get participation details
    GET     /participations/my_participations/  - Get current user participations

WALLET ENDPOINTS:
    GET     /wallets/                           - List user wallets
    GET     /wallets/{id}/                      - Get wallet details
    GET     /wallets/{id}/balance/              - Get balance breakdown
    GET     /wallets/{id}/transactions/         - Get transaction history
    POST    /wallets/{id}/reset/                - Reset wallet (admin)

TRADE ENDPOINTS:
    GET     /trades/                            - List user trades
    POST    /trades/                            - Execute new trade
    GET     /trades/{id}/                       - Get trade details
    POST    /trades/{id}/close/                 - Close trade
    POST    /trades/{id}/update_price/          - Update current price
    GET     /trades/{id}/history/               - Get trade history
    GET     /trades/summary/                    - Get trade summary
    
    GET     /trade-analytics/                   - List analytics
    GET     /trade-analytics/participation_analytics/ - Get participation analytics
    POST    /trade-analytics/recalculate/       - Force recalculate

ADMIN ENDPOINTS (Staff Only):
    GET     /admin/challenges/                  - List programs (admin)
    GET     /admin/challenges/program_list/     - Programs with stats
    GET     /admin/challenges/{id}/program_details/ - Detailed program info
    
    GET     /admin/weeks/                       - List weeks (admin)
    GET     /admin/weeks/{id}/participants/     - Get week participants
    GET     /admin/weeks/{id}/statistics/       - Get week statistics
    POST    /admin/weeks/{id}/calculate_statistics/ - Calculate statistics
    GET     /admin/weeks/{id}/export_csv/       - Export to CSV

LEADERBOARD ENDPOINTS:
    GET     /leaderboards/week_leaderboard/     - Week leaderboard
    GET     /leaderboards/program_leaderboard/  - Program cumulative leaderboard
    GET     /leaderboards/behavioral_leaderboard/ - Behavioral tag leaderboard

QUERY PARAMETERS:
    - program_id: Filter by program
    - week_id: Filter by week
    - status: Filter by status (IN_PROGRESS, COMPLETED, etc.)
    - trade_type: Filter by trade type (SPOT, FUTURES, OPTIONS)
    - page: Page number for pagination
    - page_size: Items per page
    - limit: Limit results (for leaderboards)
    - sort_by: Sort field (total_score, portfolio_return_pct)
"""


# ==================== INSTALLATION & SETUP ====================
"""
1. Add to INSTALLED_APPS in settings.py:
   INSTALLED_APPS = [
       ...
       'apps.challenges',
   ]

2. Run migrations:
   python manage.py makemigrations challenges
   python manage.py migrate challenges

3. Add to main urls.py:
   path('api/challenges/', include('apps.challenges.urls')),

4. Create superuser (if not exists):
   python manage.py createsuperuser

5. Access admin at:
   http://localhost:8000/admin/

6. Test API at:
   http://localhost:8000/api/challenges/programs/
"""