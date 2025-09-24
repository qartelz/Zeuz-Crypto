from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from django.db.models import Count, Sum, Q
from .models import (
    Plan,
    Coupon,
    PlanCoupon,
    Subscription,
    SubscriptionHistory,
    SubscriptionOrder,
)


class SubscriptionHistoryInline(admin.TabularInline):
    model = SubscriptionHistory
    extra = 0
    readonly_fields = [
        "event_type",
        "user",
        "coupon",
        "previous_values",
        "new_values",
        "created_at",
    ]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "user_type",
        "duration_days",
        "price",
        "is_active",
        "subscription_count",
        "created_at",
    ]
    list_filter = ["user_type", "is_active", "duration_days", "created_at"]
    search_fields = ["name", "description"]
    ordering = ["user_type", "name"]
    readonly_fields = ["id", "created_at", "updated_at"]

    fieldsets = (
        ("Basic Information", {"fields": ("name", "description", "user_type")}),
        ("Pricing & Duration", {"fields": ("price", "duration_days")}),
        ("Status", {"fields": ("is_active",)}),
        (
            "System Information",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def subscription_count(self, obj):
        """Show number of active subscriptions for this plan"""
        count = obj.subscriptions.filter(status="ACTIVE").count()
        if count > 0:
            url = reverse("admin:subscriptions_subscription_changelist")
            return format_html(
                '<a href="{}?plan__id__exact={}">{} active</a>', url, obj.id, count
            )
        return "0 active"

    subscription_count.short_description = "Active Subscriptions"

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .annotate(
                active_subscription_count=Count(
                    "subscriptions", filter=Q(subscriptions__status="ACTIVE")
                )
            )
        )


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = [
        "code",
        "discount_type",
        "discount_value",
        "usage_limit",
        "times_used",
        "is_active",
        "created_at",
    ]
    list_filter = ["discount_type", "is_active", "start_date", "end_date"]
    search_fields = ["code"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]

    fieldsets = (
        ("Coupon Details", {"fields": ("code", "discount_type", "discount_value")}),
        ("Validity Period", {"fields": ("start_date", "end_date")}),
        ("Usage Limits", {"fields": ("usage_limit", "usage_count")}),
        ("Status", {"fields": ("is_active",)}),
        (
            "System Information",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def usage_status(self, obj):
        """Show usage count vs limit"""
        if obj.usage_limit:
            percentage = (obj.usage_count / obj.usage_limit) * 100
            color = (
                "red" if percentage >= 90 else "orange" if percentage >= 70 else "green"
            )
            return format_html(
                '<span style="color: {};">{}/{} ({}%)</span>',
                color,
                obj.usage_count,
                obj.usage_limit,
                int(percentage),
            )
        return f"{obj.usage_count}/∞"

    usage_status.short_description = "Usage"

    def validity_period(self, obj):
        """Show validity period with status"""
        now = timezone.now()
        if now < obj.start_date:
            return format_html(
                '<span style="color: blue;">Starts: {}</span>',
                obj.start_date.strftime("%Y-%m-%d"),
            )
        elif now > obj.end_date:
            return format_html(
                '<span style="color: red;">Expired: {}</span>',
                obj.end_date.strftime("%Y-%m-%d"),
            )
        else:
            return format_html(
                '<span style="color: green;">Valid until: {}</span>',
                obj.end_date.strftime("%Y-%m-%d"),
            )

    validity_period.short_description = "Validity"

    def get_queryset(self, request):
        return (
            super().get_queryset(request).annotate(usage_count=Count("subscriptions"))
        )


class PlanCouponInline(admin.TabularInline):
    model = PlanCoupon
    extra = 1
    autocomplete_fields = ["coupon"]


@admin.register(PlanCoupon)
class PlanCouponAdmin(admin.ModelAdmin):
    list_display = ["plan", "coupon", "created_at"]
    list_filter = ["plan__user_type", "coupon__discount_type", "coupon__is_active"]
    search_fields = ["plan__name", "coupon__code"]
    autocomplete_fields = ["plan", "coupon"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]


@admin.register(SubscriptionOrder)
class SubscriptionOrderAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "plan",
        "order_type",
        "status",
        "amount",
        "discount",
        "final_amount",
        "created_at",
    ]
    list_filter = ["order_type", "status", "created_at"]
    search_fields = ["user__username", "plan__name", "transaction_id"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at", "completed_at"]


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "plan",
        "subscription_source",
        "status",
        "start_date",
        "end_date",
        "original_price",
        "discount_amount",
        "final_price",
        "created_at",
    ]
    list_filter = [
        "status",
        "plan__user_type",
        "subscription_source",
        "start_date",
        "end_date",
        "created_at",
    ]
    search_fields = ["user__username", "plan__name", "coupon__code"]
    readonly_fields = [
        "id",
        "original_price",
        "discount_amount",
        "final_price",
        "created_at",
        "updated_at",
    ]
    autocomplete_fields = ["plan", "coupon"]
    raw_id_fields = ["user"]
    date_hierarchy = "created_at"
    ordering = ["-created_at"]
    inlines = [SubscriptionHistoryInline]


@admin.register(SubscriptionHistory)
class SubscriptionHistoryAdmin(admin.ModelAdmin):
    list_display = ["subscription", "event_type", "user", "coupon", "created_at"]
    list_filter = [
        "event_type",
        "created_at",
        "subscription__status",
        "subscription__plan__user_type",
    ]
    search_fields = [
        "subscription__user__username",
        "user__username",
        "subscription__plan__name",
        "coupon__code",
    ]
    readonly_fields = [
        "id",
        "subscription",
        "user",
        "event_type",
        "previous_values",
        "new_values",
        "coupon",
        "created_at",
    ]
    ordering = ["-created_at"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# Custom admin site configuration
admin.site.site_header = "ZeuzCrypto Subscription Management"
admin.site.site_title = "ZeuzCrypto Admin"
admin.site.index_title = "Subscription Plans Administration"
