from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.utils import timezone
from django.conf import settings
from django.db import transaction
from django.core.exceptions import ValidationError
from django.contrib.auth.password_validation import validate_password

from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import User, UserSession, UserLoginHistory, UserProfile
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserProfileSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    PasswordResetSerializer,
    PasswordResetConfirmSerializer,
    UserSessionSerializer,
    UserLoginHistorySerializer,
)
from .utils import get_client_ip, get_user_agent, create_user_session
from .throttling import LoginRateThrottle

import logging

logger = logging.getLogger(__name__)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token obtain view with enhanced security features."""
    throttle_classes = [LoginRateThrottle]

    def post(self, request, *args, **kwargs):
        serializer = UserLoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid input data',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        ip_address = get_client_ip(request)
        user_agent = get_user_agent(request)

        login_history = UserLoginHistory.objects.create(
            email_attempted=email,
            ip_address=ip_address,
            user_agent=user_agent,
            status='failed_credentials'
        )

        try:
            user = authenticate(request, email=email, password=password)

            if not user:
                logger.warning(f"Failed login attempt for {email} from {ip_address}")
                return Response({
                    'success': False,
                    'message': 'Invalid email or password'
                }, status=status.HTTP_401_UNAUTHORIZED)

            if not user.is_active:
                login_history.status = 'failed_inactive'
                login_history.save()
                return Response({
                    'success': False,
                    'message': 'Account is deactivated'
                }, status=status.HTTP_401_UNAUTHORIZED)

            if not user.is_verified:
                login_history.status = 'failed_verification'
                login_history.save()
                return Response({
                    'success': False,
                    'message': 'Email not verified. Please verify your email first.',
                    'require_verification': True
                }, status=status.HTTP_401_UNAUTHORIZED)

            refresh = RefreshToken.for_user(user)
            access_token = refresh.access_token
            import uuid
            create_user_session(
                user=user,
                ip_address=ip_address,
                user_agent=user_agent,
                # session_key=str(refresh.token)
                # session_key=str(refresh)  # ✅ Proper refresh token string
                session_key=uuid.uuid4().hex  # ✅ always 32 chars
            )

            login_history.user = user
            login_history.status = 'success'
            login_history.save()

            user.last_login = timezone.now()
            user.save(update_fields=['last_login'])

            logger.info(f"Successful login for {user.email} from {ip_address}")

            return Response({
                'success': True,
                'message': 'Login successful',
                'data': {
                    'access_token': str(access_token),
                    'refresh_token': str(refresh),
                    'token_type': 'Bearer',
                    'expires_in': settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
                    'user': UserSerializer(user).data
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Login error for {email}: {str(e)}")
            return Response({
                'success': False,
                'message': 'Login failed due to server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Registration failed',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                user = serializer.save()
                UserProfile.objects.create(user=user)

                UserLoginHistory.objects.create(
                    user=user,
                    email_attempted=user.email,
                    status='success',
                    ip_address=get_client_ip(request),
                    user_agent=get_user_agent(request),
                    notes='Account registration'
                )

                logger.info(f"New user registered: {user.email}")

                return Response({
                    'success': True,
                    'message': 'Registration successful. Please verify your email.',
                    'data': UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return Response({
                'success': False,
                'message': 'Registration failed due to server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        return profile

    def retrieve(self, request, *args, **kwargs):
        try:
            profile = self.get_object()
            profile_data = self.get_serializer(profile).data
            return Response({
                'success': True,
                'data': {
                    'user': UserSerializer(request.user).data,
                    'profile': profile_data
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Profile retrieval error: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to retrieve profile'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserSessionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            sessions = UserSession.objects.filter(
                user=request.user,
                is_active=True
            ).order_by('-created_at')

            serializer = UserSessionSerializer(sessions, many=True, context={'request': request})
            return Response({
                'success': True,
                'data': {
                    'sessions': serializer.data,
                    'total_count': len(serializer.data)
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Sessions retrieval error: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to retrieve sessions'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_login_history(request):
    """Get user's login history."""
    try:
        history = UserLoginHistory.objects.filter(
            user=request.user
        ).order_by('-timestamp')[:50]

        serializer = UserLoginHistorySerializer(history, many=True)
        return Response({
            'success': True,
            'data': {
                'login_history': serializer.data,
                'total_count': len(serializer.data)
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Login history retrieval error: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to retrieve login history'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from .serializers import UserSerializer

class B2BAdminLoginView(APIView):
    permission_classes = []  # AllowAny if you're using custom permission globally

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({"success": False, "message": "Email and password required"}, status=400)

        user = authenticate(request, email=email, password=password)

        if not user:
            return Response({"success": False, "message": "Invalid credentials"}, status=401)

        if not user.is_active:
            return Response({"success": False, "message": "Account disabled"}, status=403)

        if user.role != "b2b_admin":
            return Response({"success": False, "message": "Not authorized as B2B admin"}, status=403)

        # ✅ Issue JWT tokens
        refresh = RefreshToken.for_user(user)
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        return Response({
            "success": True,
            "message": "B2B Admin login successful",
            "data": {
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "user": UserSerializer(user).data
            }
        }, status=200)
# views.py
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.contrib.auth import get_user_model
from .serializers import UserSerializer

# User = get_user_model()


class AdminLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({"success": False, "message": "Email and password required"}, status=400)

        user = authenticate(request, email=email, password=password)

        if not user:
            return Response({"success": False, "message": "Invalid credentials"}, status=401)

        if not user.is_active:
            return Response({"success": False, "message": "Account disabled"}, status=403)

        if not user.is_superuser:
            return Response({"success": False, "message": "Not authorized as  Admin"}, status=403)

        # ✅ Issue JWT tokens
        refresh = RefreshToken.for_user(user)
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])

        return Response({
            "success": True,
            "message": " Admin login successful",
            "data": {
                "access_token": str(refresh.access_token),
                "refresh_token": str(refresh),
                "user": UserSerializer(user).data
            }
        }, status=200)
