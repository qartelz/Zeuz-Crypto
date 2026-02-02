# accounts/serializers.py

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from .models import User, UserProfile, UserWallet, UserBatch, UserApproval
from apps.admin.subscriptions.models import Subscription

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['avatar', 'address', 'city']


class UserWalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserWallet
        fields = ['balance']
        read_only_fields = ['balance']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    wallet = UserWalletSerializer(read_only=True)
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'mobile', 'first_name', 'last_name', 'full_name',
            'role', 'is_active', 'is_verified', 'is_approved', 'date_joined',
            'last_login', 'created_by', 'batch', 'profile', 'wallet'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'is_verified', 'is_approved']

#
# class LoginSerializer(serializers.Serializer):
#     email = serializers.EmailField()
#     password = serializers.CharField()
#
#     def validate(self, attrs):
#         email = attrs.get('email')
#         password = attrs.get('password')
#
#         if email and password:
#             user = authenticate(
#                 request=self.context.get('request'),
#                 username=email,
#                 password=password
#             )
#
#             if not user:
#                 raise serializers.ValidationError('Invalid email or password.')
#
#             if not user.is_active:
#                 raise serializers.ValidationError('Account is deactivated.')
#
#             attrs['user'] = user
#             return attrs
#         else:
#             raise serializers.ValidationError('Must include email and password.')
#

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if not email or not password:
            raise serializers.ValidationError('Must include email and password.')

        user = authenticate(
            request=self.context.get('request'),
            username=email,
            password=password
        )

        if not user:
            raise serializers.ValidationError('Invalid email or password.')

        if not user.is_active:
            raise serializers.ValidationError('Account is deactivated.')

        # Attach user
        attrs['user'] = user
        # print(user,"user***********************")

        # Fetch active subscription details
        subscription = (
            Subscription.objects
            .filter(user=user, status='active')
            .select_related('plan')
            .first()
        )

        if subscription:
            # print("subscription******************************************************")
            subscription_data = {
                "plan_name": subscription.plan.name if subscription.plan else None,
                "plan_id": str(subscription.plan.id) if subscription.plan else None,
                "start_date": subscription.start_date,
                "end_date": subscription.end_date,
                "status": subscription.status,
                "is_expired": subscription.is_expired,
            }
        else:
            subscription_data = None

        attrs['subscription'] = subscription_data
        # print(subscription_data,"subscription data ************************")
        return attrs

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'mobile', 'first_name', 'last_name', 'password', 'password_confirm']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data, password=password)
        user.is_verified = True  # B2C users are auto-verified
        user.save()
        return user


class B2BAdminRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    send_email = serializers.BooleanField(default=True, write_only=True)

    class Meta:
        model = User
        fields = ['email', 'mobile', 'first_name', 'last_name', 'password', 'send_email']

    def create(self, validated_data):
        send_email = validated_data.pop('send_email', True)
        password = validated_data.pop('password', None)
        
        user = User.objects.create_user(
            role='b2b_admin',
            created_by=self.context['request'].user,
            password=password,
            **validated_data
        )
        
        # Create approval record
        UserApproval.objects.create(user=user)
        
        if not password and send_email:
            user.send_password_setup_email()
            
        return user


class B2BUserRegistrationSerializer(serializers.ModelSerializer):
    batch_id = serializers.UUIDField(write_only=True)
    password = serializers.CharField(write_only=True, required=False)
    send_email = serializers.BooleanField(default=True, write_only=True)

    class Meta:
        model = User
        fields = ['email', 'mobile', 'first_name', 'last_name', 'batch_id', 'password', 'send_email']

    def validate_batch_id(self, value):
        try:
            batch = UserBatch.objects.get(id=value, created_by=self.context['request'].user)
            if not batch.can_add_users():
                raise serializers.ValidationError("Batch is full or inactive.")
            return batch
        except UserBatch.DoesNotExist:
            raise serializers.ValidationError("Invalid batch.")

    def create(self, validated_data):
        batch = validated_data.pop('batch_id')
        send_email = validated_data.pop('send_email', True)
        password = validated_data.pop('password', None)
        
        user = User.objects.create_user(
            role='b2b_user',
            batch=batch,
            created_by=self.context['request'].user,
            password=password,
            is_approved=True,  # B2B users are auto-approved
            **validated_data
        )
        
        if not password and send_email:
            user.send_password_setup_email()
            
        return user


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value, is_active=True)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email doesn't exist.")

    def save(self):
        email = self.validated_data['email']
        user = User.objects.get(email=email)
        user.send_password_reset_email()


class PasswordResetConfirmSerializer(serializers.Serializer):
    password = serializers.CharField(validators=[validate_password])
    password_confirm = serializers.CharField()

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs


class PasswordSetupSerializer(serializers.Serializer):
    password = serializers.CharField(validators=[validate_password])
    password_confirm = serializers.CharField()

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])
    new_password_confirm = serializers.CharField()

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Incorrect old password.")
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("New passwords don't match.")
        return attrs


class UserBatchSerializer(serializers.ModelSerializer):
    user_count = serializers.ReadOnlyField()
    can_add_users = serializers.ReadOnlyField()
    users = UserSerializer(many=True, read_only=True)

    class Meta:
        model = UserBatch
        fields = [
            'id', 'name', 'description', 'max_users', 'is_active',
            'created_at', 'user_count', 'can_add_users', 'users'
        ]
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class UserBatchListSerializer(serializers.ModelSerializer):
    user_count = serializers.ReadOnlyField()
    can_add_users = serializers.ReadOnlyField()

    class Meta:
        model = UserBatch
        fields = [
            'id', 'name', 'description', 'max_users', 'is_active',
            'created_at', 'user_count', 'can_add_users'
        ]


class UserApprovalSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = UserApproval
        fields = ['id', 'user', 'status', 'approved_by', 'approved_at', 'rejection_reason']
        read_only_fields = ['id', 'approved_by', 'approved_at']


class ApprovalActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    reason = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs['action'] == 'reject' and not attrs.get('reason'):
            raise serializers.ValidationError("Reason is required for rejection.")
        return attrs


class ProfileUpdateSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    subscription = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['first_name', 'last_name', 'avatar', 'address', 'city', 'subscription']

    def get_subscription(self, obj):
        subscription = (
            Subscription.objects
            .filter(user=obj.user, status__iexact='active')
            .select_related('plan')
            .first()
        )

        if subscription:
            return {
                "plan_name": subscription.plan.name if subscription.plan else None,
                "plan_id": str(subscription.plan.id) if subscription.plan else None,
                "start_date": subscription.start_date,
                "end_date": subscription.end_date,
                "status": subscription.status.lower(),
            }
        return None

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        
        # Update user fields
        for attr, value in user_data.items():
            setattr(instance.user, attr, value)
        instance.user.save()
        
        # Update profile fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance

# serializers.py

from rest_framework import serializers
from apps.accounts.models import User
from apps.client.trading.models import TradeHistory, Trade  # adjust import path as per your project

from apps.client.trading.serializers import TradeHistorySerializer , TradeSerializer  # or your existing one
# from .user_serializers import UserSerializer

from apps.admin.challenge.models.challenge_models import UserChallengeParticipation
from apps.admin.challenge.serializers.challenge_serializers import UserChallengeParticipationSerializer

class UserDetailWithAllDataSerializer(serializers.ModelSerializer):
    trades = serializers.SerializerMethodField()
    challenge_participations = serializers.SerializerMethodField()
    wallet = serializers.SerializerMethodField()
    

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'mobile',
            'is_active', 'is_approved', 'date_joined', 'last_login', 'created_by',
            'wallet', 'trades', 'challenge_participations'
        ]

    def get_trades(self, obj):
        """Return all trades by user"""
        trades = Trade.objects.filter(user=obj).order_by('-opened_at')
        return TradeSerializer(trades, many=True).data

    def get_challenge_participations(self, obj):
        """Return all challenge participations"""
        participations = UserChallengeParticipation.objects.filter(user=obj).order_by('-joined_at')
        return UserChallengeParticipationSerializer(participations, many=True).data

    def get_wallet(self, obj):
        """Return wallet details"""
        try:
            wallet = UserWallet.objects.get(user=obj)
            return UserWalletSerializer(wallet).data
        except UserWallet.DoesNotExist:
            return None