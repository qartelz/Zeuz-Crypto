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


class SubscriptionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating subscriptions"""

    coupon_code = serializers.CharField(
        required=False, allow_blank=True, write_only=True
    )

    class Meta:
        model = Subscription
        fields = ["plan", "coupon_code", "start_date"]

    def validate_start_date(self, value):
        if value < timezone.now().date():
            raise serializers.ValidationError("Start date cannot be in the past")
        return value

    def validate(self, data):
        user = self.context["request"].user
        plan = data["plan"]
        start_date = data.get("start_date", timezone.now().date())

        # Convert start_date to datetime if it's a date
        if hasattr(start_date, "date"):
            start_datetime = start_date
        else:
            start_datetime = timezone.datetime.combine(
                start_date, timezone.datetime.min.time()
            )
            start_datetime = timezone.make_aware(start_datetime)

        end_datetime = start_datetime + timezone.timedelta(days=plan.duration_days)

        # Check for overlapping active subscriptions
        overlapping_subscriptions = Subscription.objects.filter(
            user=user,
            status="ACTIVE",
            start_date__lt=end_datetime,
            end_date__gt=start_datetime,
        )

        if overlapping_subscriptions.exists():
            raise serializers.ValidationError(
                "You already have an active subscription that overlaps with this period"
            )

        # Validate coupon if provided
        coupon_code = data.get("coupon_code")
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code=coupon_code.upper())
                if not coupon.is_valid():
                    raise serializers.ValidationError(
                        "Coupon is not valid or has expired"
                    )

                # Check if coupon is applicable to this plan
                if not PlanCoupon.objects.filter(plan=plan, coupon=coupon).exists():
                    raise serializers.ValidationError(
                        "This coupon is not applicable to the selected plan"
                    )

                data["coupon"] = coupon
            except Coupon.DoesNotExist:
                raise serializers.ValidationError("Invalid coupon code")

        return data

    def create(self, validated_data):
        user = self.context["request"].user
        coupon_code = validated_data.pop("coupon_code", None)

        # Set user
        validated_data["user"] = user

        # Set start_date as datetime if not already
        start_date = validated_data.get("start_date", timezone.now())
        if hasattr(start_date, "date") and not hasattr(start_date, "hour"):
            validated_data["start_date"] = timezone.datetime.combine(
                start_date, timezone.datetime.min.time()
            )
            validated_data["start_date"] = timezone.make_aware(
                validated_data["start_date"]
            )

        subscription = Subscription.objects.create(**validated_data)

        # Create subscription history
        SubscriptionHistory.objects.create(
            subscription=subscription,
            action="CREATED",
            details={
                "plan_name": subscription.plan.name,
                "original_price": str(subscription.original_price),
                "final_price": str(subscription.final_price),
                "coupon_used": (
                    subscription.coupon.code if subscription.coupon else None
                ),
            },
        )

        return subscription


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for displaying subscriptions"""

    plan_name = serializers.CharField(source="plan.name", read_only=True)
    plan_duration_days = serializers.IntegerField(
        source="plan.duration_days", read_only=True
    )
    coupon_code = serializers.CharField(source="coupon.code", read_only=True)
    user_username = serializers.CharField(source="user.username", read_only=True)
    is_currently_active = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            "id",
            "user_username",
            "plan_name",
            "plan_duration_days",
            "coupon_code",
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
        read_only_fields = [
            "id",
            "original_price",
            "discount_amount",
            "final_price",
            "created_at",
            "updated_at",
        ]

    def get_is_currently_active(self, obj):
        return obj.is_active()

    def get_days_remaining(self, obj):
        if obj.status != "ACTIVE":
            return 0

        now = timezone.now()
        if now > obj.end_date:
            return 0

        return (obj.end_date - now).days


class SubscriptionHistorySerializer(serializers.ModelSerializer):
    """Serializer for subscription history"""

    event_type_display = serializers.CharField(
        source="get_event_type_display", read_only=True
    )
    subscription_id = serializers.UUIDField(source="subscription.id", read_only=True)
    user_username = serializers.CharField(source="user.username", read_only=True)
    coupon_code = serializers.CharField(source="coupon.code", read_only=True)

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
            "coupon_code",
            "timestamp",
        ]
        read_only_fields = fields  # All fields are read-only


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


class CreateSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = ["name", "description", "price", "duration", "features", "is_active"]
