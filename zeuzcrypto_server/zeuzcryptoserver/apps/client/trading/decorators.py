from functools import wraps
from django.http import JsonResponse
from .exceptions import TradingException


def handle_trading_exceptions(func):
    """Decorator to handle trading exceptions"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except TradingException as e:
            return JsonResponse({
                'error': str(e),
                'error_type': e.__class__.__name__
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'error': 'An unexpected error occurred',
                'error_type': 'SystemError'
            }, status=500)
    return wrapper


def require_trading_permission(func):
    """Decorator to check trading permissions"""
    @wraps(func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required'}, status=401)
        
        # Add custom permission checks here
        # if not request.user.profile.can_trade:
        #     return JsonResponse({'error': 'Trading not permitted'}, status=403)
        
        return func(request, *args, **kwargs)
    return wrapper

