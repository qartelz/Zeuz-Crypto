from rest_framework import serializers
from django.utils import timezone
from apps.accounts.models import User, UserBatch
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

    user_username = serializers.CharField(source="user.full_name", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    plan_duration = serializers.IntegerField(
        source="plan.duration_days", read_only=True
    )
    coupon_code = serializers.CharField(source="coupon.code", read_only=True)
    order_type_display = serializers.CharField(
        source="get_order_type_display", read_only=True
    )
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    batch_name = serializers.SerializerMethodField()

    class Meta:
        model = SubscriptionOrder
        fields = [
            "id",
            "user_username",
            "user_email",
            "batch_name",
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
            "batch_name",
            "amount",
            "discount",
            "final_amount",
            "created_at",
            "updated_at",
            "completed_at",
        ]

    def get_batch_name(self, obj):
        try:
            if not obj.user:
                return None
            
            # Use getattr to safely access batch, handling potential lazy loading or missing field
            if hasattr(obj.user, 'batch') and obj.user.batch:
                return obj.user.batch.name
            return None
        except Exception as e:
            # Fallback to avoid breaking the entire API response
            print(f"Error fetching batch name for order {obj.id}: {e}")
            return None


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



from django.utils import timezone
from rest_framework import serializers
from django.db.models import Q
from apps.accounts.models import User
from .models import Subscription, SubscriptionHistory, Plan, Coupon, PlanCoupon, SubscriptionOrder


class UserMiniSerializer(serializers.ModelSerializer):
    """Minimal user details for display inside subscription"""
    class Meta:
        model = User
        fields = ["id",  "email", "first_name", "last_name"]

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
    # user_username = serializers.CharField(source="user.username", read_only=True)
    user = UserMiniSerializer(read_only=True)
    plan_name = serializers.CharField(source="plan.name", read_only=True)
    # coupon_code = serializers.CharField(source="coupon.code", read_only=True)
    is_currently_active = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = Subscription
        fields = [
            "id",
            # "user_username",
            "user",
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
    user = UserMiniSerializer(read_only=True)
    # user_username = serializers.CharField(source="user.username", read_only=True)
    # coupon_code = serializers.CharField(source="coupon.code", read_only=True)

    class Meta:
        model = SubscriptionHistory
        fields = [
            "id",
            "subscription_id",
            # "user_username",
            "user",
            "event_type",
            "event_type_display",
            "previous_values",
            "new_values",

            "timestamp",
        ]
        read_only_fields = fields


class BatchSubscriptionStatsSerializer(serializers.ModelSerializer):
    """Serializer for displaying batch with subscription statistics"""
    total_students = serializers.SerializerMethodField()
    active_subscriptions = serializers.SerializerMethodField()
    expired_subscriptions = serializers.SerializerMethodField()
    pending_requests = serializers.SerializerMethodField()
    
    class Meta:
        model = UserBatch
        fields = [
            'id', 'name', 'created_at', 'max_users', 
            'total_students', 'active_subscriptions', 'expired_subscriptions', 'pending_requests'
        ]
        
    def get_total_students(self, obj):
        if hasattr(obj, 'annotated_total_students'):
            return obj.annotated_total_students
        return obj.users.count()
        
    def get_active_subscriptions(self, obj):
        if hasattr(obj, 'annotated_active_subs'):
            return obj.annotated_active_subs
            
        # Fallback
        return Subscription.objects.filter(
            user__batch=obj,
            status='ACTIVE', 
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        ).values('user').distinct().count()
        
    def get_expired_subscriptions(self, obj):
        # 1. Get users in batch
        batch_users_ids = obj.users.values_list('id', flat=True)
        
        # 2. Users with active subs
        users_with_active = Subscription.objects.filter(
            user__id__in=batch_users_ids,
            status='ACTIVE',
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        ).values_list('user', flat=True)
        
        # 3. Users with ONLY expired subs (and no active)
        users_with_expired = Subscription.objects.filter(
            user__id__in=batch_users_ids,
            status='EXPIRED'
        ).exclude(
            user__id__in=users_with_active
        ).values('user').distinct().count()
        
        return users_with_expired

    def get_pending_requests(self, obj):
        if hasattr(obj, 'annotated_pending_requests'):
            return obj.annotated_pending_requests
            
        # Count pending B2B requests for users in this batch
        return SubscriptionOrder.objects.filter(
            user__batch=obj,
            order_type="B2B_REQUEST",
            status="PENDING"
        ).count()


class UserSubscriptionStatusSerializer(serializers.ModelSerializer):
    """Serializer for detailing a user's subscription status within a batch"""
    subscription = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'full_name', 'email', 'mobile', 'is_active', 'subscription']
        
    def get_subscription(self, obj):
        now = timezone.now()
        
        # Check for prefetched data
        prefetched = self.context.get('prefetched', False)
        
        if prefetched:
            # 1. Check for Pending B2B Request (Prefetched)
            # Access the prefetched list assigned in viewset
            pending_requests = getattr(obj, 'prefetched_pending_requests', [])
            pending_request = pending_requests[0] if pending_requests else None
            
            if pending_request:
                return {
                    "id": pending_request.id,
                    "status": "PENDING_APPROVAL",
                    "plan_name": pending_request.plan.name,
                    "plan_duration": pending_request.plan.duration_days,
                    "requested_at": pending_request.created_at,
                }

            # 2. Check for active (Prefetched)
            active_subs = getattr(obj, 'prefetched_active_subs', [])
            active_sub = active_subs[0] if active_subs else None
            
            if active_sub:
                return {
                    "id": active_sub.id,
                    "status": active_sub.status,
                    "plan_name": active_sub.plan.name,
                    "plan_duration": active_sub.plan.duration_days,
                    "start_date": active_sub.start_date,
                    "end_date": active_sub.end_date,
                }
            
            # If nothing found in prefetched, return None (assuming prefetches cover all relevant cases)
            return None

        # Fallback to original queries if not prefetched
        
        # 1. Check for Pending B2B Request FIRST
        pending_request = SubscriptionOrder.objects.filter(
            user=obj,
            order_type="B2B_REQUEST",
            status="PENDING"
        ).select_related('plan').first()

        if pending_request:
            return {
                "id": pending_request.id,
                "status": "PENDING_APPROVAL",
                "plan_name": pending_request.plan.name,
                "plan_duration": pending_request.plan.duration_days,
                "requested_at": pending_request.created_at,
            }

        # 2. Check for active
        active_sub = Subscription.objects.filter(
            user=obj,
            status='ACTIVE',
            start_date__lte=now,
            end_date__gte=now
        ).select_related('plan').first()
        
        if active_sub:
            return {
                "id": active_sub.id,
                "status": "ACTIVE",
                "plan_name": active_sub.plan.name,
                "end_date": active_sub.end_date,
                "days_remaining": (active_sub.end_date - now).days
            }
            
        # 3. Check for upcoming (scheduled)
        upcoming_sub = Subscription.objects.filter(
            user=obj,
            status='ACTIVE',
            start_date__gt=now
        ).select_related('plan').order_by('start_date').first()
        
        if upcoming_sub:
             return {
                "id": upcoming_sub.id,
                "status": "SCHEDULED",
                "plan_name": upcoming_sub.plan.name,
                "start_date": upcoming_sub.start_date,
                "end_date": upcoming_sub.end_date,
            }
            
        # 4. Check for most recent expired
        expired_sub = Subscription.objects.filter(
            user=obj
        ).select_related('plan').order_by('-end_date').first()
        
        if expired_sub:
             return {
                "id": expired_sub.id,
                "status": expired_sub.status, #"EXPIRED" or "CANCELLED" usually
                "plan_name": expired_sub.plan.name,
                "end_date": expired_sub.end_date,
            }
            
        return None

class SubscriptionRequestSerializer(serializers.Serializer):
    """Serializer for B2B Admins to request subscriptions"""
    user_id = serializers.UUIDField()
    plan_id = serializers.UUIDField()
    start_date = serializers.DateTimeField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=1000)

    def validate_user_id(self, value):
        try:
            user = User.objects.get(id=value)
            # Verify user belongs to a batch created by this B2B admin?
            # Ideally yes, but viewset permission checks might suffice.
            # For now just check existence.
            return user
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")

    def validate_plan_id(self, value):
        try:
            plan = Plan.objects.get(id=value, is_active=True)
            return plan
        except Plan.DoesNotExist:
            raise serializers.ValidationError("Plan not found or inactive")

    def validate(self, data):
        user = data.get("user_id")
        plan = data.get("plan_id")
        start_date = data.get("start_date", timezone.now())

        # Check for existing PENDING request for this user
        if SubscriptionOrder.objects.filter(
            user=user, 
            status="PENDING",
            order_type="B2B_REQUEST"
        ).exists():
             raise serializers.ValidationError(
                "This user already has a pending subscription request."
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
        start_date = validated_data.get("start_date", timezone.now())
        notes = validated_data.get("notes", "")
        
        # Create order request
        order = SubscriptionOrder.objects.create(
            user=user,
            plan=plan,
            order_type="B2B_REQUEST",
            status="PENDING",
            start_date=start_date,
            notes=notes,
            amount=plan.price,
            final_amount=plan.price # No coupons for B2B requests for now
        )
        
        return order
