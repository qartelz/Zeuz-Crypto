# accounts/permissions.py

from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """Allow only admin users."""
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == 'admin' and
            request.user.is_active
        )


class IsB2BAdmin(permissions.BasePermission):
    """Allow only approved B2B admin users."""
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.role == 'b2b_admin' and 
            request.user.is_approved and
            request.user.is_active
        )


class IsAdminOrB2BAdmin(permissions.BasePermission):
    """Allow admin or approved B2B admin users."""
    
    def has_permission(self, request, view):
        if not (request.user.is_authenticated and request.user.is_active):
            return False
            
        if request.user.role == 'admin':
            return True
        elif request.user.role == 'b2b_admin':
            return request.user.is_approved
        return False


class IsOwnerOrAdmin(permissions.BasePermission):
    """Allow owners of an object or admins to access it."""
    
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_active

    def has_object_permission(self, request, view, obj):
        # Read permissions for authenticated users
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only to the owner or admin
        return (
            obj == request.user or 
            request.user.role == 'admin' or
            (hasattr(obj, 'created_by') and obj.created_by == request.user)
        )


class IsB2BAdminOrCreator(permissions.BasePermission):
    """Allow B2B admin to access their created users/batches."""
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            request.user.is_active and
            request.user.role in ['admin', 'b2b_admin']
        )

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        
        return (
            request.user.role == 'b2b_admin' and 
            request.user.is_approved and
            hasattr(obj, 'created_by') and 
            obj.created_by == request.user
        )


from rest_framework import permissions
from apps.admin.subscriptions.models import Subscription
from django.utils import timezone


class HasActiveSubscription(permissions.BasePermission):
    """
    Allows access only to users with an active (non-expired) subscription.
    """

    message = {"detail": "You don't have an active subscription."}

    def has_permission(self, request, view):
        user = request.user

        # Must be authenticated
        if not user or not user.is_authenticated:
            self.message = {"detail": "Authentication required."}
            return False

        # Auto-expire any outdated subscriptions
        Subscription.objects.filter(
            user=user,
            end_date__lt=timezone.now(),
            status="ACTIVE"
        ).update(status="EXPIRED")

        # Check if user has a valid active subscription
        active_subscription = (
            Subscription.objects
            .filter(user=user, status="ACTIVE", end_date__gte=timezone.now())
            .order_by('-end_date')
            .first()
        )

        if not active_subscription:
            self.message = {"detail": "You don't have an active subscription."}
            return False

        # Optional: attach subscription to request for easy access in views
        request.active_subscription = active_subscription
        return True
