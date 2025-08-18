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
