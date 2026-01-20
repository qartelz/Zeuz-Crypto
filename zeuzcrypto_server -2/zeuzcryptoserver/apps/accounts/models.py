# accounts/models.py

import uuid
import secrets
import string
from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.core.validators import RegexValidator
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.contrib.sites.models import Site

# import uuid
# from decimal import Decimal
# from django.db import models
# from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
# from django.core.validators import RegexValidator
# from django.utils import timezone
# from datetime import timedelta


# # Your existing User, UserBatch, and UserWallet models stay the same...


def default_session_expiry():
    return timezone.now() + timedelta(days=1)


def generate_token():
    """Generate secure random token (used for password setup/reset)."""
    return "".join(
        secrets.choice(string.ascii_letters + string.digits) for _ in range(32)
    )


class UserManager(BaseUserManager):
    def create_user(self, email, mobile, password=None, **extra_fields):
        if not email:
            raise ValueError("Email must be provided")
        if not mobile:
            raise ValueError("Mobile must be provided")

        email = self.normalize_email(email)
        user = self.model(email=email, mobile=mobile, **extra_fields)

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
            user.send_password_setup_email()

        user.save(using=self._db)

        # Auto create profile + wallet
        UserProfile.objects.create(user=user)
        UserWallet.objects.create(user=user, balance=1000000)

        return user

    def create_superuser(self, email, mobile, password=None, **extra_fields):
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_verified", True)
        extra_fields.setdefault("is_approved", True)

        if not password:
            raise ValueError("Superuser must have a password")

        return self.create_user(email, mobile, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("b2b_admin", "B2B Admin"),
        ("b2b_user", "B2B User"),
        ("b2c_user", "B2C User"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    mobile = models.CharField(
        max_length=15,
        unique=True,
        db_index=True,
        validators=[RegexValidator(r"^\+?1?\d{9,15}$")],
    )

    # Personal info
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)

    # Role
    role = models.CharField(
        max_length=20, choices=ROLE_CHOICES, default="b2c_user", db_index=True
    )

    # Hierarchy
    created_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_users",
    )
    batch = models.ForeignKey(
        "UserBatch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )

    # Status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_approved = models.BooleanField(default=False)

    # Timestamps
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    # Password setup/reset
    password_reset_token = models.CharField(max_length=64, blank=True, null=True)
    password_reset_expires = models.DateTimeField(null=True, blank=True)
    password_setup_token = models.CharField(max_length=64, blank=True, null=True)
    password_setup_expires = models.DateTimeField(null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["mobile"]

    class Meta:
        db_table = "account_user"
        indexes = [models.Index(fields=["email", "role", "created_by", "batch"])]

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip() or self.email

    def can_create_users(self):
        return self.role in ["admin", "b2b_admin"]

    def send_password_setup_email(self):
        self.password_setup_token = generate_token()
        self.password_setup_expires = timezone.now() + timedelta(hours=24)
        self.save(update_fields=["password_setup_token", "password_setup_expires"])

        subject = "Set your password"
        domain = Site.objects.get_current().domain
        # url = f"https://{domain}/auth/setup-password/{self.password_setup_token}/"
        url = f"http://localhost:5173/setup-password?token={self.password_setup_token}"

        html = render_to_string(
            "emails/password_setup.html", {"user": self, "setup_url": url}
        )
        send_mail(
            subject,
            strip_tags(html),
            "noreply@yourplatform.com",
            [self.email],
            html_message=html,
        )

    # def send_password_setup_email(self):
    #     self.password_setup_token = generate_token()
    #     self.password_setup_expires = timezone.now() + timedelta(hours=24)
    #     self.save(update_fields=["password_setup_token", "password_setup_expires"])

    #     subject = "Set your password"
    #     domain = Site.objects.get_current().domain
    #     url = f"https://{domain}/auth/setup-password/{self.password_setup_token}/"

    #     html = render_to_string("emails/password_setup.html", {"user": self, "setup_url": url})
    #     send_mail(subject, strip_tags(html), "noreply@yourplatform.com", [self.email], html_message=html)

    def send_password_reset_email(self):
        self.password_reset_token = generate_token()
        self.password_reset_expires = timezone.now() + timedelta(hours=1)
        self.save(update_fields=["password_reset_token", "password_reset_expires"])

        subject = "Reset your password"
        domain = Site.objects.get_current().domain
        # url = f"https://{domain}/auth/reset-password/{self.password_reset_token}/"
        url = f"http://localhost:5173/reset-password?token={self.password_reset_token}"
        html = render_to_string(
            "emails/password_reset.html", {"user": self, "reset_url": url}
        )
        send_mail(
            subject,
            strip_tags(html),
            "noreply@yourplatform.com",
            [self.email],
            html_message=html,
        )


class UserBatch(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="created_batches"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    max_users = models.PositiveIntegerField(default=100)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "account_batch"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    @property
    def user_count(self):
        return self.users.filter(is_active=True).count()

    def can_add_users(self):
        return self.is_active and self.user_count < self.max_users


class UserWallet(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="wallet")
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=1000000.00)

    class Meta:
        db_table = "account_wallet"

    def __str__(self):
        return f"{self.user.email} - {self.balance} coins"



class WalletTransaction(models.Model):
    """Track all wallet transactions for audit trail"""
    TRANSACTION_TYPES = [
        ('CREDIT', 'Credit'),
        ('DEBIT', 'Debit'),
        ('BLOCK', 'Block'),
        ('UNBLOCK', 'Unblock'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='wallet_transactions')
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    description = models.CharField(max_length=255)
    balance_before = models.DecimalField(max_digits=15, decimal_places=2)
    balance_after = models.DecimalField(max_digits=15, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Link to trade if applicable (optional)
    # Uncomment if you want to link wallet transactions to trades
    # trade_id = models.UUIDField(null=True, blank=True)
    
    class Meta:
        db_table = 'account_wallet_transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['transaction_type', 'created_at']),
            models.Index(fields=['user', 'transaction_type']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.transaction_type} - {self.amount}"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = "account_profile"

    def __str__(self):
        return f"{self.user.email} Profile"


class UserApproval(models.Model):
    STATUS = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="approval")
    status = models.CharField(max_length=20, choices=STATUS, default="pending")
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_users",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    class Meta:
        db_table = "account_approval"

    def __str__(self):
        return f"{self.user.email} - {self.status}"

    def approve(self, admin_user):
        self.status = "approved"
        self.approved_by = admin_user
        self.approved_at = timezone.now()
        self.save()
        self.user.is_approved = True
        self.user.save(update_fields=["is_approved"])

    def reject(self, reason=""):
        self.status = "rejected"
        self.rejection_reason = reason
        self.save()
        self.user.is_active = False
        self.user.save(update_fields=["is_active"])


# import uuid
# import secrets
# import string
# from datetime import timedelta
# from django.db import models
# from django.utils import timezone
# from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
# from django.core.validators import RegexValidator
# from django.core.mail import send_mail
# from django.template.loader import render_to_string
# from django.utils.html import strip_tags
# from django.contrib.sites.models import Site


# # ------------------------
# # Utility Functions
# # ------------------------

# def default_session_expiry():
# /*************  ✨ Windsurf Command ⭐  *************/
#     """
#     Return the default expiration time for a user session, which is
#     one day from the current time.
#     """
# /*******  fbaa1ceb-6050-45db-8afa-25dde3ee6de2  *******/
#     return timezone.now() + timedelta(days=1)

# def generate_token():
#     """Generate secure random token (used for password setup/reset)."""
#     return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))


# # ------------------------
# # Custom User Manager
# # ------------------------

# class UserManager(BaseUserManager):
#     def create_user(self, email, mobile, password=None, **extra_fields):
#         if not email:
#             raise ValueError("Email must be provided")
#         if not mobile:
#             raise ValueError("Mobile must be provided")

#         email = self.normalize_email(email)
#         user = self.model(email=email, mobile=mobile, **extra_fields)

#         if password:
#             user.set_password(password)
#         else:
#             user.set_unusable_password()
#             user.send_password_setup_email()

#         user.save(using=self._db)

#         # auto create profile + wallet
#         UserProfile.objects.create(user=user)
#         UserWallet.objects.create(user=user, balance=1000000)

#         return user

#     def create_superuser(self, email, mobile, password=None, **extra_fields):
#         extra_fields.setdefault("role", "admin")
#         extra_fields.setdefault("is_staff", True)
#         extra_fields.setdefault("is_superuser", True)
#         extra_fields.setdefault("is_verified", True)

#         if not password:
#             raise ValueError("Superuser must have a password")

#         return self.create_user(email, mobile, password, **extra_fields)


# # ------------------------
# # User Model
# # ------------------------

# class User(AbstractBaseUser, PermissionsMixin):
#     ROLE_CHOICES = [
#         ("admin", "Admin"),
#         ("b2b_admin", "B2B Admin"),
#         ("b2b_user", "B2B User"),
#         ("b2c_user", "B2C User"),
#     ]

#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     email = models.EmailField(unique=True, db_index=True)
#     mobile = models.CharField(
#         max_length=15, unique=True, db_index=True,
#         validators=[RegexValidator(r'^\+?1?\d{9,15}$')]
#     )

#     # personal info
#     first_name = models.CharField(max_length=30, blank=True)
#     last_name = models.CharField(max_length=30, blank=True)

#     # role
#     role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="b2c_user", db_index=True)

#     # hierarchy
#     created_by = models.ForeignKey(
#         "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="created_users"
#     )
#     batch = models.ForeignKey(
#         "UserBatch", on_delete=models.SET_NULL, null=True, blank=True, related_name="users"
#     )

#     # status
#     is_active = models.BooleanField(default=True)
#     is_staff = models.BooleanField(default=False)
#     is_verified = models.BooleanField(default=False)
#     is_approved = models.BooleanField(default=False)  # for B2B Admin approval

#     # timestamps
#     date_joined = models.DateTimeField(auto_now_add=True)
#     last_login = models.DateTimeField(null=True, blank=True)

#     # password setup/reset
#     password_reset_token = models.CharField(max_length=64, blank=True, null=True)
#     password_reset_expires = models.DateTimeField(null=True, blank=True)
#     password_setup_token = models.CharField(max_length=64, blank=True, null=True)
#     password_setup_expires = models.DateTimeField(null=True, blank=True)

#     objects = UserManager()

#     USERNAME_FIELD = "email"
#     REQUIRED_FIELDS = ["mobile"]

#     class Meta:
#         db_table = "account_user"
#         indexes = [models.Index(fields=["email", "role", "created_by", "batch"])]

#     def __str__(self):
#         return f"{self.email} ({self.role})"

#     # helpers
#     @property
#     def full_name(self):
#         return f"{self.first_name} {self.last_name}".strip() or self.email

#     def can_create_users(self):
#         return self.role in ["admin", "b2b_admin"]

#     # emails
#     def send_password_setup_email(self):
#         self.password_setup_token = generate_token()
#         self.password_setup_expires = timezone.now() + timedelta(hours=24)
#         self.save(update_fields=["password_setup_token", "password_setup_expires"])

#         subject = "Set your password"
#         domain = Site.objects.get_current().domain
#         url = f"https://{domain}/auth/setup-password/{self.password_setup_token}/"

#         html = render_to_string("emails/password_setup.html", {"user": self, "setup_url": url})
#         send_mail(subject, strip_tags(html), "noreply@yourplatform.com", [self.email], html_message=html)

#     def send_password_reset_email(self):
#         self.password_reset_token = generate_token()
#         self.password_reset_expires = timezone.now() + timedelta(hours=1)
#         self.save(update_fields=["password_reset_token", "password_reset_expires"])

#         subject = "Reset your password"
#         domain = Site.objects.get_current().domain
#         url = f"https://{domain}/auth/reset-password/{self.password_reset_token}/"

#         html = render_to_string("emails/password_reset.html", {"user": self, "reset_url": url})
#         send_mail(subject, strip_tags(html), "noreply@yourplatform.com", [self.email], html_message=html)


# # ------------------------
# # Batches for B2B Admins
# # ------------------------

# class UserBatch(models.Model):
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     name = models.CharField(max_length=100, unique=True)
#     description = models.TextField(blank=True)

#     created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="created_batches")
#     created_at = models.DateTimeField(auto_now_add=True)

#     max_users = models.PositiveIntegerField(default=100)
#     is_active = models.BooleanField(default=True)

#     class Meta:
#         db_table = "account_batch"
#         ordering = ["-created_at"]

#     def __str__(self):
#         return self.name

#     @property
#     def user_count(self):
#         return self.users.filter(is_active=True).count()

#     def can_add_users(self):
#         return self.is_active and self.user_count < self.max_users


# # ------------------------
# # Wallet
# # ------------------------

# class UserWallet(models.Model):
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="wallet")
#     balance = models.DecimalField(max_digits=15, decimal_places=2, default=1000000.00)

#     def __str__(self):
#         return f"{self.user.email} - {self.balance} coins"

#     class Meta:
#         db_table = "account_wallet"


# # ------------------------
# # Profiles
# # ------------------------

# class UserProfile(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
#     avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
#     address = models.TextField(blank=True)
#     city = models.CharField(max_length=100, blank=True)

#     class Meta :
#         db_table = "account_profile"


# # ------------------------
# # Approval for B2B Admins
# # ------------------------

# class UserApproval(models.Model):
#     STATUS = [("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")]

#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="approval")
#     status = models.CharField(max_length=20, choices=STATUS, default="pending")

#     approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="approved_users")
#     approved_at = models.DateTimeField(null=True, blank=True)
#     rejection_reason = models.TextField(blank=True)

#     def approve(self, admin_user):
#         self.status = "approved"
#         self.approved_by = admin_user
#         self.approved_at = timezone.now()
#         self.save()
#         self.user.is_approved = True
#         self.user.save(update_fields=["is_approved"])

#     def reject(self, reason=""):

#         self.status = "rejected"
#         self.rejection_reason = reason
#         self.save()
#         self.user.is_active = False
#         self.user.save(update_fields=["is_active"])
