import uuid
from django.utils import timezone
from .models import UserSession


def get_client_ip(request):
    """Extract client IP address from request headers."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0]
    else:
        ip = request.META.get("REMOTE_ADDR")
    return ip


def get_user_agent(request):
    """Get user agent string (browser/device info)."""
    return request.META.get("HTTP_USER_AGENT", "unknown")


def create_user_session(user, ip_address, user_agent, session_key=None):
    """Create and return a new UserSession entry."""
    if not session_key:
        session_key = str(uuid.uuid4())

    session = UserSession.objects.create(
        user=user,
        session_key=session_key,
        ip_address=ip_address,
        user_agent=user_agent,
        created_at=timezone.now(),
        last_activity=timezone.now(),
    )
    return session
