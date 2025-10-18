from rest_framework import serializers
from django.utils import timezone
from apps.accounts.models import User
from django.db.models import Q
from .models import Plan, Coupon, PlanCoupon, Subscription, SubscriptionHistory


class PlanSerializer(serializers.ModelSerializer):
    """Serializer for Plan model"""

    class Meta:
        model = Plan
        fields = [
            "id",
            "name",
            "description",
            "duration_days",
            "price",
            "user_type",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_duration_days(self, value):
        if value <= 0:
            raise serializers.ValidationError("Duration must be greater than 0 days")
        return value

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative")
        return value


class CouponSerializer(serializers.ModelSerializer):
    """Serializer for Coupon model"""

    is_currently_valid = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = [
            "id",
            "code",
            "discount_type",
            "discount_value",
            "start_date",
            "end_date",
            "usage_limit",
            "times_used",
            "is_active",
            "is_currently_valid",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "times_used", "created_at", "updated_at"]

    def get_is_currently_valid(self, obj):
        return obj.is_valid()

    def validate(self, data):
        if data["start_date"] >= data["end_date"]:
            raise serializers.ValidationError("End date must be after start date")

        if data["discount_type"] == "PERCENTAGE" and data["discount_value"] > 100:
            raise serializers.ValidationError("Percentage discount cannot exceed 100%")

        if data["discount_value"] < 0:
            raise serializers.ValidationError("Discount value cannot be negative")

        return data

    def validate_code(self, value):
        # Check for unique code during creation/update
        if self.instance:
            if Coupon.objects.exclude(id=self.instance.id).filter(code=value).exists():
                raise serializers.ValidationError("Coupon code must be unique")
        else:
            if Coupon.objects.filter(code=value).exists():
                raise serializers.ValidationError("Coupon code must be unique")
        return value.upper()  # Store codes in uppercase


class PlanCouponSerializer(serializers.ModelSerializer):
    """Serializer for PlanCoupon model"""

    plan_name = serializers.CharField(source="plan.name", read_only=True)
    coupon_code = serializers.CharField(source="coupon.code", read_only=True)

    class Meta:
        model = PlanCoupon
        fields = ["id", "plan", "coupon", "plan_name", "coupon_code", "created_at"]
        read_only_fields = ["id", "created_at"]


from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth.models import User
from django.db.models import Q
from .models import (
    Plan,
    Coupon,
    PlanCoupon,
    Subscription,
    SubscriptionHistory,
    SubscriptionOrder,
)


class SubscriptionOrderSerializer(serializers.ModelSerializer):
    """Serializer for displaying subscription orders"""

    user_username = serializers.CharField(source="user.username", read_only=True)
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    plan_duration = serializers.IntegerField(
        source="plan.duration_days", read_only=True
    )
    coupon_code = serializers.CharField(source="coupon.code", read_only=True)
    order_type_display = serializers.CharField(
        source="get_order_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = SubscriptionOrder
        fields = [
            "id",
            "user_username",
            "plan_name",
            "plan_duration",
            "order_type",
            "order_type_display",
            "status",
            "status_display",
            "coupon_code",
            "transaction_id",
            "amount",
            "discount",
            "final_amount",
            "start_date",
            "notes",
            "created_at",
            "updated_at",
            "completed_at",
        ]
        read_only_fields = [
            "id",
            "amount",
            "discount",
            "final_amount",
            "created_at",
            "updated_at",
            "completed_at",
        ]


class AdminAssignPlanSerializer(serializers.Serializer):
    """Serializer for admin assigning plans to users"""

    user_id = serializers.IntegerField()
    plan_id = serializers.UUIDField()
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    start_date = serializers.DateTimeField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=1000)

    def validate_user_id(self, value):
        try:
            user = User.objects.get(id=value)
            return user
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")

    def validate_plan_id(self, value):
        try:
            plan = Plan.objects.get(id=value, is_active=True)
            return plan
        except Plan.DoesNotExist:
            raise serializers.ValidationError("Plan not found or inactive")

    def validate_coupon_code(self, value):
        if not value:
            return None

        try:
            coupon = Coupon.objects.get(code=value.upper(), is_active=True)
            if not coupon.is_valid():
                raise serializers.ValidationError("Coupon is not valid or has expired")
            return coupon
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Invalid coupon code")

    def validate(self, data):
        user = data.get("user_id")
        plan = data.get("plan_id")
        coupon = data.get("coupon_code")
        start_date = data.get("start_date", timezone.now())

        # Validate coupon is applicable to plan
        if coupon and plan:
            if not PlanCoupon.objects.filter(plan=plan, coupon=coupon).exists():
                raise serializers.ValidationError(
                    "This coupon is not applicable to the selected plan"
                )

        # Check for overlapping active subscriptions
        end_date = start_date + timezone.timedelta(days=plan.duration_days)
        overlapping = Subscription.objects.filter(user=user, status="ACTIVE").filter(
            Q(start_date__lt=end_date) & Q(end_date__gt=start_date)
        )

        if overlapping.exists():
            raise serializers.ValidationError(
                "User already has an active subscription during this period"
            )

        return data

    def create(self, validated_data):
        user = validated_data["user_id"]
        plan = validated_data["plan_id"]
        coupon = validated_data.get("coupon_code")
        start_date = validated_data.get("start_date", timezone.now())
        notes = validated_data.get("notes", "")

        # Create order
        order = SubscriptionOrder.objects.create(
            user=user,
            plan=plan,
            coupon=coupon,
            order_type="ADMIN_ASSIGNED",
            status="COMPLETED",  # Admin assignments are immediately completed
            start_date=start_date,
            notes=notes,
        )

        # Auto-complete the order to create subscription
        subscription = order.complete_order()

        return order


class UserPurchasePlanSerializer(serializers.Serializer):
    """Serializer for user purchasing plans (B2C only)"""

    plan_id = serializers.UUIDField()
    coupon_code = serializers.CharField(required=False, allow_blank=True)
    start_date = serializers.DateTimeField(required=False)

    def validate_plan_id(self, value):
        try:
            plan = Plan.objects.get(id=value, is_active=True)
            return plan
        except Plan.DoesNotExist:
            raise serializers.ValidationError("Plan not found or inactive")

    def validate_coupon_code(self, value):
        if not value:
            return None

        try:
            coupon = Coupon.objects.get(code=value.upper(), is_active=True)
            if not coupon.is_valid():
                raise serializers.ValidationError("Coupon is not valid or has expired")
            return coupon
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Invalid coupon code")

    def validate(self, data):
        plan = data.get("plan_id")
        coupon = data.get("coupon_code")
        start_date = data.get("start_date", timezone.now())
        user = self.context["request"].user

        # Ensure user is not B2B (assuming user has a profile with user_type)
        if (
            hasattr(user, "profile")
            and getattr(user.profile, "user_type", None) == "B2B"
        ):
            raise serializers.ValidationError("B2B users cannot self-purchase plans")

        # Validate coupon is applicable to plan
        if coupon and plan:
            if not PlanCoupon.objects.filter(plan=plan, coupon=coupon).exists():
                raise serializers.ValidationError(
                    "This coupon is not applicable to the selected plan"
                )

        # Check for overlapping active subscriptions
        end_date = start_date + timezone.timedelta(days=plan.duration_days)
        overlapping = Subscription.objects.filter(user=user, status="ACTIVE").filter(
            Q(start_date__lt=end_date) & Q(end_date__gt=start_date)
        )

        if overlapping.exists():
            raise serializers.ValidationError(
                "You already have an active subscription during this period"
            )

        return data

    def create(self, validated_data):
        user = self.context["request"].user
        plan = validated_data["plan_id"]
        coupon = validated_data.get("coupon_code")
        start_date = validated_data.get("start_date", timezone.now())

        # Create order with PENDING status (will be completed after payment)
        order = SubscriptionOrder.objects.create(
            user=user,
            plan=plan,
            coupon=coupon,
            order_type="SELF_PURCHASED",
            status="PENDING",
            start_date=start_date,
        )

        return order


class OrderCompletionSerializer(serializers.Serializer):
    """Serializer for completing pending orders (payment confirmation)"""

    transaction_id = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=1000)

    def update(self, instance, validated_data):
        # Update transaction details
        instance.transaction_id = validated_data.get(
            "transaction_id", instance.transaction_id
        )
        if validated_data.get("notes"):
            instance.notes += f"\n{validated_data['notes']}"

        # Complete the order
        subscription = instance.complete_order()

        return {"order": instance, "subscription": subscription}


class OrderCancellationSerializer(serializers.Serializer):
    """Serializer for cancelling orders"""

    reason = serializers.CharField(required=True, max_length=500)

    def update(self, instance, validated_data):
        reason = validated_data["reason"]
        instance.cancel_order(reason)
        return instance

#
# class SubscriptionCreateSerializer(serializers.ModelSerializer):
#     """Serializer for creating subscriptions"""
#
#     coupon_code = serializers.CharField(
#         required=False, allow_blank=True, write_only=True
#     )
#
#     class Meta:
#         model = Subscription
#         fields = ["plan", "coupon_code", "start_date"]
#
#     def validate_start_date(self, value):
#         if value < timezone.now().date():
#             raise serializers.ValidationError("Start date cannot be in the past")
#         return value
#
#     def validate(self, data):
#         user = self.context["request"].user
#         plan = data["plan"]
#         start_date = data.get("start_date", timezone.now().date())
#
#         # Convert start_date to datetime if it's a date
#         if hasattr(start_date, "date"):
#             start_datetime = start_date
#         else:
#             start_datetime = timezone.datetime.combine(
#                 start_date, timezone.datetime.min.time()
#             )
#             start_datetime = timezone.make_aware(start_datetime)
#
#         end_datetime = start_datetime + timezone.timedelta(days=plan.duration_days)
#
#         # Check for overlapping active subscriptions
#         overlapping_subscriptions = Subscription.objects.filter(
#             user=user,
#             status="ACTIVE",
#             start_date__lt=end_datetime,
#             end_date__gt=start_datetime,
#         )
#
#         if overlapping_subscriptions.exists():
#             raise serializers.ValidationError(
#                 "You already have an active subscription that overlaps with this period"
#             )
#
#         # Validate coupon if provided
#         coupon_code = data.get("coupon_code")
#         if coupon_code:
#             try:
#                 coupon = Coupon.objects.get(code=coupon_code.upper())
#                 if not coupon.is_valid():
#                     raise serializers.ValidationError(
#                         "Coupon is not valid or has expired"
#                     )
#
#                 # Check if coupon is applicable to this plan
#                 if not PlanCoupon.objects.filter(plan=plan, coupon=coupon).exists():
#                     raise serializers.ValidationError(
#                         "This coupon is not applicable to the selected plan"
#                     )
#
#                 data["coupon"] = coupon
#             except Coupon.DoesNotExist:
#                 raise serializers.ValidationError("Invalid coupon code")
#
#         return data
#
#     def create(self, validated_data):
#         user = self.context["request"].user
#         coupon_code = validated_data.pop("coupon_code", None)
#
#         # Set user
#         validated_data["user"] = user
#
#         # Set start_date as datetime if not already
#         start_date = validated_data.get("start_date", timezone.now())
#         if hasattr(start_date, "date") and not hasattr(start_date, "hour"):
#             validated_data["start_date"] = timezone.datetime.combine(
#                 start_date, timezone.datetime.min.time()
#             )
#             validated_data["start_date"] = timezone.make_aware(
#                 validated_data["start_date"]
#             )
#
#         subscription = Subscription.objects.create(**validated_data)
#
#         # Create subscription history
#         SubscriptionHistory.objects.create(
#             subscription=subscription,
#             action="CREATED",
#             details={
#                 "plan_name": subscription.plan.name,
#                 "original_price": str(subscription.original_price),
#                 "final_price": str(subscription.final_price),
#                 "coupon_used": (
#                     subscription.coupon.code if subscription.coupon else None
#                 ),
#             },
#         )
#
#         return subscription

# from django.utils import timezone
# from rest_framework import serializers
# from .models import Subscription, Coupon, PlanCoupon, SubscriptionHistory
#
# class SubscriptionCreateSerializer(serializers.ModelSerializer):
#     """Serializer for creating subscriptions"""
#
#     coupon_code = serializers.CharField(
#         required=False, allow_blank=True, write_only=True
#     )
#
#     class Meta:
#         model = Subscription
#         fields = ["plan", "coupon_code", "start_date"]
#
#     def validate_start_date(self, value):
#         """Ensure start date is not in the past, handle both date and datetime"""
#         now = timezone.now()
#         # If the field is a datetime, compare directly
#         if isinstance(value, timezone.datetime):
#             if value < now:
#                 raise serializers.ValidationError("Start date cannot be in the past.")
#         else:
#             # If it’s a date, compare to current date
#             if value < now.date():
#                 raise serializers.ValidationError("Start date cannot be in the past.")
#         return value
#
#     def validate(self, data):
#         user = self.context["request"].user
#         plan = data["plan"]
#         start_date = data.get("start_date", timezone.now())
#
#         # Normalize start_date to a datetime object
#         if isinstance(start_date, timezone.datetime):
#             start_datetime = start_date
#         else:
#             start_datetime = timezone.make_aware(
#                 timezone.datetime.combine(start_date, timezone.datetime.min.time())
#             )
#
#         end_datetime = start_datetime + timezone.timedelta(days=plan.duration_days)
#
#         # Check for overlapping active subscriptions
#         overlapping_subscriptions = Subscription.objects.filter(
#             user=user,
#             status="ACTIVE",
#             start_date__lt=end_datetime,
#             end_date__gt=start_datetime,
#         )
#
#         if overlapping_subscriptions.exists():
#             raise serializers.ValidationError(
#                 "You already have an active subscription that overlaps with this period."
#             )
#
#         # Validate coupon if provided
#         coupon_code = data.get("coupon_code")
#         if coupon_code:
#             try:
#                 coupon = Coupon.objects.get(code=coupon_code.upper())
#                 if not coupon.is_valid():
#                     raise serializers.ValidationError(
#                         "Coupon is not valid or has expired."
#                     )
#
#                 if not PlanCoupon.objects.filter(plan=plan, coupon=coupon).exists():
#                     raise serializers.ValidationError(
#                         "This coupon is not applicable to the selected plan."
#                     )
#
#                 data["coupon"] = coupon
#             except Coupon.DoesNotExist:
#                 raise serializers.ValidationError("Invalid coupon code.")
#
#         return data
#
#     def create(self, validated_data):
#         user = self.context["request"].user
#         validated_data["user"] = user
#         coupon_code = validated_data.pop("coupon_code", None)
#
#         # Normalize start_date to datetime
#         start_date = validated_data.get("start_date", timezone.now())
#         if isinstance(start_date, timezone.datetime):
#             validated_data["start_date"] = timezone.make_aware(start_date)
#         else:
#             validated_data["start_date"] = timezone.make_aware(
#                 timezone.datetime.combine(start_date, timezone.datetime.min.time())
#             )
#
#         subscription = Subscription.objects.create(**validated_data)
#
#         # Create subscription history
#         SubscriptionHistory.objects.create(
#             subscription=subscription,
#             action="CREATED",
#             details={
#                 "plan_name": subscription.plan.name,
#                 "original_price": str(subscription.original_price),
#                 "final_price": str(subscription.final_price),
#                 "coupon_used": (
#                     subscription.coupon.code if subscription.coupon else None
#                 ),
#             },
#         )
#
#         return subscription
#
# from django.utils import timezone
# from rest_framework import serializers
# from .models import Subscription, SubscriptionHistory
#
#
# class SubscriptionCreateSerializer(serializers.ModelSerializer):
#     """Serializer for creating subscriptions"""
#
#     class Meta:
#         model = Subscription
#         fields = ["plan", "coupon_code", "start_date"]
#
#     def create(self, validated_data):
#         user = self.context["request"].user
#         coupon_code = validated_data.pop("coupon_code", None)
#
#         validated_data["user"] = user
#         start_date = validated_data.get("start_date")
#
#         # ✅ Only make aware if datetime is naive
#         if start_date:
#             if timezone.is_naive(start_date):
#                 start_date = timezone.make_aware(start_date)
#
#         validated_data["start_date"] = start_date
#
#         # Let your model logic calculate end_date or handle price
#         subscription = Subscription.objects.create(**validated_data)
#
#         SubscriptionHistory.objects.create(
#             subscription=subscription,
#             action="CREATED",
#             details={
#                 "plan_name": subscription.plan.name,
#                 "original_price": str(subscription.original_price),
#                 "final_price": str(subscription.final_price),
#                 "coupon_used": (
#                     subscription.coupon.code if subscription.coupon else None
#                 ),
#             },
#         )
#
#         return subscription
#
# from django.utils import timezone
# from rest_framework import serializers
# from .models import Subscription
#
#
# class SubscriptionSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Subscription
#         fields = "__all__"
#
#     def validate_start_date(self, value):
#         """
#         Ensure the start date is not in the past.
#         """
#         now = timezone.now()
#         if value < now:
#             raise serializers.ValidationError("Start date cannot be in the past.")
#         return value
#
#     def create(self, validated_data):
#         """
#         Create a subscription instance ensuring the start_date is timezone-safe.
#         """
#         start_date = validated_data.get("start_date")
#
#         # ✅ Fix: only make aware if datetime is naive
#         if start_date:
#             if timezone.is_naive(start_date):
#                 validated_data["start_date"] = timezone.make_aware(start_date)
#             else:
#                 # Already aware — just use it as is
#                 validated_data["start_date"] = start_date
#
#         subscription = Subscription.objects.create(**validated_data)
#         return subscription


#
# from django.utils import timezone
# from rest_framework import serializers
# from .models import Subscription
#
#
# class SubscriptionSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Subscription
#         fields = "__all__"
#
#     def validate_start_date(self, value):
#         """
#         Ensure the start date is not in the past.
#         """
#         # Convert aware datetime to date before comparison
#         current_date = timezone.now().date()
#         if isinstance(value, timezone.datetime):
#             value_date = value.date()
#         else:
#             value_date = value
#
#         if value_date < current_date:
#             raise serializers.ValidationError("Start date cannot be in the past.")
#         return value
#
#     def create(self, validated_data):
#         """
#         Create a subscription instance ensuring the start_date is timezone-aware.
#         """
#         start_date = validated_data.get("start_date")
#
#         # Ensure start_date is timezone-aware (avoid double awareness)
#         if start_date:
#             if timezone.is_naive(start_date):
#                 validated_data["start_date"] = timezone.make_aware(start_date)
#             else:
#                 validated_data["start_date"] = start_date
#
#         subscription = Subscription.objects.create(**validated_data)
#         return subscription

#
# class SubscriptionSerializer(serializers.ModelSerializer):
#     """Serializer for displaying subscriptions"""
#
#     plan_name = serializers.CharField(source="plan.name", read_only=True)
#     plan_duration_days = serializers.IntegerField(
#         source="plan.duration_days", read_only=True
#     )
#     coupon_code = serializers.CharField(source="coupon.code", read_only=True)
#     user_username = serializers.CharField(source="user.username", read_only=True)
#     is_currently_active = serializers.SerializerMethodField()
#     days_remaining = serializers.SerializerMethodField()
#
#     class Meta:
#         model = Subscription
#         fields = [
#             "id",
#             "user_username",
#             "plan_name",
#             "plan_duration_days",
#             "coupon_code",
#             "start_date",
#             "end_date",
#             "status",
#             "original_price",
#             "discount_amount",
#             "final_price",
#             "is_currently_active",
#             "days_remaining",
#             "created_at",
#             "updated_at",
#         ]
#         read_only_fields = [
#             "id",
#             "original_price",
#             "discount_amount",
#             "final_price",
#             "created_at",
#             "updated_at",
#         ]
#
#     def get_is_currently_active(self, obj):
#         return obj.is_active()
#
#     def get_days_remaining(self, obj):
#         if obj.status != "ACTIVE":
#             return 0
#
#         now = timezone.now()
#         if now > obj.end_date:
#             return 0
#
#         return (obj.end_date - now).days
#
#
# class SubscriptionHistorySerializer(serializers.ModelSerializer):
#     """Serializer for subscription history"""
#
#     event_type_display = serializers.CharField(
#         source="get_event_type_display", read_only=True
#     )
#     subscription_id = serializers.UUIDField(source="subscription.id", read_only=True)
#     user_username = serializers.CharField(source="user.username", read_only=True)
#     coupon_code = serializers.CharField(source="coupon.code", read_only=True)
#
#     class Meta:
#         model = SubscriptionHistory
#         fields = [
#             "id",
#             "subscription_id",
#             "user_username",
#             "event_type",
#             "event_type_display",
#             "previous_values",
#             "new_values",
#             "coupon_code",
#             "timestamp",
#         ]
#         read_only_fields = fields  # All fields are read-only
#

class CouponValidationSerializer(serializers.Serializer):
    """Serializer for validating coupon codes"""

    coupon_code = serializers.CharField(max_length=50)
    plan_id = serializers.UUIDField()

    def validate(self, data):
        coupon_code = data["coupon_code"].upper()
        plan_id = data["plan_id"]

        try:
            coupon = Coupon.objects.get(code=coupon_code)
        except Coupon.DoesNotExist:
            raise serializers.ValidationError("Invalid coupon code")

        if not coupon.is_valid():
            raise serializers.ValidationError("Coupon is not valid or has expired")

        try:
            plan = Plan.objects.get(id=plan_id)
        except Plan.DoesNotExist:
            raise serializers.ValidationError("Invalid plan")

        if not PlanCoupon.objects.filter(plan=plan, coupon=coupon).exists():
            raise serializers.ValidationError(
                "This coupon is not applicable to the selected plan"
            )

        # Calculate discount
        discount_amount = coupon.calculate_discount(plan.price)
        final_price = plan.price - discount_amount

        data["coupon"] = coupon
        data["plan"] = plan
        data["discount_amount"] = discount_amount
        data["final_price"] = final_price

        return data


class PlanWithCouponsSerializer(PlanSerializer):
    """Extended plan serializer that includes available coupons"""

    available_coupons = serializers.SerializerMethodField()

    class Meta(PlanSerializer.Meta):
        fields = PlanSerializer.Meta.fields + ["available_coupons"]

    def get_available_coupons(self, obj):
        valid_coupons = []
        plan_coupons = PlanCoupon.objects.filter(plan=obj).select_related("coupon")

        for plan_coupon in plan_coupons:
            coupon = plan_coupon.coupon
            if coupon.is_valid():
                valid_coupons.append(
                    {
                        "code": coupon.code,
                        "discount_type": coupon.discount_type,
                        "discount_value": coupon.discount_value,
                        "end_date": coupon.end_date,
                    }
                )

        return valid_coupons

#
# class CreateSubscriptionSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Subscription
#         fields = [
#             "plan",
#             "coupon",
#             "subscription_source",
#             "start_date",
#             "end_date",
#             "status",
#         ]


from django.utils import timezone
from rest_framework import serializers
from django.db.models import Q
from apps.accounts.models import User
from .models import Subscription, SubscriptionHistory, Plan, Coupon, PlanCoupon, SubscriptionOrder


# For admin and user creation
# class SubscriptionCreateSerializer(serializers.ModelSerializer):
#     coupon_code = serializers.CharField(write_only=True, required=False, allow_blank=True)
#
#     class Meta:
#         model = Subscription
#         fields = ["plan", "coupon_code", "start_date"]
#
#     def validate_start_date(self, value):
#         if value < timezone.now():
#             raise serializers.ValidationError("Start date cannot be in the past.")
#         return value
#
#     def validate(self, data):
#         user = self.context.get("user") or self.context["request"].user
#         plan = data.get("plan")
#         coupon_code = data.get("coupon_code")
#         start_date = data.get("start_date", timezone.now())
#
#         # Handle coupon
#         coupon = None
#         if coupon_code:
#             try:
#                 coupon = Coupon.objects.get(code=coupon_code.upper(), is_active=True)
#                 if not coupon.is_valid():
#                     raise serializers.ValidationError("Coupon is not valid or expired")
#             except Coupon.DoesNotExist:
#                 raise serializers.ValidationError("Invalid coupon code")
#
#             # Check if coupon is applicable to plan
#             if not PlanCoupon.objects.filter(plan=plan, coupon=coupon).exists():
#                 raise serializers.ValidationError(
#                     "Coupon is not applicable to selected plan"
#                 )
#         data["coupon"] = coupon
#
#         # Check overlapping subscriptions
#         end_date = start_date + timezone.timedelta(days=plan.duration_days)
#         overlapping = Subscription.objects.filter(user=user, status="ACTIVE").filter(
#             Q(start_date__lt=end_date) & Q(end_date__gt=start_date)
#         )
#         if overlapping.exists():
#             raise serializers.ValidationError(
#                 "User already has an active subscription during this period"
#             )
#
#         return data
#
#     def create(self, validated_data):
#         user = self.context.get("user") or self.context["request"].user
#         coupon = validated_data.pop("coupon", None)
#         start_date = validated_data.pop("start_date", timezone.now())
#
#         if timezone.is_naive(start_date):
#             start_date = timezone.make_aware(start_date)
#
#         subscription = Subscription.objects.create(
#             user=user, coupon=coupon, start_date=start_date, **validated_data
#         )
#
#         # Create subscription history
#         SubscriptionHistory.objects.create(
#             subscription=subscription,
#             action="CREATED",
#             details={
#                 "plan_name": subscription.plan.name,
#                 "original_price": str(subscription.original_price),
#                 "final_price": str(subscription.final_price),
#                 "coupon_used": coupon.code if coupon else None,
#             },
#         )
#
#         return subscription
#
class SubscriptionCreateSerializer(serializers.ModelSerializer):
    # Write-only fields for creation
    user_id = serializers.UUIDField(write_only=True, required=False)
    # coupon_code = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Subscription
        fields = [
            "user_id",      # UUID of the user (optional for self-subscription)
            "plan",         # Plan ID
              # Optional coupon
            "start_date",   # Optional, defaults to now
        ]

    def validate_plan(self, value):
        if not Plan.objects.filter(id=value.id).exists():
            raise serializers.ValidationError("Plan does not exist")
        return value

    def validate_user_id(self, value):
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User not found")
        return value

    def validate_coupon_code(self, value):
        if value and not Coupon.objects.filter(code=value).exists():
            raise serializers.ValidationError("Invalid coupon code")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        user_id = validated_data.pop("user_id", None)
        # coupon_code = validated_data.pop("coupon_code", None)

        # Determine the user
        if request.user.is_staff and user_id:
            # Admin assigning subscription to any user
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                raise serializers.ValidationError({"user_id": "User not found"})
        else:
            # Regular user assigns subscription to self
            user = request.user

        # Handle coupon
        coupon = None
        # if coupon_code:
        #     try:
        #         coupon = Coupon.objects.get(code=coupon_code)
        #     except Coupon.DoesNotExist:
        #         raise serializers.ValidationError({"coupon_code": "Invalid coupon code"})

        # Set default start_date
        start_date = validated_data.get("start_date") or timezone.now()
        validated_data["start_date"] = start_date

        # Create subscription
        subscription = Subscription.objects.create(
            user=user,
            plan=validated_data["plan"],
            # coupon=coupon,
            start_date=start_date
        )

        return subscription
# Serializer for displaying subscriptions
class SubscriptionSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    # coupon_code = serializers.CharField(source="coupon.code", read_only=True)
    is_currently_active = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            "id",
            "user_username",
            "plan_name",

            "start_date",
            "end_date",
            "status",
            "original_price",
            "discount_amount",
            "final_price",
            "is_currently_active",
            "days_remaining",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_is_currently_active(self, obj):
        return obj.is_active()

    def get_days_remaining(self, obj):
        now = timezone.now()
        if obj.end_date < now:
            return 0
        return max(0, (obj.end_date - now).days)


# Subscription history serializer
class SubscriptionHistorySerializer(serializers.ModelSerializer):
    event_type_display = serializers.CharField(
        source="get_event_type_display", read_only=True
    )
    subscription_id = serializers.UUIDField(source="subscription.id", read_only=True)
    user_username = serializers.CharField(source="user.username", read_only=True)
    # coupon_code = serializers.CharField(source="coupon.code", read_only=True)

    class Meta:
        model = SubscriptionHistory
        fields = [
            "id",
            "subscription_id",
            "user_username",
            "event_type",
            "event_type_display",
            "previous_values",
            "new_values",

            "timestamp",
        ]
        read_only_fields = fields
