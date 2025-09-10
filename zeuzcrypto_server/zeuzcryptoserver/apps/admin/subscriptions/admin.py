from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils import timezone
from django.db.models import Count, Sum, Q
from .models import Plan, Coupon, PlanCoupon, Subscription, SubscriptionHistory


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
        "usage_status",
        "validity_period",
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
    list_display = [
        "plan_name",
        "coupon_code",
        "discount_info",
        "coupon_validity",
        "created_at",
    ]
    list_filter = ["plan__user_type", "coupon__discount_type", "coupon__is_active"]
    search_fields = ["plan__name", "coupon__code"]
    autocomplete_fields = ["plan", "coupon"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at"]

    def plan_name(self, obj):
        return f"{obj.plan.name} ({obj.plan.user_type})"

    plan_name.short_description = "Plan"

    def coupon_code(self, obj):
        return obj.coupon.code

    coupon_code.short_description = "Coupon Code"

    def discount_info(self, obj):
        if obj.coupon.discount_type == "PERCENTAGE":
            return f"{obj.coupon.discount_value}%"
        else:
            return f"${obj.coupon.discount_value}"

    discount_info.short_description = "Discount"

    def coupon_validity(self, obj):
        return obj.coupon.is_valid_now()

    coupon_validity.short_description = "Valid Now"
    coupon_validity.boolean = True


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        "user_username",
        "plan_info",
        "subscription_period",
        "pricing_info",
        "status_badge",
        "created_at",
    ]
    list_filter = ["status", "plan__user_type", "start_date", "end_date", "created_at"]
    search_fields = ["user__username", "user__email", "plan__name", "coupon__code"]
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

    fieldsets = (
        ("Subscription Details", {"fields": ("user", "plan", "coupon")}),
        ("Period", {"fields": ("start_date", "end_date", "status")}),
        (
            "Pricing",
            {
                "fields": ("original_price", "discount_amount", "final_price"),
                "classes": ("collapse",),
            },
        ),
        (
            "System Information",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    actions = ["cancel_subscriptions", "activate_subscriptions"]

    def user_username(self, obj):
        return obj.user.username

    user_username.short_description = "User"

    def plan_info(self, obj):
        return f"{obj.plan.name} ({obj.plan.user_type}) - {obj.plan.duration_days} days"

    plan_info.short_description = "Plan Details"

    def subscription_period(self, obj):
        return f"{obj.start_date.strftime('%Y-%m-%d')} to {obj.end_date.strftime('%Y-%m-%d')}"

    subscription_period.short_description = "Period"

    def pricing_info(self, obj):
        if obj.discount_amount > 0:
            return format_html(
                "<s>${}</s> <strong>${}</strong> (${} off)",
                obj.original_price,
                obj.final_price,
                obj.discount_amount,
            )
        return f"${obj.final_price}"

    pricing_info.short_description = "Pricing"

    def status_badge(self, obj):
        colors = {
            "ACTIVE": "green",
            "EXPIRED": "red",
            "CANCELLED": "orange",
            "PENDING": "blue",
        }
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            colors.get(obj.status, "black"),
            obj.status,
        )

    status_badge.short_description = "Status"

    def cancel_subscriptions(self, request, queryset):
        """Bulk action to cancel subscriptions"""
        active_subscriptions = queryset.filter(status="ACTIVE")
        count = active_subscriptions.update(status="CANCELLED")
        self.message_user(request, f"{count} subscriptions were cancelled.")

    cancel_subscriptions.short_description = "Cancel selected subscriptions"

    def activate_subscriptions(self, request, queryset):
        """Bulk action to activate subscriptions"""
        inactive_subscriptions = queryset.filter(status__in=["CANCELLED", "PENDING"])
        count = inactive_subscriptions.update(status="ACTIVE")
        self.message_user(request, f"{count} subscriptions were activated.")

    activate_subscriptions.short_description = "Activate selected subscriptions"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user", "plan", "coupon")


@admin.register(SubscriptionHistory)
class SubscriptionHistoryAdmin(admin.ModelAdmin):
    list_display = [
        "subscription_info",
        "event_type_display",
        "user_username",
        "coupon_info",
        "created_at",
    ]
    list_filter = [
        "event_type",
        "created_at",
        "subscription__status",
        "subscription__plan__user_type",
    ]
    search_fields = [
        "subscription__user__username",
        "subscription__user__email",
        "user__username",
        "user__email",
        "subscription__plan__name",
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

    def subscription_info(self, obj):
        return format_html(
            "{} - {} ({}) <br/><small>Plan: {}</small>",
            obj.subscription.user.username,
            obj.subscription.status,
            obj.subscription.id,
            obj.subscription.plan.name,
        )

    subscription_info.short_description = "Subscription"

    def event_type_display(self, obj):
        colors = {
            "CREATED": "green",
            "UPDATED": "blue",
            "STATUS_CHANGED": "orange",
            "CANCELLED": "red",
            "COUPON_APPLIED": "purple",
        }
        return format_html(
            '<span style="color: {};">{}</span>',
            colors.get(obj.event_type, "black"),
            obj.get_event_type_display(),
        )

    event_type_display.short_description = "Event"

    def user_username(self, obj):
        return obj.user.username

    user_username.short_description = "User"

    def coupon_info(self, obj):
        if obj.coupon:
            return f"{obj.coupon.code}"
        return "-"

    coupon_info.short_description = "Coupon"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related(
                "subscription",
                "subscription__user",
                "subscription__plan",
                "user",
                "coupon",
            )
        )


# Custom admin site configuration
admin.site.site_header = "ZeuzCrypto Subscription Management"
admin.site.site_title = "ZeuzCrypto Admin"
admin.site.index_title = "Subscription Plans Administration"
