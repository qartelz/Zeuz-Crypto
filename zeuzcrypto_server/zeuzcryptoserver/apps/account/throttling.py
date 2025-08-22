from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    """
    Custom throttle class for login attempts.
    Throttles requests based on IP address.
    """

    scope = "login"

    def get_cache_key(self, request, view):
        # Only throttle login attempts (POST method)
        if request.method != "POST":
            return None

        # Identify client by IP address
        ident = self.get_ident(request)

        return self.cache_format % {
            "scope": self.scope,
            "ident": ident
        }
