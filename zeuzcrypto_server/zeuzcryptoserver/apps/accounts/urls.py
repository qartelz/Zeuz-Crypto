# accounts/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from .views import UserDetailWithTradesView, BatchUsersByB2BAdminView

app_name = 'accounts'

urlpatterns = [
    # Authentication & Management
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('b2b-admin/register/', views.B2BAdminRegisterView.as_view(), name='b2b_admin_register'),
    path('b2b-user/register/', views.B2BUserRegisterView.as_view(), name='b2b_user_register'),
    
    # User Management
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('me/', views.CurrentUserView.as_view(), name='current_user'),
    path('users/<uuid:id>/details/', UserDetailWithTradesView.as_view(), name='user-detail-with-trades'),
    
    # Password Management
    path('password-reset/', views.PasswordResetView.as_view(), name='password_reset'),
    path('password-reset/confirm/<str:token>/', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('password-setup/<str:token>/', views.PasswordSetupView.as_view(), name='password_setup'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
    
    # Batch Management
    path('batch/create/', views.BatchCreateView.as_view(), name='batch_create'),
    path('batch/list/', views.BatchListView.as_view(), name='batch_list'),
    path('batch/users/<uuid:batch_id>/', views.BatchUsersView.as_view(), name='batch_users'),
    path('batches/b2b-admin/<uuid:b2b_admin_id>/', BatchUsersByB2BAdminView.as_view(), name='batch-users-by-b2b-admin'),
    
    # Approval & Roles
    path('b2b-admin/approval-list/', views.B2BAdminApprovalListView.as_view(), name='b2b_admin_approval_list'),
    path('b2b-admin/approve/<uuid:user_id>/', views.B2BAdminApproveView.as_view(), name='b2b_admin_approve'),
    path('b2b-admin/reject/<uuid:user_id>/', views.B2BAdminRejectView.as_view(), name='b2b_admin_reject'),
    
    # Wallet & Profile
    path('wallet/', views.WalletView.as_view(), name='wallet'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    
    # Additional Endpoints
    path('b2b-admin/users/', views.B2BAdminUsersView.as_view(), name='b2b_admin_users'),
    path('activity-log/', views.activity_log, name='activity_log'),
]