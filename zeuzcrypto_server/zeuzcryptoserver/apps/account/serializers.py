from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, UserSession, UserLoginHistory

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for basic user details."""

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_verified",
            "last_login",
        ]


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""

    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "password", "first_name", "last_name"]

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for login request validation."""

    email = serializers.EmailField()
    password = serializers.CharField()


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile."""

    class Meta:
        model = UserProfile
        fields = "__all__"
        read_only_fields = ["user"]


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""

    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)


class PasswordResetSerializer(serializers.Serializer):
    """Serializer for password reset request (email)."""

    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for confirming password reset."""

    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField()


class UserSessionSerializer(serializers.ModelSerializer):
    """Serializer for user sessions."""

    is_current = serializers.SerializerMethodField()

    class Meta:
        model = UserSession
        fields = [
            "id",
            "ip_address",
            "user_agent",
            "created_at",
            "last_activity",
            "expires_at",
            "is_active",
            "is_current",
        ]

    def get_is_current(self, obj):
        request = self.context.get("request")
        if hasattr(request, "auth") and request.auth:
            return str(obj.session_key) == str(getattr(request.auth, "token", ""))
        return False


class UserLoginHistorySerializer(serializers.ModelSerializer):
    """Serializer for user login history."""

    status = serializers.CharField(source="get_status_display")

    class Meta:
        model = UserLoginHistory
        fields = [
            "timestamp",
            "status",
            "ip_address",
            "user_agent",
            "notes",
            "country_code",
            "city",
        ]


# from rest_framework import serializers
# from django.contrib.auth import get_user_model
# from django.contrib.auth.password_validation import validate_password
# from django.core.exceptions import ValidationError
# from rest_framework_simplejwt.tokens import UntypedToken
# from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
# from .models import UserProfile, UserSession, UserLoginHistory

# User = get_user_model()


# class UserSerializer(serializers.ModelSerializer):
#     """Serializer for basic user details."""

#     # Make role optional in case it doesn't exist on the model
#     role = serializers.CharField(read_only=True, required=False)

#     class Meta:
#         model = User
#         fields = [
#             "id",
#             "email",
#             "first_name",
#             "last_name",
#             "is_verified",
#             "last_login",
#             "role",
#         ]

#     def __init__(self, *args, **kwargs):
#         super().__init__(*args, **kwargs)
#         # Dynamically add role field if it exists on the model
#         if hasattr(User, "role"):
#             self.fields["role"] = serializers.CharField(read_only=True)


# class UserRegistrationSerializer(serializers.ModelSerializer):
#     """Serializer for user registration."""

#     password = serializers.CharField(write_only=True, min_length=8)
#     password_confirm = serializers.CharField(write_only=True)

#     class Meta:
#         model = User
#         fields = [
#             "id",
#             "email",
#             "password",
#             "password_confirm",
#             "first_name",
#             "last_name",
#         ]

#     def validate_email(self, value):
#         """Validate email uniqueness."""
#         if User.objects.filter(email=value).exists():
#             raise serializers.ValidationError("A user with this email already exists.")
#         return value

#     def validate_password(self, value):
#         """Validate password strength."""
#         try:
#             validate_password(value)
#         except ValidationError as e:
#             raise serializers.ValidationError(list(e.messages))
#         return value

#     def validate(self, attrs):
#         """Validate password confirmation."""
#         if attrs["password"] != attrs["password_confirm"]:
#             raise serializers.ValidationError(
#                 {"password_confirm": "Password confirmation doesn't match."}
#             )
#         return attrs

#     def create(self, validated_data):
#         # Remove password_confirm from validated_data
#         validated_data.pop("password_confirm", None)

#         user = User.objects.create_user(
#             email=validated_data["email"],
#             password=validated_data["password"],
#             first_name=validated_data.get("first_name", ""),
#             last_name=validated_data.get("last_name", ""),
#         )
#         return user


# class UserLoginSerializer(serializers.Serializer):
#     """Serializer for login request validation."""

#     email = serializers.EmailField()
#     password = serializers.CharField(min_length=1)

#     def validate_email(self, value):
#         """Normalize email to lowercase."""
#         return value.lower()


# class UserProfileSerializer(serializers.ModelSerializer):
#     """Serializer for user profile."""

#     # Include user details
#     user_details = UserSerializer(source="user", read_only=True)

#     class Meta:
#         model = UserProfile
#         fields = "__all__"
#         read_only_fields = ["user", "created_at", "updated_at"]


# class ChangePasswordSerializer(serializers.Serializer):
#     """Serializer for password change."""

#     old_password = serializers.CharField(write_only=True)
#     new_password = serializers.CharField(write_only=True, min_length=8)
#     new_password_confirm = serializers.CharField(write_only=True)

#     def validate_new_password(self, value):
#         """Validate new password strength."""
#         try:
#             validate_password(value)
#         except ValidationError as e:
#             raise serializers.ValidationError(list(e.messages))
#         return value

#     def validate(self, attrs):
#         """Validate password confirmation and that new password is different."""
#         if attrs["new_password"] != attrs["new_password_confirm"]:
#             raise serializers.ValidationError(
#                 {"new_password_confirm": "Password confirmation doesn't match."}
#             )

#         if attrs["old_password"] == attrs["new_password"]:
#             raise serializers.ValidationError(
#                 {
#                     "new_password": "New password must be different from the old password."
#                 }
#             )

#         return attrs


# class PasswordResetSerializer(serializers.Serializer):
#     """Serializer for password reset request (email)."""

#     email = serializers.EmailField()

#     def validate_email(self, value):
#         """Validate that user with this email exists."""
#         if not User.objects.filter(email=value).exists():
#             raise serializers.ValidationError("No user found with this email address.")
#         return value.lower()


# class PasswordResetConfirmSerializer(serializers.Serializer):
#     """Serializer for confirming password reset."""

#     uid = serializers.CharField()
#     token = serializers.CharField()
#     new_password = serializers.CharField(min_length=8)
#     new_password_confirm = serializers.CharField()

#     def validate_new_password(self, value):
#         """Validate password strength."""
#         try:
#             validate_password(value)
#         except ValidationError as e:
#             raise serializers.ValidationError(list(e.messages))
#         return value

#     def validate(self, attrs):
#         """Validate password confirmation."""
#         if attrs["new_password"] != attrs["new_password_confirm"]:
#             raise serializers.ValidationError(
#                 {"new_password_confirm": "Password confirmation doesn't match."}
#             )
#         return attrs


# class UserSessionSerializer(serializers.ModelSerializer):
#     """Serializer for user sessions."""

#     is_current = serializers.SerializerMethodField()
#     device_info = serializers.SerializerMethodField()

#     class Meta:
#         model = UserSession
#         fields = [
#             "id",
#             "ip_address",
#             "user_agent",
#             "created_at",
#             "last_activity",
#             "expires_at",
#             "is_active",
#             "is_current",
#             "device_info",
#         ]

#     def get_is_current(self, obj):
#         """Check if this is the current session."""
#         request = self.context.get("request")
#         if not request:
#             return False

#         try:
#             # For JWT tokens, you might need to compare differently
#             # This depends on how you store session_key
#             if hasattr(request, "auth") and request.auth:
#                 # If using JWT, you might need to decode the token
#                 # and compare with session information
#                 auth_header = request.META.get("HTTP_AUTHORIZATION", "")
#                 if auth_header.startswith("Bearer "):
#                     token = auth_header.split(" ")[1]
#                     # Compare first 32 characters (if you're using this method)
#                     return str(obj.session_key) == token[:32]

#             # Fallback: compare with session key if available
#             session_key = getattr(request, "session", {}).get("session_key", "")
#             return str(obj.session_key) == str(session_key)

#         except (AttributeError, TypeError, TokenError):
#             return False

#     def get_device_info(self, obj):
#         """Extract device info from user agent."""
#         try:
#             # Basic device info extraction
#             user_agent = obj.user_agent.lower()
#             if (
#                 "mobile" in user_agent
#                 or "android" in user_agent
#                 or "iphone" in user_agent
#             ):
#                 device_type = "Mobile"
#             elif "tablet" in user_agent or "ipad" in user_agent:
#                 device_type = "Tablet"
#             else:
#                 device_type = "Desktop"

#             # Browser detection
#             if "chrome" in user_agent:
#                 browser = "Chrome"
#             elif "firefox" in user_agent:
#                 browser = "Firefox"
#             elif "safari" in user_agent:
#                 browser = "Safari"
#             elif "edge" in user_agent:
#                 browser = "Edge"
#             else:
#                 browser = "Other"

#             return f"{browser} on {device_type}"
#         except:
#             return "Unknown"


# class UserLoginHistorySerializer(serializers.ModelSerializer):
#     """Serializer for user login history."""

#     # Only use get_status_display if you have choices defined
#     status_display = serializers.SerializerMethodField()
#     time_since = serializers.SerializerMethodField()

#     class Meta:
#         model = UserLoginHistory
#         fields = [
#             "timestamp",
#             "status",
#             "status_display",
#             "ip_address",
#             "user_agent",
#             "notes",
#             "country_code",
#             "city",
#             "time_since",
#         ]

#     def get_status_display(self, obj):
#         """Get human readable status."""
#         status_choices = {
#             "success": "Successful Login",
#             "failed_credentials": "Invalid Credentials",
#             "failed_inactive": "Account Inactive",
#             "failed_verification": "Email Not Verified",
#             "failed_authorization": "Insufficient Permissions",
#             "attempting": "Login Attempt",
#         }
#         return status_choices.get(obj.status, obj.status.title())

#     def get_time_since(self, obj):
#         """Get human readable time since login."""
#         from django.utils import timezone
#         from django.utils.timesince import timesince

#         return timesince(obj.timestamp, timezone.now()) + " ago"


# # Admin-specific serializers
# class AdminUserSerializer(UserSerializer):
#     """Extended serializer for admin views."""

#     is_active = serializers.BooleanField(read_only=True)
#     is_superuser = serializers.BooleanField(read_only=True)
#     date_joined = serializers.DateTimeField(read_only=True)

#     class Meta(UserSerializer.Meta):
#         fields = UserSerializer.Meta.fields + [
#             "is_active",
#             "is_superuser",
#             "date_joined",
#         ]
