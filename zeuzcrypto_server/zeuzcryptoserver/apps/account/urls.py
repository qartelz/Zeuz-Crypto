from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import (
    CustomTokenObtainPairView,
    UserRegistrationView,
    UserProfileView,
    UserSessionsView,
    user_login_history,
)

urlpatterns = [
    # Authentication
    path("auth/register/", UserRegistrationView.as_view(), name="user-register"),
    path("auth/login/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/verify/", TokenVerifyView.as_view(), name="token_verify"),

    # Profile
    path("user/profile/", UserProfileView.as_view(), name="user-profile"),

    # Sessions
    path("user/sessions/", UserSessionsView.as_view(), name="user-sessions"),

    # Login history
    path("user/login-history/", user_login_history, name="user-login-history"),

    # Password reset
    # path("auth/password/reset/", 
    #      PasswordResetSerializer.as_view(), name="password-reset"),
    # path("auth/password/reset/confirm/", 
    #      PasswordResetConfirmSerializer.as_view(), name="password-reset-confirm"),
]
