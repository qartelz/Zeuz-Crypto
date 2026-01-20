# # from django.db import models

# # # Create your models here.
# # # models.py
# # from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
# # from django.db import models
# # from django.conf import settings
# # from django.core.validators import RegexValidator
# # from django.utils import timezone
# # import uuid


# # class UserManager(BaseUserManager):
# #     def create_user(self, email, mobile, password=None, **extra_fields):
# #         if not email:
# #             raise ValueError('Email must be provided')
# #         if not mobile:
# #             raise ValueError('Mobile must be provided')

# #         email = self.normalize_email(email)
# #         extra_fields.setdefault('is_active', True)

# #         user = self.model(email=email, mobile=mobile, **extra_fields)
# #         if password:
# #             user.set_password(password)
# #         else:
# #             user.set_unusable_password()
# #         user.save(using=self._db)
# #         return user

# #     def create_superuser(self, email, mobile, password=None, **extra_fields):
# #         extra_fields.setdefault('is_staff', True)
# #         extra_fields.setdefault('is_superuser', True)
# #         extra_fields.setdefault('is_active', True)

# #         if not extra_fields.get('is_staff'):
# #             raise ValueError('Superuser must have is_staff=True.')
# #         if not extra_fields.get('is_superuser'):
# #             raise ValueError('Superuser must have is_superuser=True.')

# #         return self.create_user(email, mobile, password, **extra_fields)


# # class User(AbstractBaseUser, PermissionsMixin):
# #     ROLE_CHOICES = (
# #         ('user_admin', 'User Admin'),
# #         ('b2b_admin', 'B2B Admin'),
# #         ('b2b_user', 'B2B User'),
# #         ('b2c_user', 'B2C User'),
# #     )

# #     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
# #     email = models.EmailField(unique=True)
# #     mobile = models.CharField(
# #         max_length=15,
# #         unique=True,
# #         validators=[RegexValidator(
# #             regex=r'^\+?1?\d{9,15}$',
# #             message="Mobile number format: '+999999999'. Up to 15 digits allowed."
# #         )]
# #     )
# #     first_name = models.CharField(max_length=30)
# #     last_name = models.CharField(max_length=30, blank=True)
# #     role = models.CharField(max_length=20, choices=ROLE_CHOICES, db_index=True, default='b2b_user')

# #     date_joined = models.DateTimeField(auto_now_add=True)
# #     last_login = models.DateTimeField(null=True, blank=True)

# #     is_active = models.BooleanField(default=True)
# #     is_staff = models.BooleanField(default=False)
# #     is_verified = models.BooleanField(default=False)

# #     objects = UserManager()

# #     USERNAME_FIELD = 'email'
# #     REQUIRED_FIELDS = ['mobile', 'role']

# #     class Meta:
# #         # db_table = 'users'
# #         indexes = [
# #             models.Index(fields=['mobile']),
# #             models.Index(fields=['role']),
# #             models.Index(fields=['is_active']),
# #         ]

# #     def __str__(self):
# #         return f"{self.email} ({self.mobile})"

# #     def get_full_name(self):
# #         return f"{self.first_name} {self.last_name}".strip()

# #     def get_short_name(self):
# #         return self.first_name


# # class UserSession(models.Model):
# #     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
# #     user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
# #     session_key = models.CharField(max_length=40, unique=True, db_index=True)

# #     created_at = models.DateTimeField(auto_now_add=True)
# #     last_activity = models.DateTimeField(auto_now=True)
# #     expires_at = models.DateTimeField()

# #     ip_address = models.GenericIPAddressField()
# #     is_active = models.BooleanField(default=True)

# #     terminated_at = models.DateTimeField(null=True, blank=True)
# #     termination_reason = models.CharField(max_length=50, blank=True)  # logout, timeout, forced

# #     class Meta:
# #         db_table = 'user_sessions'
# #         indexes = [
# #             models.Index(fields=['user', 'is_active']),
# #             models.Index(fields=['session_key']),
# #         ]

# #     def __str__(self):
# #         return f"{self.user.email} ({self.ip_address})"

# #     @property
# #     def is_expired(self):
# #         return timezone.now() > self.expires_at

# #     def terminate(self, reason='logout'):
# #         self.is_active = False
# #         self.terminated_at = timezone.now()
# #         self.termination_reason = reason
# #         self.save(update_fields=['is_active', 'terminated_at', 'termination_reason'])


# # class UserLoginHistory(models.Model):
# #     LOGIN_STATUS_CHOICES = (
# #         ('success', 'Success'),
# #         ('failed_credentials', 'Failed - Invalid Credentials'),
# #         ('failed_locked', 'Failed - Account Locked'),
# #         ('failed_inactive', 'Failed - Account Inactive'),
# #         ('failed_verification', 'Failed - Email Not Verified'),
# #     )

# #     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
# #     user = models.ForeignKey(
# #         User,
# #         on_delete=models.CASCADE,
# #         related_name='login_history',
# #         null=True, blank=True
# #     )
# #     email_attempted = models.EmailField()
# #     timestamp = models.DateTimeField(auto_now_add=True)
# #     status = models.CharField(max_length=20, choices=LOGIN_STATUS_CHOICES)
# #     ip_address = models.GenericIPAddressField()
# #     notes = models.TextField(blank=True)

# #     class Meta:
# #         db_table = 'user_login_history'
# #         ordering = ['-timestamp']

# #     def __str__(self):
# #         return f"{self.email_attempted} - {self.status}"


# # account/models.py
# from datetime import timedelta
# from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
# from django.db import models
# from django.core.validators import RegexValidator
# from django.utils import timezone
# import uuid
# from django.utils import timezone

# def default_session_expiry():
#     return timezone.now() + timedelta(days=1)
# class UserManager(BaseUserManager):
#     def create_user(self, email, mobile, password=None, **extra_fields):
#         """Create and return a regular user with an email and mobile number."""
#         if not email:
#             raise ValueError('Email must be provided')
#         if not mobile:
#             raise ValueError('Mobile must be provided')

#         email = self.normalize_email(email)
#         extra_fields.setdefault('is_active', True)

#         user = self.model(email=email, mobile=mobile, **extra_fields)
#         if password:
#             user.set_password(password)
#         else:
#             user.set_unusable_password()
#         user.save(using=self._db)
#         return user

#     def create_superuser(self, email, mobile, password=None, **extra_fields):
#         """Create and return a superuser with an email, mobile number and password."""
#         extra_fields.setdefault('is_staff', True)
#         extra_fields.setdefault('is_superuser', True)
#         extra_fields.setdefault('is_active', True)
#         extra_fields.setdefault('is_verified', True)  # Auto-verify superusers

#         if not extra_fields.get('is_staff'):
#             raise ValueError('Superuser must have is_staff=True.')
#         if not extra_fields.get('is_superuser'):
#             raise ValueError('Superuser must have is_superuser=True.')
#         if not password:
#             raise ValueError('Superuser must have a password.')

#         return self.create_user(email, mobile, password, **extra_fields)


# class User(AbstractBaseUser, PermissionsMixin):
#     """Custom User model using email as the unique identifier."""
    
#     ROLE_CHOICES = [
#         ('admin', 'Admin'),
#         ('b2b_admin', 'B2B Admin'),
#         ('b2b_user', 'B2B User'),
#         ('b2c_user', 'B2C User'),
#     ]

#     # Primary key and identification fields
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     email = models.EmailField(unique=True, db_index=True)
#     mobile = models.CharField(
#         max_length=15,
#         unique=True,
#         validators=[RegexValidator(
#             regex=r'^\+?1?\d{9,15}$',
#             message="Mobile number format: '+999999999'. Up to 15 digits allowed."
#         )],
#         db_index=True
#     )

#     # Personal information
#     first_name = models.CharField(max_length=30, blank=True)
#     last_name = models.CharField(max_length=30, blank=True)
    
#     # Role and permissions
#     role = models.CharField(
#         max_length=20, 
#         choices=ROLE_CHOICES, 
#         default='b2c_user',
#         db_index=True
#     )

#     # Timestamps
#     date_joined = models.DateTimeField(auto_now_add=True)
#     last_login = models.DateTimeField(null=True, blank=True)

#     # Status flags
#     is_active = models.BooleanField(default=True)
#     is_staff = models.BooleanField(default=False)
#     is_verified = models.BooleanField(default=False)

#     # Manager
#     objects = UserManager()

#     # Authentication settings
#     USERNAME_FIELD = 'email'
#     REQUIRED_FIELDS = ['mobile']

#     class Meta:
#         db_table = 'account_user'  # Explicit table name to avoid conflicts
#         verbose_name = 'User'
#         verbose_name_plural = 'Users'
#         indexes = [
#             models.Index(fields=['email']),
#             models.Index(fields=['mobile']),
#             models.Index(fields=['role']),
#             models.Index(fields=['is_active']),
#             models.Index(fields=['date_joined']),
#         ]

#     def __str__(self):
#         return f"{self.email}"

#     def get_full_name(self):
#         """Return the full name for the user."""
#         full_name = f"{self.first_name} {self.last_name}".strip()
#         return full_name or self.email

#     def get_short_name(self):
#         """Return the short name for the user."""
#         return self.first_name or self.email.split('@')[0]

#     @property
#     def is_admin(self):
#         """Check if user is any type of admin."""
#         return self.role in ['user_admin', 'b2b_admin']

#     @property
#     def is_b2b_user(self):
#         """Check if user is a B2B user (admin or regular)."""
#         return self.role in ['b2b_admin', 'b2b_user']


# class UserSession(models.Model):
#     """Track user sessions for security and analytics."""
    
#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     user = models.ForeignKey(
#         User, 
#         on_delete=models.CASCADE, 
#         related_name='user_sessions'
#     )
#     session_key = models.CharField(max_length=40, unique=True, db_index=True)

#     # Session timing
#     created_at = models.DateTimeField(auto_now_add=True)
#     last_activity = models.DateTimeField(auto_now=True)
#     # expires_at = models.DateTimeField()
#     # expires_at = models.DateTimeField(default=lambda: timezone.now() + timedelta(days=1))
#     expires_at = models.DateTimeField(default=default_session_expiry)

#     # Session details
#     ip_address = models.GenericIPAddressField()
#     user_agent = models.TextField(blank=True)
#     is_active = models.BooleanField(default=True)

#     # Termination info
#     terminated_at = models.DateTimeField(null=True, blank=True)
#     termination_reason = models.CharField(
#         max_length=50, 
#         blank=True,
#         choices=[
#             ('logout', 'User Logout'),
#             ('timeout', 'Session Timeout'),
#             ('forced', 'Forced Termination'),
#             ('security', 'Security Reason'),
#         ]
#     )

#     class Meta:
#         db_table = 'account_user_sessions'
#         verbose_name = 'User Session'
#         verbose_name_plural = 'User Sessions'
#         ordering = ['-created_at']
#         indexes = [
#             models.Index(fields=['user', 'is_active']),
#             models.Index(fields=['session_key']),
#             models.Index(fields=['created_at']),
#             models.Index(fields=['expires_at']),
#         ]

#     def __str__(self):
#         return f"{self.user.email} - {self.ip_address}"

#     @property
#     def is_expired(self):
#         """Check if the session has expired."""
#         return timezone.now() > self.expires_at

#     def terminate(self, reason='logout'):
#         """Terminate the session with a reason."""
#         self.is_active = False
#         self.terminated_at = timezone.now()
#         self.termination_reason = reason
#         self.save(update_fields=['is_active', 'terminated_at', 'termination_reason'])

#     def extend_session(self, hours=24):
#         """Extend session expiration time."""
#         self.expires_at = timezone.now() + timezone.timedelta(hours=hours)
#         self.save(update_fields=['expires_at'])


# class UserLoginHistory(models.Model):
#     """Track all login attempts for security monitoring."""
    
#     LOGIN_STATUS_CHOICES = [
#         ('success', 'Success'),
#         ('failed_credentials', 'Failed - Invalid Credentials'),
#         ('failed_locked', 'Failed - Account Locked'),
#         ('failed_inactive', 'Failed - Account Inactive'),
#         ('failed_verification', 'Failed - Email Not Verified'),
#         ('failed_rate_limit', 'Failed - Rate Limited'),
#         ('failed_suspicious', 'Failed - Suspicious Activity'),
#     ]

#     id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
#     user = models.ForeignKey(
#         User,
#         on_delete=models.SET_NULL,  # Keep history even if user is deleted
#         related_name='login_history',
#         null=True, 
#         blank=True
#     )
#     email_attempted = models.EmailField(db_index=True)
#     timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
#     status = models.CharField(max_length=30, choices=LOGIN_STATUS_CHOICES, db_index=True)
    
#     # Request details
#     ip_address = models.GenericIPAddressField()
#     user_agent = models.TextField(blank=True)
    
#     # Additional info
#     notes = models.TextField(blank=True)
#     country_code = models.CharField(max_length=2, blank=True)  # For geo-tracking
#     city = models.CharField(max_length=100, blank=True)

#     class Meta:
#         db_table = 'account_user_login_history'
#         verbose_name = 'Login History'
#         verbose_name_plural = 'Login History'
#         ordering = ['-timestamp']
#         indexes = [
#             models.Index(fields=['user', 'timestamp']),
#             models.Index(fields=['email_attempted', 'timestamp']),
#             models.Index(fields=['status', 'timestamp']),
#             models.Index(fields=['ip_address', 'timestamp']),
#         ]

#     def __str__(self):
#         return f"{self.email_attempted} - {self.get_status_display()} - {self.timestamp}"

#     @property
#     def is_successful(self):
#         """Check if the login attempt was successful."""
#         return self.status == 'success'

#     @property
#     def is_failed(self):
#         """Check if the login attempt failed."""
#         return self.status.startswith('failed_')


# class UserProfile(models.Model):
#     """Extended user profile information."""
    
#     user = models.OneToOneField(
#         User, 
#         on_delete=models.CASCADE, 
#         related_name='profile'
#     )
    
#     # Profile image
#     avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
#     # Additional personal info
#     date_of_birth = models.DateField(null=True, blank=True)
#     phone_verified = models.BooleanField(default=False)
#     email_verified = models.BooleanField(default=False)
    
#     # Preferences
#     timezone = models.CharField(max_length=50, default='UTC')
#     language = models.CharField(max_length=10, default='en')
    
#     # Security settings
#     # two_factor_enabled = models.BooleanField(default=False)
#     security_notifications = models.BooleanField(default=True)
    
#     # Metadata
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     class Meta:
#         db_table = 'account_user_profile'
#         verbose_name = 'User Profile'
#         verbose_name_plural = 'User Profiles'

#     def __str__(self):
#         return f"{self.user.email} Profile"