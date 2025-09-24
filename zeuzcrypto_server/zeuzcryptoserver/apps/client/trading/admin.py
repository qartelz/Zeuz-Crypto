# admin.py - Django admin interface
from django.contrib import admin
from .models import Trade, FuturesDetails, OptionsDetails, TradeHistory, Portfolio


@admin.register(Trade)
class TradeAdmin(admin.ModelAdmin):
    list_display = ['user', 'asset_symbol', 'trade_type', 'direction', 'status', 
                    'total_quantity', 'average_price', 'total_pnl', 'opened_at']
    list_filter = ['trade_type', 'direction', 'status', 'holding_type', 'opened_at']
    search_fields = ['user__email', 'asset_symbol', 'asset_name']
    readonly_fields = ['id', 'opened_at', 'updated_at', 'total_pnl', 'pnl_percentage']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('user', 'asset_symbol', 'asset_name', 'asset_exchange')
        }),
        ('Trade Details', {
            'fields': ('trade_type', 'direction', 'status', 'holding_type')
        }),
        ('Position', {
            'fields': ('total_quantity', 'remaining_quantity', 'average_price', 'total_invested')
        }),
        ('P&L', {
            'fields': ('realized_pnl', 'unrealized_pnl', 'total_pnl', 'pnl_percentage')
        }),
        ('Timestamps', {
            'fields': ('opened_at', 'closed_at', 'updated_at')
        })
    )


@admin.register(TradeHistory)
class TradeHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'trade', 'action', 'quantity', 'price', 'realized_pnl', 'created_at']
    list_filter = ['action', 'order_type', 'created_at']
    search_fields = ['user__email', 'trade__asset_symbol']
    readonly_fields = ['created_at']


@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_value', 'total_return_percentage', 'active_trades_count', 
                    'win_rate', 'last_updated']
    readonly_fields = ['win_rate', 'last_updated', 'created_at']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Values', {
            'fields': ('total_value', 'total_invested', 'total_realized_pnl', 'total_unrealized_pnl')
        }),
        ('Performance', {
            'fields': ('total_return_percentage', 'day_pnl', 'day_pnl_percentage')
        }),
        ('Trading Stats', {
            'fields': ('active_trades_count', 'total_trades_count', 'winning_trades_count', 
                      'losing_trades_count', 'win_rate')
        }),
        ('Risk Metrics', {
            'fields': ('max_drawdown', 'sharpe_ratio')
        }),
        ('Timestamps', {
            'fields': ('last_updated', 'created_at')
        })
    )


# Inline admins for related models
class FuturesDetailsInline(admin.StackedInline):
    model = FuturesDetails
    extra = 0


class OptionsDetailsInline(admin.StackedInline):
    model = OptionsDetails
    extra = 0


# Add inlines to Trade admin
TradeAdmin.inlines = [FuturesDetailsInline, OptionsDetailsInline]
