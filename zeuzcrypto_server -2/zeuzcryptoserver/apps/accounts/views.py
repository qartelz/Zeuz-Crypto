# accounts/views.py
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from apps.admin.subscriptions.models import Subscription

from .models import User, UserProfile, UserWallet, UserBatch, UserApproval
from .serializers import *

from apps.permission.permissions import IsAdmin, IsB2BAdmin, IsAdminOrB2BAdmin, IsOwnerOrAdmin


# Authentication Views
# class LoginView(APIView):
#     permission_classes = [AllowAny]
#
#     def post(self, request):
#         serializer = LoginSerializer(data=request.data, context={'request': request})
#         serializer.is_valid(raise_exception=True)
#
#         user = serializer.validated_data['user']
#         user.last_login = timezone.now()
#         user.save(update_fields=['last_login'])
#
#         refresh = RefreshToken.for_user(user)
#
#         return Response({
#             'refresh': str(refresh),
#             'access': str(refresh.access_token),
#             'user': UserSerializer(user).data
#         })
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        user.last_login = timezone.now()
        
        # Calculate session_id properly
        import uuid
        session_id = str(uuid.uuid4())
        user.active_session_id = session_id
        user.save(update_fields=['last_login', 'active_session_id'])

        refresh = RefreshToken.for_user(user)
        refresh['session_id'] = session_id # Custom claim

        # ✅ Fetch the most recent active subscription
        subscription = (
            Subscription.objects
            .filter(user=user)
            .order_by('-start_date')
            .select_related('plan')
            .first()
        )

        subscription_data = None
        if subscription:
            subscription_data = {
                "plan_name": getattr(subscription.plan, "name", None),
                "plan_id": getattr(subscription.plan, "id", None),
                "start_date": subscription.start_date,
                "end_date": subscription.end_date,
                "status": subscription.status,
                "is_expired": getattr(subscription, "is_expired", False),
            }

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": UserSerializer(user).data,
            "subscription": subscription_data
        })

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                return Response({'message': 'Successfully logged out'})
            return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


# Registration Views
class RegisterView(APIView):
    """B2C user registration"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Registration successful',
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token)
        }, status=status.HTTP_201_CREATED)


class B2BAdminRegisterView(APIView):
    """B2B Admin registration (Admin only)"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = B2BAdminRegistrationSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'B2B Admin registered successfully. Awaiting approval.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class B2BUserRegisterView(APIView):
    """B2B User registration (B2B Admin only)"""
    permission_classes = [IsAuthenticated, IsB2BAdmin]

    def post(self, request):
        serializer = B2BUserRegistrationSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'message': 'B2B User registered successfully',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


# Password Management Views
class PasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({'message': 'Password reset email sent'})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, token):
        try:
            user = User.objects.get(
                password_reset_token=token,
                password_reset_expires__gt=timezone.now()
            )
        except User.DoesNotExist:
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user.set_password(serializer.validated_data['password'])
        user.password_reset_token = None
        user.password_reset_expires = None
        user.save()
        
        return Response({'message': 'Password reset successful'})


class PasswordSetupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, token):
        try:
            user = User.objects.get(
                password_setup_token=token,
                password_setup_expires__gt=timezone.now()
            )
        except User.DoesNotExist:
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = PasswordSetupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user.set_password(serializer.validated_data['password'])
        user.password_setup_token = None
        user.password_setup_expires = None
        user.is_verified = True
        user.save()
        
        return Response({'message': 'Password setup successful'})


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Password changed successfully'})


# User Management Views
class UserListView(generics.ListAPIView):
    """List users with filters"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrB2BAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active', 'is_approved', 'batch', 'created_by']
    search_fields = ['email', 'first_name', 'last_name', 'mobile']
    ordering_fields = ['date_joined', 'last_login', 'email']
    ordering = ['-date_joined']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return User.objects.all().select_related('profile', 'wallet', 'batch', 'created_by')
        elif user.role == 'b2b_admin':
            return User.objects.filter(created_by=user).select_related('profile', 'wallet', 'batch')
        return User.objects.none()
    # def get_queryset(self):
    #     user = self.request.user
    #
    #     # Define the roles you want to return
    #     allowed_roles = ['b2b_user', 'b2c_user']
    #
    #     if user.role == 'admin':
    #         return User.objects.filter(role__in=allowed_roles).select_related('profile', 'wallet', 'batch',
    #                                                                           'created_by')
    #
    #     elif user.role == 'b2b_admin':
    #         return User.objects.filter(role__in=allowed_roles, created_by=user).select_related('profile', 'wallet',
    #                                                                                            'batch')
    #
    #     return User.objects.none()


class CurrentUserView(APIView):
    """Get current user details"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


# Batch Management Views
class BatchCreateView(APIView):
    """Create new batch (B2B Admin only)"""
    permission_classes = [IsAuthenticated, IsB2BAdmin]

    def post(self, request):
        serializer = UserBatchSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        batch = serializer.save()
        
        return Response(UserBatchSerializer(batch).data, status=status.HTTP_201_CREATED)


class BatchListView(generics.ListAPIView):
    """List batches"""
    serializer_class = UserBatchListSerializer
    permission_classes = [IsAuthenticated, IsAdminOrB2BAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return UserBatch.objects.all()
        elif user.role == 'b2b_admin':
            return UserBatch.objects.filter(created_by=user)
        return UserBatch.objects.none()


class BatchListByB2BAdminView(generics.ListAPIView):
    """List all batches created by a specific B2B admin"""
    serializer_class = UserBatchListSerializer
    permission_classes = [IsAuthenticated, IsAdmin]  # or IsAdminOrB2BAdmin if you want both to access
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering = ['-created_at']

    def get_queryset(self):
        b2b_admin_id = self.kwargs['b2b_admin_id']
        return UserBatch.objects.filter(created_by_id=b2b_admin_id)


class BatchUsersView(generics.ListAPIView):
    """List users in a specific batch"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrB2BAdmin]

    def get_queryset(self):
        batch_id = self.kwargs['batch_id']
        user = self.request.user
        
        if user.role == 'admin':
            return User.objects.filter(batch_id=batch_id)
        elif user.role == 'b2b_admin':
            return User.objects.filter(batch_id=batch_id, created_by=user)
        return User.objects.none()

class BatchUsersByB2BAdminView(generics.ListAPIView):
    """
    List all users in batches created by a specific B2B admin.
    URL param: /api/v1/batches/b2b-admin/<b2b_admin_id>/
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdmin]  # Only admin or allowed roles

    def get_queryset(self):
        b2b_admin_id = self.kwargs['b2b_admin_id']
        return User.objects.filter(created_by_id=b2b_admin_id)

# Approval Views
class B2BAdminApprovalListView(generics.ListAPIView):
    """List B2B admin approval requests"""
    serializer_class = UserApprovalSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']
    
    def get_queryset(self):
        return UserApproval.objects.filter(
            user__role='b2b_admin'
        ).select_related('user', 'approved_by')


class B2BAdminApproveView(APIView):
    """Approve B2B Admin"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, user_id):
        try:
            approval = UserApproval.objects.get(
                user_id=user_id,
                user__role='b2b_admin',
                status='pending'
            )
        except UserApproval.DoesNotExist:
            return Response({'error': 'Approval request not found'}, status=status.HTTP_404_NOT_FOUND)
        
        approval.approve(request.user)
        
        return Response({
            'message': 'B2B Admin approved successfully',
            'approval': UserApprovalSerializer(approval).data
        })


class B2BAdminRejectView(APIView):
    """Reject B2B Admin"""
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, user_id):
        try:
            approval = UserApproval.objects.get(
                user_id=user_id,
                user__role='b2b_admin',
                status='pending'
            )
        except UserApproval.DoesNotExist:
            return Response({'error': 'Approval request not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ApprovalActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        reason = serializer.validated_data.get('reason', '')
        approval.reject(reason)
        
        return Response({
            'message': 'B2B Admin rejected successfully',
            'approval': UserApprovalSerializer(approval).data
        })


# Wallet & Profile Views
class WalletView(APIView):
    """Get user wallet balance"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet = get_object_or_404(UserWallet, user=request.user)
        serializer = UserWalletSerializer(wallet)
        return Response(serializer.data)


class ProfileView(APIView):
    """Get/Update user profile"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_object_or_404(UserProfile, user=request.user)
        serializer = ProfileUpdateSerializer(profile)
        return Response(serializer.data)

    def put(self, request):
        profile = get_object_or_404(UserProfile, user=request.user)
        serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)


# Additional Views
class B2BAdminUsersView(generics.ListAPIView):
    """List users created by current B2B admin"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsB2BAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role', 'is_active', 'batch']
    search_fields = ['email', 'first_name', 'last_name', 'mobile']
    ordering = ['-date_joined']

    def get_queryset(self):
        return User.objects.filter(created_by=self.request.user).select_related('profile', 'wallet', 'batch')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def activity_log(request):
    """Get recent activities for audit"""
    user = request.user
    activities = []
    
    if user.role in ['admin', 'b2b_admin']:
        # Recent user creations
        created_users = User.objects.filter(created_by=user).order_by('-date_joined')[:10]
        for u in created_users:
            activities.append({
                'action': 'user_created',
                'target': u.email,
                'timestamp': u.date_joined,
                'details': f"Created {u.get_role_display()} user"
            })
    
    if user.role == 'admin':
        # Recent approvals
        approvals = UserApproval.objects.filter(approved_by=user).order_by('-approved_at')[:10]
        for approval in approvals:
            if approval.approved_at:
                activities.append({
                    'action': f'user_{approval.status}',
                    'target': approval.user.email,
                    'timestamp': approval.approved_at,
                    'details': f"{approval.status.title()} B2B Admin request"
                })
    
    # Sort by timestamp
    activities.sort(key=lambda x: x['timestamp'] if x['timestamp'] else timezone.now(), reverse=True)
    
    return Response({
        'activities': activities[:20]
    })

# views.py

from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.exceptions import NotFound
from apps.accounts.models import User
from apps.client.trading.models import TradeHistory
from .serializers import UserDetailWithAllDataSerializer
from apps.permission.permissions import IsAdminOrB2BAdmin


class UserDetailWithTradesView(generics.RetrieveAPIView):
    """Public endpoint — Retrieve a single user's details with their trades"""
    serializer_class = UserDetailWithAllDataSerializer
    permission_classes = [IsAdminOrB2BAdmin]
    lookup_field = "id"

    def get_object(self):
        user_id = self.kwargs.get("id")
        try:
            # Directly fetch the user with related models
            return User.objects.select_related(
                "profile", "wallet", "batch", "created_by"
            ).get(id=user_id)
        except User.DoesNotExist:
            raise NotFound("User not found.")