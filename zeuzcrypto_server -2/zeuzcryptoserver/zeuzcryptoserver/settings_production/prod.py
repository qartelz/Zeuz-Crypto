# zeuzcryptoserver/settings/prod.py

from .base import *
import os
import dj_database_url

DEBUG = True

# Set this environment variable to a comma-separated list of allowed hosts
ALLOWED_HOSTS = ["*"] # Allow all for Railway internal/external routing or customize
CSRF_TRUSTED_ORIGINS = [
    # "https://*.up.railway.app",
    # "https://*.railway.app",
    "https://zeuzcrypto.com",
    "https://www.zeuzcrypto.com",
]

# Database
# Railway provides DATABASE_URL for linked Postgres services
# Database
# Use provided credentials or fallback to DATABASE_URL
DATABASES = {
    "default": dj_database_url.config(
        default="postgres://postgres:iDLijIdGtsgKjIeJxmUHDUDskdftytZX@shinkansen.proxy.rlwy.net:13821/railway",
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Redis / Channels
# Railway provides REDIS_URL for linked Redis services
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [os.getenv("REDIS_URL", "redis://localhost:6379")],
        },
    },
}

# Static Files
# Whitenoise for serving static files
try:
    # Insert Whitenoise after SecurityMiddleware
    security_index = MIDDLEWARE.index("django.middleware.security.SecurityMiddleware")
    MIDDLEWARE.insert(security_index + 1, "whitenoise.middleware.WhiteNoiseMiddleware")
except ValueError:
    # Fallback if SecurityMiddleware is missing
    MIDDLEWARE.insert(0, "whitenoise.middleware.WhiteNoiseMiddleware")

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ASGI Application (Required for Daphne/Channels)
ASGI_APPLICATION = "zeuzcryptoserver.asgi.application"

# Celery Configuration
CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://localhost:6379")

# Security
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
