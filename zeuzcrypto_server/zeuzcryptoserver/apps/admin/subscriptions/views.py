from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Count, Q, F
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
            .annotate(usage_count=Count("subscriptions"))
            .filter(Q(usage_limit__isnull=True) | Q(usage_limit__gt=F("usage_count")))
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
        """Create a new subscription with robust validation"""
        data = request.data.copy()
        required_fields = ["plan", "start_date"]
        errors = {}

        # Check required fields
        for field in required_fields:
            if not data.get(field):
                errors[field] = ["This field is required."]

        # Validate plan
        plan = None
        if data.get("plan"):
            try:
                plan = Plan.objects.get(id=data["plan"], is_active=True)
            except Plan.DoesNotExist:
                errors["plan"] = ["Plan not found or inactive."]

        # Validate coupon if provided
        coupon = None
        coupon_code = data.get("coupon") or data.get("coupon_code")
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code=coupon_code.upper(), is_active=True)
                if not coupon.is_valid():
                    errors["coupon"] = ["Coupon is not valid or has expired."]
            except Coupon.DoesNotExist:
                errors["coupon"] = ["Invalid coupon code."]

        # Validate start_date
        start_date = data.get("start_date")
        if start_date:
            try:
                # Accept both date and datetime
                from dateutil.parser import parse as dateparse

                parsed_start = dateparse(start_date)
                if parsed_start.date() < timezone.now().date():
                    errors["start_date"] = ["Start date cannot be in the past."]
            except Exception:
                errors["start_date"] = ["Invalid start date format."]

        # Validate overlapping subscriptions
        if plan and start_date and not errors.get("start_date"):
            from dateutil.parser import parse as dateparse

            parsed_start = dateparse(start_date)
            end_date = parsed_start + timezone.timedelta(days=plan.duration_days)
            overlapping = Subscription.objects.filter(
                user=request.user,
                status="ACTIVE",
                start_date__lt=end_date,
                end_date__gt=parsed_start,
            )
            if overlapping.exists():
                errors["non_field_errors"] = [
                    "You already have an active subscription that overlaps with this period."
                ]

        # Validate coupon applicability
        if coupon and plan and not errors.get("coupon"):
            if not PlanCoupon.objects.filter(plan=plan, coupon=coupon).exists():
                errors["coupon"] = [
                    "This coupon is not applicable to the selected plan."
                ]

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        # Prepare validated data for serializer
        serializer_data = {
            "plan": plan.id,
            "start_date": start_date,
        }
        if coupon:
            serializer_data["coupon"] = coupon.id
        if "subscription_source" in data:
            serializer_data["subscription_source"] = data["subscription_source"]
        if "end_date" in data:
            serializer_data["end_date"] = data["end_date"]
        if "status" in data:
            serializer_data["status"] = data["status"]

        serializer = self.get_serializer(data=serializer_data)
        serializer.is_valid(raise_exception=True)
        subscription = serializer.save(user=request.user)

        # Return the created subscription using the display serializer
        response_serializer = SubscriptionSerializer(subscription)
        response_data = response_serializer.data
        # Add any missing fields if needed (e.g., plan details, coupon details)
        response_data["plan"] = PlanSerializer(plan).data if plan else None
        if coupon:
            response_data["coupon"] = CouponSerializer(coupon).data
        return Response(response_data, status=status.HTTP_201_CREATED)

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


from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Q, F
from .models import (
    Plan,
    Coupon,
    PlanCoupon,
    Subscription,
    SubscriptionHistory,
    SubscriptionOrder,
)
from .serializers import (
    PlanSerializer,
    CouponSerializer,
    PlanCouponSerializer,
    # SubscriptionSerializer, SubscriptionHistorySerializer,
    SubscriptionOrderSerializer,
    AdminAssignPlanSerializer,
    UserPurchasePlanSerializer,
    OrderCompletionSerializer,
    OrderCancellationSerializer,
)


class SubscriptionOrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing subscription orders.
    Different permissions for admin vs regular users.
    """

    serializer_class = SubscriptionOrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["order_type", "status", "plan"]
    search_fields = ["user__username", "plan__name", "transaction_id"]
    ordering_fields = ["created_at", "updated_at", "completed_at", "amount"]
    ordering = ["-created_at"]

    def get_queryset(self):
        """Filter orders based on user permissions"""
        if self.request.user.is_staff:
            return SubscriptionOrder.objects.all().select_related(
                "user", "plan", "coupon"
            )
        return SubscriptionOrder.objects.filter(user=self.request.user).select_related(
            "plan", "coupon"
        )

    def get_permissions(self):
        """Admin-only actions vs user actions"""
        if self.action in ["admin_assign_plan"]:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(
        detail=False, methods=["post"], permission_classes=[permissions.IsAdminUser]
    )
    def admin_assign_plan(self, request):
        """Admin endpoint to assign plans to users"""
        serializer = AdminAssignPlanSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        # Return the created order with subscription details
        response_data = SubscriptionOrderSerializer(order).data
        subscription = Subscription.objects.filter(
            user=order.user, plan=order.plan, created_at__gte=order.completed_at
        ).first()

        if subscription:
            response_data["subscription"] = {
                "id": subscription.id,
                "status": subscription.status,
                "start_date": subscription.start_date,
                "end_date": subscription.end_date,
            }

        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def purchase_plan(self, request):
        """User endpoint to purchase plans (B2C only)"""
        serializer = UserPurchasePlanSerializer(
            data=request.data, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        order = serializer.save()

        response_data = SubscriptionOrderSerializer(order).data
        return Response(response_data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def complete_order(self, request, pk=None):
        """Complete a pending order (payment confirmation)"""
        order = self.get_object()

        if order.status != "PENDING":
            return Response(
                {"error": "Only pending orders can be completed"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = OrderCompletionSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()

        response_data = SubscriptionOrderSerializer(result["order"]).data
        response_data["subscription"] = {
            "id": result["subscription"].id,
            "status": result["subscription"].status,
            "start_date": result["subscription"].start_date,
            "end_date": result["subscription"].end_date,
        }

        return Response(response_data)

    @action(detail=True, methods=["post"])
    def cancel_order(self, request, pk=None):
        """Cancel an order"""
        order = self.get_object()

        # Users can only cancel their own orders, admins can cancel any
        if not request.user.is_staff and order.user != request.user:
            return Response(
                {"error": "You can only cancel your own orders"},
                status=status.HTTP_403_FORBIDDEN,
            )

        if order.status == "COMPLETED":
            return Response(
                {"error": "Completed orders cannot be cancelled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = OrderCancellationSerializer(order, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_order = serializer.save()

        return Response(SubscriptionOrderSerializer(updated_order).data)

    @action(detail=False, methods=["get"])
    def pending_orders(self, request):
        """Get pending orders (staff can see all, users see only their own)"""
        pending_orders = self.get_queryset().filter(status="PENDING")
        serializer = self.get_serializer(pending_orders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def completed_orders(self, request):
        """Get completed orders"""
        completed_orders = self.get_queryset().filter(status="COMPLETED")
        serializer = self.get_serializer(completed_orders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def order_subscription(self, request, pk=None):
        """Get subscription created from this order"""
        order = self.get_object()

        if order.status != "COMPLETED":
            return Response(
                {"error": "Order is not completed yet"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Find subscription created from this order
        subscription = Subscription.objects.filter(
            user=order.user,
            plan=order.plan,
            subscription_source=order.order_type,
            created_at__gte=order.completed_at,
            created_at__lte=order.completed_at + timezone.timedelta(minutes=5),
        ).first()

        if not subscription:
            return Response(
                {"error": "Associated subscription not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(SubscriptionSerializer(subscription).data)

    @action(detail=False, methods=["get"])
    def order_stats(self, request):
        """Get order statistics (admin only)"""
        if not request.user.is_staff:
            return Response(
                {"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN
            )

        from django.db.models import Count, Sum

        stats = SubscriptionOrder.objects.aggregate(
            total_orders=Count("id"),
            pending_orders=Count("id", filter=Q(status="PENDING")),
            completed_orders=Count("id", filter=Q(status="COMPLETED")),
            cancelled_orders=Count("id", filter=Q(status="CANCELLED")),
            failed_orders=Count("id", filter=Q(status="FAILED")),
            total_revenue=Sum("final_amount", filter=Q(status="COMPLETED")),
            admin_assigned=Count("id", filter=Q(order_type="ADMIN_ASSIGNED")),
            self_purchased=Count("id", filter=Q(order_type="SELF_PURCHASED")),
        )

        return Response(stats)
