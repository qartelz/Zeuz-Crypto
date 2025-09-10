from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Q, F
from .models import Plan, Coupon, PlanCoupon, Subscription, SubscriptionHistory
from .serializers import (
    PlanSerializer,
    CouponSerializer,
    PlanCouponSerializer,
    SubscriptionSerializer,
    CreateSubscriptionSerializer,
    SubscriptionHistorySerializer,
)


class PlanViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing subscription plans.
    Supports filtering by user_type and active status.
    """

    queryset = Plan.objects.all()
    serializer_class = PlanSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["user_type", "is_active"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "price", "duration_days", "created_at"]
    ordering = ["name"]

    def get_permissions(self):
        """Allow read access to all, write access only to admins"""
        if self.action in ["list", "retrieve", "active", "applicable_coupons"]:
            permission_classes = []
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=["get"])
    def active(self, request):
        """Get only active plans, optionally filtered by user type"""
        active_plans = self.queryset.filter(is_active=True)
        user_type = request.query_params.get("user_type")
        if user_type and user_type in ["B2B", "B2C"]:
            active_plans = active_plans.filter(user_type=user_type)

        serializer = self.get_serializer(active_plans, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def applicable_coupons(self, request, pk=None):
        """Get coupons applicable to a specific plan"""
        plan = self.get_object()
        now = timezone.now()

        # Get coupons linked to this plan that are currently valid
        applicable_coupons = (
            Coupon.objects.filter(
                plan_coupons__plan=plan,
                is_active=True,
                start_date__lte=now,
                end_date__gte=now,
            )
            .filter(
                Q(usage_limit__isnull=True)
                | Q(usage_limit__gt=F("subscriptions__count"))
            )
            .distinct()
        )

        serializer = CouponSerializer(applicable_coupons, many=True)
        return Response(serializer.data)


class CouponViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing coupons.
    Only admin users can manage coupons.
    """

    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["discount_type", "is_active"]
    search_fields = ["code"]
    ordering_fields = ["code", "discount_value", "start_date", "end_date", "created_at"]
    ordering = ["-created_at"]

    @action(detail=True, methods=["post"])
    def validate_coupon(self, request, pk=None):
        """Validate if a coupon can be used for a specific plan"""
        coupon = self.get_object()
        plan_id = request.data.get("plan_id")

        if not plan_id:
            return Response(
                {"error": "plan_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            plan = Plan.objects.get(id=plan_id, is_active=True)
        except Plan.DoesNotExist:
            return Response(
                {"error": "Plan not found or inactive"},
                status=status.HTTP_404_NOT_FOUND,
            )

        is_valid = coupon.is_valid_now()
        is_applicable = PlanCoupon.objects.filter(plan=plan, coupon=coupon).exists()

        discount_amount = 0
        final_price = plan.price

        if is_valid and is_applicable:
            if coupon.discount_type == "PERCENTAGE":
                discount_amount = (plan.price * coupon.discount_value) / 100
            else:  # FIXED
                discount_amount = min(coupon.discount_value, plan.price)
            final_price = plan.price - discount_amount

        return Response(
            {
                "is_valid": is_valid,
                "is_applicable": is_applicable,
                "can_use": is_valid and is_applicable,
                "discount_type": coupon.discount_type,
                "discount_value": coupon.discount_value,
                "usage_count": coupon.usage_count,
                "usage_limit": coupon.usage_limit,
                "discount_amount": discount_amount,
                "original_price": plan.price,
                "final_price": final_price,
            }
        )


class PlanCouponViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing plan-coupon relationships.
    Only admin users can manage these relationships.
    """

    queryset = PlanCoupon.objects.all()
    serializer_class = PlanCouponSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["plan", "coupon"]


class SubscriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user subscriptions.
    Users can only access their own subscriptions unless they are staff.
    """

    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["status", "plan"]
    ordering_fields = ["start_date", "end_date", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter subscriptions based on user permissions"""
        if self.request.user.is_staff:
            return Subscription.objects.all().select_related("user", "plan", "coupon")
        return Subscription.objects.filter(user=self.request.user).select_related(
            "plan", "coupon"
        )

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == "create":
            return CreateSubscriptionSerializer
        return SubscriptionSerializer

    def create(self, request, *args, **kwargs):
        """Create a new subscription with validation"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subscription = serializer.save()

        # Return the created subscription using the display serializer
        response_serializer = SubscriptionSerializer(subscription)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"])
    def active(self, request):
        """Get user's currently active subscriptions"""
        active_subscriptions = self.get_queryset().filter(
            status="ACTIVE",
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now(),
        )
        serializer = self.get_serializer(active_subscriptions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """Cancel an active subscription"""
        subscription = self.get_object()

        if subscription.status != "ACTIVE":
            return Response(
                {"error": "Only active subscriptions can be cancelled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subscription.status = "CANCELLED"
        subscription.save()

        serializer = self.get_serializer(subscription)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def expiring_soon(self, request):
        """Get subscriptions expiring in the next 7 days"""
        seven_days_from_now = timezone.now() + timezone.timedelta(days=7)
        expiring_subscriptions = self.get_queryset().filter(
            status="ACTIVE",
            end_date__lte=seven_days_from_now,
            end_date__gte=timezone.now(),
        )
        serializer = self.get_serializer(expiring_subscriptions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def history(self, request, pk=None):
        """Get history entries for a specific subscription"""
        subscription = self.get_object()
        history_entries = SubscriptionHistory.objects.filter(
            subscription=subscription
        ).order_by("-timestamp")
        serializer = SubscriptionHistorySerializer(history_entries, many=True)
        return Response(serializer.data)


class SubscriptionHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for subscription history.
    Users can only view their own subscription history unless they are staff.
    """

    serializer_class = SubscriptionHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["event_type", "subscription"]
    ordering_fields = ["timestamp"]
    ordering = ["-timestamp"]

    def get_queryset(self):
        """Filter history entries based on user permissions"""
        if self.request.user.is_staff:
            return SubscriptionHistory.objects.all().select_related(
                "subscription", "user", "coupon"
            )
        return SubscriptionHistory.objects.filter(
            user=self.request.user
        ).select_related("subscription", "coupon")
