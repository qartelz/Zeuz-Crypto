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


from django.contrib.auth import authenticate, get_user_model
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
from .throttling import LoginRateThrottle, RegistrationRateThrottle, AdminLoginRateThrottle, EmailBasedThrottle

import logging
import uuid

logger = logging.getLogger(__name__)
User = get_user_model()


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

        try:
            with transaction.atomic():
                # Create login history entry with 'attempting' status
                login_history = UserLoginHistory.objects.create(
                    email_attempted=email,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    status='attempting'
                )

                user = authenticate(request, email=email, password=password)

                if not user:
                    login_history.status = 'failed_credentials'
                    login_history.save()
                    logger.warning(f"Failed login attempt from {ip_address}")
                    return Response({
                        'success': False,
                        'message': 'Invalid email or password'
                    }, status=status.HTTP_401_UNAUTHORIZED)

                if not user.is_active:
                    login_history.user = user
                    login_history.status = 'failed_inactive'
                    login_history.save()
                    logger.warning(f"Login attempt for inactive user {user.id} from {ip_address}")
                    return Response({
                        'success': False,
                        'message': 'Account is deactivated'
                    }, status=status.HTTP_401_UNAUTHORIZED)

                if not user.is_verified:
                    login_history.user = user
                    login_history.status = 'failed_verification'
                    login_history.save()
                    logger.warning(f"Login attempt for unverified user {user.id} from {ip_address}")
                    return Response({
                        'success': False,
                        'message': 'Email not verified. Please verify your email first.',
                        'require_verification': True
                    }, status=status.HTTP_401_UNAUTHORIZED)

                # Generate tokens
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token
                
                # Create session with unique session key
                session_key = uuid.uuid4().hex[:32]  # Ensure 32 characters
                create_user_session(
                    user=user,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    session_key=session_key
                )

                # Update login history and user
                login_history.user = user
                login_history.status = 'success'
                login_history.save()

                user.last_login = timezone.now()
                user.save(update_fields=['last_login'])

                logger.info(f"Successful login for user ID {user.id} from {ip_address}")

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

        except ValidationError as e:
            logger.error(f"Validation error during login: {str(e)}")
            return Response({
                'success': False,
                'message': 'Invalid input data'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return Response({
                'success': False,
                'message': 'Login failed due to server error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RegistrationRateThrottle]

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
                
                # Create user profile
                UserProfile.objects.create(user=user)

                # Create registration entry in login history
                UserLoginHistory.objects.create(
                    user=user,
                    email_attempted=user.email,
                    status='success',
                    ip_address=get_client_ip(request),
                    user_agent=get_user_agent(request),
                    notes='Account registration'
                )

                logger.info(f"New user registered with ID {user.id}")

                return Response({
                    'success': True,
                    'message': 'Registration successful. Please verify your email.',
                    'data': UserSerializer(user).data
                }, status=status.HTTP_201_CREATED)

        except ValidationError as e:
            logger.error(f"Validation error during registration: {str(e)}")
            return Response({
                'success': False,
                'message': 'Registration failed due to validation error',
                'errors': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
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
        if created:
            logger.info(f"Created new profile for user ID {self.request.user.id}")
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
            logger.error(f"Profile retrieval error for user {request.user.id}: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to retrieve profile'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def update(self, request, *args, **kwargs):
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'message': 'Invalid data provided',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)

            self.perform_update(serializer)
            logger.info(f"Profile updated for user ID {request.user.id}")
            
            return Response({
                'success': True,
                'message': 'Profile updated successfully',
                'data': {
                    'user': UserSerializer(request.user).data,
                    'profile': serializer.data
                }
            }, status=status.HTTP_200_OK)

        except ValidationError as e:
            return Response({
                'success': False,
                'message': 'Validation error',
                'errors': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Profile update error for user {request.user.id}: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to update profile'
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
                    'total_count': sessions.count()
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Sessions retrieval error for user {request.user.id}: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to retrieve sessions'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request):
        """Terminate a specific session or all sessions."""
        try:
            session_id = request.data.get('session_id')
            terminate_all = request.data.get('terminate_all', False)

            with transaction.atomic():
                if terminate_all:
                    # Terminate all sessions except current one
                    UserSession.objects.filter(
                        user=request.user,
                        is_active=True
                    ).update(is_active=False, ended_at=timezone.now())
                    
                    message = 'All sessions terminated successfully'
                    logger.info(f"All sessions terminated for user ID {request.user.id}")
                
                elif session_id:
                    # Terminate specific session
                    try:
                        session = UserSession.objects.get(
                            id=session_id,
                            user=request.user,
                            is_active=True
                        )
                        session.is_active = False
                        session.ended_at = timezone.now()
                        session.save()
                        
                        message = 'Session terminated successfully'
                        logger.info(f"Session {session_id} terminated for user ID {request.user.id}")
                    
                    except UserSession.DoesNotExist:
                        return Response({
                            'success': False,
                            'message': 'Session not found'
                        }, status=status.HTTP_404_NOT_FOUND)
                
                else:
                    return Response({
                        'success': False,
                        'message': 'session_id or terminate_all parameter required'
                    }, status=status.HTTP_400_BAD_REQUEST)

            return Response({
                'success': True,
                'message': message
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Session termination error for user {request.user.id}: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to terminate session'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_login_history(request):
    """Get user's login history."""
    try:
        # Get pagination parameters
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 50))
        
        # Calculate offset
        offset = (page - 1) * page_size
        
        history = UserLoginHistory.objects.filter(
            user=request.user
        ).order_by('-timestamp')[offset:offset + page_size]

        total_count = UserLoginHistory.objects.filter(user=request.user).count()

        serializer = UserLoginHistorySerializer(history, many=True)
        
        return Response({
            'success': True,
            'data': {
                'login_history': serializer.data,
                'total_count': total_count,
                'page': page,
                'page_size': page_size,
                'has_next': offset + page_size < total_count
            }
        }, status=status.HTTP_200_OK)

    except (ValueError, TypeError) as e:
        return Response({
            'success': False,
            'message': 'Invalid pagination parameters'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Login history retrieval error for user {request.user.id}: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to retrieve login history'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class B2BAdminLoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AdminLoginRateThrottle]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({
                "success": False, 
                "message": "Email and password required"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                ip_address = get_client_ip(request)
                user_agent = get_user_agent(request)
                
                # Create login history entry
                login_history = UserLoginHistory.objects.create(
                    email_attempted=email,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    status='attempting',
                    notes='B2B Admin login attempt'
                )

                user = authenticate(request, email=email, password=password)

                if not user:
                    login_history.status = 'failed_credentials'
                    login_history.save()
                    logger.warning(f"Failed B2B admin login attempt from {ip_address}")
                    return Response({
                        "success": False, 
                        "message": "Invalid credentials"
                    }, status=status.HTTP_401_UNAUTHORIZED)

                if not user.is_active:
                    login_history.user = user
                    login_history.status = 'failed_inactive'
                    login_history.save()
                    logger.warning(f"B2B admin login attempt for inactive user {user.id}")
                    return Response({
                        "success": False, 
                        "message": "Account disabled"
                    }, status=status.HTTP_403_FORBIDDEN)

                # Check if user has role field and if it's b2b_admin
                if not hasattr(user, 'role') or user.role != "b2b_admin":
                    login_history.user = user
                    login_history.status = 'failed_authorization'
                    login_history.save()
                    logger.warning(f"Unauthorized B2B admin login attempt by user {user.id}")
                    return Response({
                        "success": False, 
                        "message": "Not authorized as B2B admin"
                    }, status=status.HTTP_403_FORBIDDEN)

                # Success - issue tokens
                refresh = RefreshToken.for_user(user)
                
                # Create session
                session_key = uuid.uuid4().hex[:32]
                create_user_session(
                    user=user,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    session_key=session_key
                )

                user.last_login = timezone.now()
                user.save(update_fields=["last_login"])

                login_history.user = user
                login_history.status = 'success'
                login_history.save()

                logger.info(f"Successful B2B admin login for user ID {user.id}")

                return Response({
                    "success": True,
                    "message": "B2B Admin login successful",
                    "data": {
                        "access_token": str(refresh.access_token),
                        "refresh_token": str(refresh),
                        "token_type": "Bearer",
                        "expires_in": settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
                        "user": UserSerializer(user).data
                    }
                }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"B2B admin login error: {str(e)}")
            return Response({
                "success": False,
                "message": "Login failed due to server error"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AdminLoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [AdminLoginRateThrottle]

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({
                "success": False, 
                "message": "Email and password required"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                ip_address = get_client_ip(request)
                user_agent = get_user_agent(request)
                
                # Create login history entry
                login_history = UserLoginHistory.objects.create(
                    email_attempted=email,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    status='attempting',
                    notes='Admin login attempt'
                )

                user = authenticate(request, email=email, password=password)

                if not user:
                    login_history.status = 'failed_credentials'
                    login_history.save()
                    logger.warning(f"Failed admin login attempt from {ip_address}")
                    return Response({
                        "success": False, 
                        "message": "Invalid credentials"
                    }, status=status.HTTP_401_UNAUTHORIZED)

                if not user.is_active:
                    login_history.user = user
                    login_history.status = 'failed_inactive'
                    login_history.save()
                    logger.warning(f"Admin login attempt for inactive user {user.id}")
                    return Response({
                        "success": False, 
                        "message": "Account disabled"
                    }, status=status.HTTP_403_FORBIDDEN)

                if not user.is_superuser:
                    login_history.user = user
                    login_history.status = 'failed_authorization'
                    login_history.save()
                    logger.warning(f"Unauthorized admin login attempt by user {user.id}")
                    return Response({
                        "success": False, 
                        "message": "Not authorized as Admin"
                    }, status=status.HTTP_403_FORBIDDEN)

                # Success - issue tokens
                refresh = RefreshToken.for_user(user)
                
                # Create session
                session_key = uuid.uuid4().hex[:32]
                create_user_session(
                    user=user,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    session_key=session_key
                )

                user.last_login = timezone.now()
                user.save(update_fields=["last_login"])

                login_history.user = user
                login_history.status = 'success'
                login_history.save()

                logger.info(f"Successful admin login for user ID {user.id}")

                return Response({
                    "success": True,
                    "message": "Admin login successful",
                    "data": {
                        "access_token": str(refresh.access_token),
                        "refresh_token": str(refresh),
                        "token_type": "Bearer",
                        "expires_in": settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
                        "user": UserSerializer(user).data
                    }
                }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Admin login error: {str(e)}")
            return Response({
                "success": False,
                "message": "Login failed due to server error"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChangePasswordView(APIView):
    """View for changing user password."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid input data',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']

        # Check old password
        if not user.check_password(old_password):
            return Response({
                'success': False,
                'message': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # Set new password
                user.set_password(new_password)
                user.save()

                # Log password change
                UserLoginHistory.objects.create(
                    user=user,
                    email_attempted=user.email,
                    status='success',
                    ip_address=get_client_ip(request),
                    user_agent=get_user_agent(request),
                    notes='Password changed'
                )

                logger.info(f"Password changed for user ID {user.id}")

                return Response({
                    'success': True,
                    'message': 'Password changed successfully'
                }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Password change error for user {user.id}: {str(e)}")
            return Response({
                'success': False,
                'message': 'Failed to change password'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class LogoutView(APIView):
    """View for user logout."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()

            # Deactivate current session if exists
            UserSession.objects.filter(
                user=request.user,
                is_active=True
            ).update(is_active=False, ended_at=timezone.now())

            # Log logout
            UserLoginHistory.objects.create(
                user=request.user,
                email_attempted=request.user.email,
                status='success',
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request),
                notes='User logout'
            )

            logger.info(f"User ID {request.user.id} logged out")

            return Response({
                'success': True,
                'message': 'Logged out successfully'
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Logout error for user {request.user.id}: {str(e)}")
            return Response({
                'success': False,
                'message': 'Logout failed'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_summary(request):
    """Get user profile summary with stats."""
    try:
        user = request.user
        profile = UserProfile.objects.get_or_create(user=user)[0]
        
        # Get statistics
        total_logins = UserLoginHistory.objects.filter(
            user=user, 
            status='success'
        ).count()
        
        active_sessions = UserSession.objects.filter(
            user=user,
            is_active=True
        ).count()
        
        last_successful_login = UserLoginHistory.objects.filter(
            user=user,
            status='success'
        ).order_by('-timestamp').first()

        return Response({
            'success': True,
            'data': {
                'user': UserSerializer(user).data,
                'profile': UserProfileSerializer(profile).data,
                'stats': {
                    'total_logins': total_logins,
                    'active_sessions': active_sessions,
                    'last_login': last_successful_login.timestamp if last_successful_login else None,
                }
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Profile summary error for user {request.user.id}: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to retrieve profile summary'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)