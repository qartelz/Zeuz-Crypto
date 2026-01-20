from rest_framework.throttling import SimpleRateThrottle
import logging

logger = logging.getLogger(__name__)


class BaseIPThrottle(SimpleRateThrottle):
    """
    Base throttle class that identifies client by IP.
    Other throttles can inherit this and just change the scope.
    """

    def get_cache_key(self, request, view):
        # Only throttle POST requests
        if request.method != "POST":
            return None

        ident = self.get_ident(request)
        if not ident:
            logger.warning("Could not identify client for rate limiting")
            return None

        return self.cache_format % {"scope": self.scope, "ident": ident}

    def get_ident(self, request):
        """
        Identify client IP address with proxy/CDN support.
        Priority order:
        - X-Forwarded-For (first IP)
        - X-Real-IP
        - CF-Connecting-IP (Cloudflare)
        - REMOTE_ADDR
        """
        ip = None

        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0].strip()

        if not ip:
            ip = request.META.get("HTTP_X_REAL_IP")

        if not ip:
            ip = request.META.get("HTTP_CF_CONNECTING_IP")

        if not ip:
            ip = request.META.get("REMOTE_ADDR")

        return ip

    def throttle_failure(self):
        """Log when throttle is exceeded."""
        logger.warning(f"[{self.scope}] Rate limit exceeded for ident: {self.history}")
        return super().throttle_failure()


class LoginRateThrottle(BaseIPThrottle):
    """Throttle for normal user login attempts."""
    scope = "login"


class RegistrationRateThrottle(BaseIPThrottle):
    """Throttle for user registration attempts (more restrictive)."""
    scope = "registration"


class AdminLoginRateThrottle(BaseIPThrottle):
    """Throttle for admin login attempts (very restrictive)."""
    scope = "admin_login"

    def throttle_failure(self):
        logger.error(f"[{self.scope}] Admin login rate limit exceeded: {self.history}")
        return super().throttle_failure()


class EmailBasedThrottle(SimpleRateThrottle):
    """
    Throttle based on email address instead of IP.
    Useful for protecting specific accounts.
    """

    scope = "email_login"

    def get_cache_key(self, request, view):
        if request.method != "POST":
            return None

        email = request.data.get("email")
        if not email:
            return None

        ident = email.strip().lower()
        return self.cache_format % {"scope": self.scope, "ident": ident}

    def throttle_failure(self):
        logger.warning(f"[{self.scope}] Email-based rate limit exceeded: {self.history}")
        return super().throttle_failure()


# from rest_framework.throttling import SimpleRateThrottle


# class LoginRateThrottle(SimpleRateThrottle):
#     """
#     Custom throttle class for login attempts.
#     Throttles requests based on IP address.
#     """

#     scope = "login"

#     def get_cache_key(self, request, view):
#         # Only throttle login attempts (POST method)
#         if request.method != "POST":
#             return None

#         # Identify client by IP address
#         ident = self.get_ident(request)

#         return self.cache_format % {
#             "scope": self.scope,
#             "ident": ident
#         }

# from rest_framework.throttling import SimpleRateThrottle
# import logging

# logger = logging.getLogger(__name__)


# class LoginRateThrottle(SimpleRateThrottle):
#     """
#     Custom throttle class for login attempts.
#     Throttles requests based on IP address for authentication endpoints.
#     """
    
#     scope = "login"
    
#     def get_cache_key(self, request, view):
#         """
#         Generate cache key for throttling based on IP address.
#         Only applies to POST requests on authentication endpoints.
#         """
#         # Only throttle POST requests (login attempts)
#         if request.method != "POST":
#             return None
        
#         # Get client IP address
#         ident = self.get_ident(request)
        
#         if not ident:
#             logger.warning("Could not identify client for rate limiting")
#             return None
        
#         return self.cache_format % {
#             "scope": self.scope,
#             "ident": ident
#         }
    
#     def get_ident(self, request):
#         """
#         Identify the client by IP address with better handling of proxies.
#         """
#         # Check for forwarded IPs (load balancers, proxies)
#         x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
#         if x_forwarded_for:
#             # Get the first IP (original client)
#             ip = x_forwarded_for.split(',')[0].strip()
#         else:
#             # Direct connection
#             ip = request.META.get('REMOTE_ADDR')
        
#         # Additional headers to check for real IP
#         if not ip or ip in ['127.0.0.1', 'localhost']:
#             # Check other common proxy headers
#             real_ip = request.META.get('HTTP_X_REAL_IP')
#             if real_ip:
#                 ip = real_ip
#             else:
#                 cf_connecting_ip = request.META.get('HTTP_CF_CONNECTING_IP')  # Cloudflare
#                 if cf_connecting_ip:
#                     ip = cf_connecting_ip
        
#         return ip
    
#     def throttle_failure(self):
#         """
#         Called when a throttle limit is exceeded.
#         Log the event for security monitoring.
#         """
#         logger.warning(f"Rate limit exceeded for IP: {self.history}")
#         return super().throttle_failure()


# class RegistrationRateThrottle(SimpleRateThrottle):
#     """
#     Custom throttle class specifically for user registration.
#     More restrictive than login throttling.
#     """
    
#     scope = "registration"
    
#     def get_cache_key(self, request, view):
#         """Generate cache key for registration throttling."""
#         if request.method != "POST":
#             return None
        
#         ident = self.get_ident(request)
        
#         if not ident:
#             return None
        
#         return self.cache_format % {
#             "scope": self.scope,
#             "ident": ident
#         }
    
#     def get_ident(self, request):
#         """Same IP identification logic as LoginRateThrottle."""
#         x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
#         if x_forwarded_for:
#             ip = x_forwarded_for.split(',')[0].strip()
#         else:
#             ip = request.META.get('REMOTE_ADDR')
        
#         if not ip or ip in ['127.0.0.1', 'localhost']:
#             real_ip = request.META.get('HTTP_X_REAL_IP')
#             if real_ip:
#                 ip = real_ip
#             else:
#                 cf_connecting_ip = request.META.get('HTTP_CF_CONNECTING_IP')
#                 if cf_connecting_ip:
#                     ip = cf_connecting_ip
        
#         return ip
    
#     def throttle_failure(self):
#         """Log registration rate limit exceeded."""
#         logger.warning(f"Registration rate limit exceeded for IP: {self.history}")
#         return super().throttle_failure()


# class AdminLoginRateThrottle(SimpleRateThrottle):
#     """
#     More restrictive throttle for admin login attempts.
#     """
    
#     scope = "admin_login"
    
#     def get_cache_key(self, request, view):
#         """Generate cache key for admin login throttling."""
#         if request.method != "POST":
#             return None
        
#         ident = self.get_ident(request)
        
#         if not ident:
#             return None
        
#         return self.cache_format % {
#             "scope": self.scope,
#             "ident": ident
#         }
    
#     def get_ident(self, request):
#         """Same IP identification logic."""
#         x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
#         if x_forwarded_for:
#             ip = x_forwarded_for.split(',')[0].strip()
#         else:
#             ip = request.META.get('REMOTE_ADDR')
        
#         if not ip or ip in ['127.0.0.1', 'localhost']:
#             real_ip = request.META.get('HTTP_X_REAL_IP')
#             if real_ip:
#                 ip = real_ip
#             else:
#                 cf_connecting_ip = request.META.get('HTTP_CF_CONNECTING_IP')
#                 if cf_connecting_ip:
#                     ip = cf_connecting_ip
        
#         return ip
    
#     def throttle_failure(self):
#         """Log admin login rate limit exceeded with higher priority."""
#         logger.error(f"Admin login rate limit exceeded for IP: {self.history}")
#         return super().throttle_failure()


# class EmailBasedThrottle(SimpleRateThrottle):
#     """
#     Throttle based on email address for failed login attempts.
#     Useful to prevent targeted attacks on specific accounts.
#     """
    
#     scope = "email_login"
    
#     def get_cache_key(self, request, view):
#         """Generate cache key based on email address."""
#         if request.method != "POST":
#             return None
        
#         # Get email from request data
#         email = request.data.get('email')
#         if not email:
#             return None
        
#         # Normalize email to lowercase
#         ident = email.lower().strip()
        
#         return self.cache_format % {
#             "scope": self.scope,
#             "ident": ident
#         }
    
#     def throttle_failure(self):
#         """Log email-based rate limit exceeded."""
#         logger.warning(f"Email-based rate limit exceeded: {self.history}")
#         return super().throttle_failure()