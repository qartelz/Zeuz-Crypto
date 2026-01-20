import uuid
from decimal import Decimal
from django.db import models, transaction
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.core.exceptions import ValidationError


class Plan(models.Model):
    """
    Subscription plan model supporting both B2B and B2C user types.
    Scalable design allows for future feature additions.
    """

    USER_TYPE_CHOICES = [
        ("B2B", "Business to Business"),
        ("B2C", "Business to Consumer"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField()
    duration_days = models.PositiveIntegerField(
        validators=[MinValueValidator(1)], help_text="Duration of the plan in days"
    )
    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))]
    )
    user_type = models.CharField(max_length=3, choices=USER_TYPE_CHOICES)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "subscription_plans"
        indexes = [
            models.Index(fields=["user_type", "is_active"]),
            models.Index(fields=["name", "user_type"]),
        ]
        # Allow same plan name for different user types
        unique_together = ["name", "user_type"]

    def __str__(self):
        return f"{self.name} ({self.user_type}) - {self.duration_days} days"

    def clean(self):
        if self.duration_days <= 0:
            raise ValidationError("Duration must be greater than 0 days")


class Coupon(models.Model):
    """
    Coupon model for discounts that can be applied to plans.
    """

    DISCOUNT_TYPE_CHOICES = [
        ("PERCENTAGE", "Percentage"),
        ("FIXED", "Fixed Amount"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    discount_type = models.CharField(max_length=10, choices=DISCOUNT_TYPE_CHOICES)
    discount_value = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))]
    )
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    usage_limit = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
        help_text="Maximum number of times this coupon can be used",
    )
    times_used = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "subscription_coupons"
        indexes = [
            models.Index(fields=["code", "is_active"]),
            models.Index(fields=["start_date", "end_date"]),
        ]

    def __str__(self):
        return f"{self.code} ({self.get_discount_type_display()})"

    def clean(self):
        if self.start_date >= self.end_date:
            raise ValidationError("End date must be after start date")

        if self.discount_type == "PERCENTAGE" and self.discount_value > 100:
            raise ValidationError("Percentage discount cannot exceed 100%")

    def is_valid(self):
        """Check if coupon is currently valid for use"""
        now = timezone.now()
        return (
            self.is_active
            and self.start_date <= now <= self.end_date
            and self.times_used < self.usage_limit
        )

    def calculate_discount(self, original_price):
        """Calculate discount amount based on discount type"""
        if not self.is_valid():
            return Decimal("0.00")

        if self.discount_type == "PERCENTAGE":
            return (original_price * self.discount_value) / 100
        else:  # FIXED
            return min(self.discount_value, original_price)


class PlanCoupon(models.Model):
    """
    Many-to-many relationship between Plans and Coupons.
    Allows specific coupons to be attached to specific plans.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(
        Plan, on_delete=models.CASCADE, related_name="plan_coupons"
    )
    coupon = models.ForeignKey(
        Coupon, on_delete=models.CASCADE, related_name="plan_coupons"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "subscription_plan_coupons"
        unique_together = ["plan", "coupon"]

    def __str__(self):
        return f"{self.plan.name} - {self.coupon.code}"


class SubscriptionOrder(models.Model):
    """
    Order layer to track all plan assignments and purchases.
    Every subscription must be created through an order.
    """

    ORDER_TYPE_CHOICES = [
        ("ADMIN_ASSIGNED", "Admin Assigned"),
        ("SELF_PURCHASED", "Self Purchased"),
        ("SYSTEM", "System Generated"),
    ]

    ORDER_STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("COMPLETED", "Completed"),
        ("FAILED", "Failed"),
        ("CANCELLED", "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription_orders",
    )
    plan = models.ForeignKey("Plan", on_delete=models.CASCADE, related_name="orders")
    order_type = models.CharField(max_length=20, choices=ORDER_TYPE_CHOICES)
    status = models.CharField(
        max_length=20, choices=ORDER_STATUS_CHOICES, default="PENDING"
    )
    coupon = models.ForeignKey(
        "Coupon",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    transaction_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="External payment transaction ID for future payment integration",
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Original plan price",
    )
    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Discount amount from coupon",
    )
    final_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00"))],
        help_text="Final amount after discount (amount - discount)",
    )
    start_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When subscription should start (defaults to now for completed orders)",
    )
    notes = models.TextField(blank=True, help_text="Additional notes about the order")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "subscription_orders"
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["order_type", "status"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["transaction_id"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.id} - {self.user.username} - {self.plan.name} ({self.status})"

    def clean(self):
        # B2B users can only get ADMIN_ASSIGNED orders
        if (
            hasattr(self.user, "profile")
            and getattr(self.user.profile, "user_type", None) == "B2B"
        ):
            if self.order_type == "SELF_PURCHASED":
                raise ValidationError(
                    "B2B users cannot self-purchase plans. Orders must be admin assigned."
                )

        # Validate coupon is applicable to plan
        if self.coupon and self.plan:
            if not PlanCoupon.objects.filter(
                plan=self.plan, coupon=self.coupon
            ).exists():
                raise ValidationError("Selected coupon is not applicable to this plan.")

    def calculate_pricing(self):
        """Calculate order pricing with coupon discount"""
        self.amount = self.plan.price
        self.discount = Decimal("0.00")

        if self.coupon and self.coupon.is_valid():
            self.discount = self.coupon.calculate_discount(self.amount)

        self.final_amount = self.amount - self.discount

    def save(self, *args, **kwargs):
        # Auto-calculate pricing
        if self.plan:
            self.calculate_pricing()

        # Auto-set start_date for completed orders if not provided
        if self.status == "COMPLETED" and not self.start_date:
            self.start_date = timezone.now()

        # Set completed_at timestamp when status changes to COMPLETED
        if self.status == "COMPLETED" and not self.completed_at:
            self.completed_at = timezone.now()

        super().save(*args, **kwargs)

    def complete_order(self, force=False):
        """
        Complete the order and create associated subscription.
        Returns the created subscription or None if already completed.
        """
        with transaction.atomic():
            if self.status == "COMPLETED" and not force:
                # Check if subscription already exists
                existing_subscription = Subscription.objects.filter(
                    user=self.user,
                    plan=self.plan,
                    subscription_source=self.order_type,
                    created_at__gte=self.completed_at,
                ).first()

                if existing_subscription:
                    return existing_subscription

            # Validate order can be completed
            if self.status in ["FAILED", "CANCELLED"]:
                raise ValidationError(
                    f"Cannot complete order with status: {self.status}"
                )

            # Validate coupon usage if present
            if self.coupon:
                if not self.coupon.is_valid():
                    raise ValidationError("Coupon is no longer valid")

                # Increment coupon usage (will be handled in subscription save)
                pass

            # Mark order as completed
            old_status = self.status
            self.status = "COMPLETED"
            if not self.completed_at:
                self.completed_at = timezone.now()
            if not self.start_date:
                self.start_date = timezone.now()

            self.save()

            # Create subscription
            subscription = Subscription.objects.create(
                user=self.user,
                plan=self.plan,
                coupon=self.coupon,
                start_date=self.start_date,
                subscription_source=self.order_type,
                original_price=self.amount,
                discount_amount=self.discount,
                final_price=self.final_amount,
                status="ACTIVE",
            )

            # Log order completion in history
            SubscriptionHistory.log_event(
                subscription=subscription,
                event_type="ORDER_COMPLETED",
                new_values={
                    "order_id": str(self.id),
                    "order_type": self.order_type,
                    "transaction_id": self.transaction_id,
                    "original_status": old_status,
                    "amount": str(self.amount),
                    "discount": str(self.discount),
                    "final_amount": str(self.final_amount),
                    "coupon_code": self.coupon.code if self.coupon else None,
                },
            )

            return subscription

    def cancel_order(self, reason=None):
        """Cancel the order and log the reason"""
        if self.status == "COMPLETED":
            raise ValidationError("Cannot cancel completed order")

        old_status = self.status
        self.status = "CANCELLED"
        if reason:
            self.notes += f"\nCancelled: {reason}"
        self.save()

        # Log cancellation
        if (
            hasattr(self, "_subscription")
            or Subscription.objects.filter(
                user=self.user, plan=self.plan, created_at__gte=self.created_at
            ).exists()
        ):
            subscription = Subscription.objects.filter(
                user=self.user, plan=self.plan, created_at__gte=self.created_at
            ).first()
            if subscription:
                SubscriptionHistory.log_event(
                    subscription=subscription,
                    event_type="ORDER_CANCELLED",
                    previous_values={"status": old_status},
                    new_values={
                        "status": "CANCELLED",
                        "reason": reason,
                        "order_id": str(self.id),
                    },
                )


# Updated Subscription model with subscription_source
class Subscription(models.Model):
    """
    User subscription model tracking active subscriptions.
    Now linked to orders for complete audit trail.
    """

    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("EXPIRED", "Expired"),
        ("CANCELLED", "Cancelled"),
    ]

    # Source choices should match SubscriptionOrder.ORDER_TYPE_CHOICES
    SOURCE_CHOICES = [
        ("ADMIN_ASSIGNED", "Admin Assigned"),
        ("SELF_PURCHASED", "Self Purchased"),
        ("SYSTEM", "System Generated"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="subscriptions"
    )
    plan = models.ForeignKey(
        Plan, on_delete=models.CASCADE, related_name="subscriptions"
    )
    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="subscriptions",
    )
    # NEW: Track how this subscription was created
    subscription_source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        default="SELF_PURCHASED",
        help_text="How this subscription was created",
    )
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="ACTIVE")
    original_price = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )
    final_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "subscription_user_subscriptions"
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["start_date", "end_date"]),
            models.Index(fields=["status", "end_date"]),
            models.Index(fields=["subscription_source"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.plan.name} ({self.status}) - {self.subscription_source}"

    def clean(self):
        if self.start_date >= self.end_date:
            raise ValidationError("End date must be after start date")

    def is_active(self):
        """Check if subscription is currently active"""
        now = timezone.now()
        return self.status == "ACTIVE" and self.start_date <= now <= self.end_date

    def calculate_pricing(self):
        """Calculate final pricing with coupon discount"""
        self.original_price = self.plan.price
        self.discount_amount = Decimal("0.00")

        if self.coupon and self.coupon.is_valid():
            self.discount_amount = self.coupon.calculate_discount(self.original_price)

        self.final_price = self.original_price - self.discount_amount

    def save(self, *args, **kwargs):
        # Capture the previous state for history
        is_new = self._state.adding
        if not is_new:
            previous_instance = Subscription.objects.get(pk=self.pk)
            previous_values = {
                "status": previous_instance.status,
                "start_date": previous_instance.start_date.isoformat(),
                "end_date": previous_instance.end_date.isoformat(),
                "original_price": str(previous_instance.original_price),
                "discount_amount": str(previous_instance.discount_amount),
                "final_price": str(previous_instance.final_price),
            }

        # Auto-calculate end_date if not provided
        if not self.end_date and self.start_date:
            self.end_date = self.start_date + timezone.timedelta(
                days=self.plan.duration_days
            )

        # Calculate pricing if not already set
        if not self.original_price:
            self.calculate_pricing()

        # Save the instance
        super().save(*args, **kwargs)

        # Prepare new values for history
        new_values = {
            "status": self.status,
            "start_date": self.start_date.isoformat(),
            "end_date": self.end_date.isoformat(),
            "original_price": str(self.original_price),
            "discount_amount": str(self.discount_amount),
            "final_price": str(self.final_price),
            "subscription_source": self.subscription_source,
        }

        # Create history entry for new subscription
        if is_new:
            SubscriptionHistory.log_event(
                subscription=self,
                event_type="CREATED",
                new_values={
                    **new_values,
                    "plan": str(self.plan.id),
                    "plan_name": self.plan.name,
                },
            )
        # Create history for changes
        elif not is_new and previous_values != {
            k: v for k, v in new_values.items() if k in previous_values
        }:
            event_type = (
                "STATUS_CHANGED"
                if previous_values["status"] != new_values["status"]
                else "UPDATED"
            )
            SubscriptionHistory.log_event(
                subscription=self,
                event_type=event_type,
                previous_values=previous_values,
                new_values=new_values,
            )

        # Handle coupon application
        if self.coupon and self._state.adding:
            self.coupon.times_used += 1
            self.coupon.save(update_fields=["times_used"])

            if self.discount_amount > 0:
                SubscriptionHistory.log_event(
                    subscription=self,
                    event_type="COUPON_APPLIED",
                    coupon=self.coupon,
                    new_values={
                        "coupon_code": self.coupon.code,
                        "discount_amount": str(self.discount_amount),
                        "final_price": str(self.final_price),
                    },
                )


# Updated SubscriptionHistory with new event types
class SubscriptionHistory(models.Model):
    """
    Track subscription lifecycle events with detailed history.
    Now includes order-related events.
    """

    EVENT_TYPES = [
        ("CREATED", "Subscription Created"),
        ("RENEWED", "Subscription Renewed"),
        ("CANCELLED", "Subscription Cancelled"),
        ("EXPIRED", "Subscription Expired"),
        ("UPDATED", "Subscription Updated"),
        ("COUPON_APPLIED", "Coupon Applied"),
        ("STATUS_CHANGED", "Status Changed"),
        # New order-related events
        ("ORDER_CREATED", "Order Created"),
        ("ORDER_COMPLETED", "Order Completed"),
        ("ORDER_CANCELLED", "Order Cancelled"),
        ("ORDER_FAILED", "Order Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(
        Subscription, on_delete=models.CASCADE, related_name="history"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="subscription_history",
    )
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default="UPDATED")
    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="history_entries",
    )
    previous_values = models.JSONField(default=dict, blank=True)
    new_values = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "subscription_history"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "event_type"]),
            models.Index(fields=["subscription", "event_type"]),
        ]

    def __str__(self):
        # Use email or another unique field if username does not exist
        user_display = (
            self.user.email if hasattr(self.user, "email") else str(self.user)
        )
        return f"{self.event_type} for {user_display} on {self.created_at}"

    @classmethod
    def log_event(
        cls,
        subscription,
        event_type,
        previous_values=None,
        new_values=None,
        coupon=None,
    ):
        """
        Helper method to create history entries consistently.
        """
        return cls.objects.create(
            subscription=subscription,
            user=subscription.user,
            event_type=event_type,
            previous_values=previous_values or {},
            new_values=new_values or {},
            coupon=coupon,
        )


# class Subscription(models.Model):
#     """
#     User subscription model tracking active subscriptions.
#     """
#     STATUS_CHOICES = [
#         ('ACTIVE', 'Active'),
#         ('EXPIRED', 'Expired'),
#         ('CANCELLED', 'Cancelled'),
#     ]

#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     user = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.CASCADE,
#         related_name='subscriptions'
#     )
#     plan = models.ForeignKey(
#         Plan,
#         on_delete=models.CASCADE,
#         related_name='subscriptions'
#     )
#     coupon = models.ForeignKey(
#         Coupon,
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name='subscriptions'
#     )
#     start_date = models.DateTimeField()
#     end_date = models.DateTimeField()
#     status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='ACTIVE')
#     original_price = models.DecimalField(max_digits=10, decimal_places=2)
#     discount_amount = models.DecimalField(
#         max_digits=10,
#         decimal_places=2,
#         default=Decimal('0.00')
#     )
#     final_price = models.DecimalField(max_digits=10, decimal_places=2)
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = 'subscription_user_subscriptions'
#         indexes = [
#             models.Index(fields=['user', 'status']),
#             models.Index(fields=['start_date', 'end_date']),
#             models.Index(fields=['status', 'end_date']),
#         ]

#     def __str__(self):
#         return f"{self.user.username} - {self.plan.name} ({self.status})"

#     def clean(self):
#         if self.start_date >= self.end_date:
#             raise ValidationError("End date must be after start date")

#     def is_active(self):
#         """Check if subscription is currently active"""
#         now = timezone.now()
#         return (
#             self.status == 'ACTIVE' and
#             self.start_date <= now <= self.end_date
#         )

#     def calculate_pricing(self):
#         """Calculate final pricing with coupon discount"""
#         self.original_price = self.plan.price
#         self.discount_amount = Decimal('0.00')

#         if self.coupon and self.coupon.is_valid():
#             self.discount_amount = self.coupon.calculate_discount(self.original_price)

#         self.final_price = self.original_price - self.discount_amount

#     def save(self, *args, **kwargs):
#         # Capture the previous state for history
#         is_new = self._state.adding
#         if not is_new:
#             previous_instance = Subscription.objects.get(pk=self.pk)
#             previous_values = {
#                 'status': previous_instance.status,
#                 'start_date': previous_instance.start_date.isoformat(),
#                 'end_date': previous_instance.end_date.isoformat(),
#                 'original_price': str(previous_instance.original_price),
#                 'discount_amount': str(previous_instance.discount_amount),
#                 'final_price': str(previous_instance.final_price),
#             }

#         # Auto-calculate end_date if not provided
#         if not self.end_date and self.start_date:
#             self.end_date = self.start_date + timezone.timedelta(days=self.plan.duration_days)

#         # Calculate pricing
#         self.calculate_pricing()

#         # Save the instance
#         super().save(*args, **kwargs)

#         # Prepare new values for history
#         new_values = {
#             'status': self.status,
#             'start_date': self.start_date.isoformat(),
#             'end_date': self.end_date.isoformat(),
#             'original_price': str(self.original_price),
#             'discount_amount': str(self.discount_amount),
#             'final_price': str(self.final_price),
#         }

#         # Create history entry for new subscription
#         if is_new:
#             SubscriptionHistory.log_event(
#                 subscription=self,
#                 event_type='CREATED',
#                 new_values={
#                     **new_values,
#                     'plan': str(self.plan.id),
#                     'plan_name': self.plan.name,
#                 }
#             )
#         # Create history for changes
#         elif previous_values != new_values:
#             event_type = 'STATUS_CHANGED' if previous_values['status'] != new_values['status'] else 'UPDATED'
#             SubscriptionHistory.log_event(
#                 subscription=self,
#                 event_type=event_type,
#                 previous_values=previous_values,
#                 new_values=new_values
#             )

#         # Handle coupon application
#         if self.coupon and self._state.adding:
#             self.coupon.times_used += 1
#             self.coupon.save(update_fields=['times_used'])

#             if self.discount_amount > 0:
#                 SubscriptionHistory.log_event(
#                     subscription=self,
#                     event_type='COUPON_APPLIED',
#                     coupon=self.coupon,
#                     new_values={
#                         'coupon_code': self.coupon.code,
#                         'discount_amount': str(self.discount_amount),
#                         'final_price': str(self.final_price)
#                     }
#                 )


# class SubscriptionHistory(models.Model):
#     """
#     Track subscription lifecycle events with detailed history.
#     Stores both the event type and the changes made in JSON format.
#     """
#     EVENT_TYPES = [
#         ('CREATED', 'Subscription Created'),
#         ('RENEWED', 'Subscription Renewed'),
#         ('CANCELLED', 'Subscription Cancelled'),
#         ('EXPIRED', 'Subscription Expired'),
#         ('UPDATED', 'Subscription Updated'),
#         ('COUPON_APPLIED', 'Coupon Applied'),
#         ('STATUS_CHANGED', 'Status Changed')
#     ]

#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     subscription = models.ForeignKey(
#         Subscription,
#         on_delete=models.CASCADE,
#         related_name='history'
#     )
#     user = models.ForeignKey(
#         settings.AUTH_USER_MODEL,
#         on_delete=models.SET_NULL,
#         null=True,
#         related_name='subscription_history'
#     )
#     event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default='UPDATED')
#     coupon = models.ForeignKey(
#         Coupon,
#         on_delete=models.SET_NULL,
#         null=True,
#         blank=True,
#         related_name='history_entries'
#     )
#     previous_values = models.JSONField(default=dict, blank=True)
#     new_values = models.JSONField(default=dict, blank=True)
#     created_at = models.DateTimeField(auto_now_add=True, db_index=True)

#     class Meta:
#         db_table = 'subscription_history'
#         ordering = ['-created_at']
#         indexes = [
#             models.Index(fields=['user', 'event_type']),
#             models.Index(fields=['subscription', 'event_type']),
#         ]

#     def __str__(self):
#         return f"{self.subscription.id} - {self.event_type} at {self.created_at}"

#     @classmethod
#     def log_event(cls, subscription, event_type, previous_values=None, new_values=None, coupon=None):
#         """
#         Helper method to create history entries consistently.
#         """
#         return cls.objects.create(
#             subscription=subscription,
#             user=subscription.user,
#             event_type=event_type,
#             previous_values=previous_values or {},
#             new_values=new_values or {},
#             coupon=coupon
#         )
