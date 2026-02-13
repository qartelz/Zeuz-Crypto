# zeuzcryptoserver/settings/base.py

from datetime import timedelta
from pathlib import Path
# from decouple import config
import os
from celery.schedules import crontab

# BASE_DIR = Path(__file__).resolve().parent.parent
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# -----------------------------------------------------------------------------
# Security & Debug
# -----------------------------------------------------------------------------
# DEBUG = config("DEBUG", default=False, cast=bool)

# ⚠️ For production, use environment variable for SECRET_KEY
# SECRET_KEY = config("SECRET_KEY", default="django-insecure-dev-key")
SECRET_KEY = "django-insecure-+5s+xno^y)ss$-8i8_#%7xv3-)im#gihn1g$c^l!wd!&6#ryj7"

ALLOWED_HOSTS = ["*"]

# -----------------------------------------------------------------------------
# Custom User Model
# -----------------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"

# -----------------------------------------------------------------------------
# Installed Apps
# -----------------------------------------------------------------------------
INSTALLED_APPS = [
    'daphne',

    'channels',
    
    "apps.account",
    "apps.accounts",
    "apps.admin.subscriptions",
    "apps.client.trading",
    "apps.admin.challenge.apps.ChallengeConfig",
    # Third-party apps
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    # Django contrib apps
    "django.contrib.sites",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

# -----------------------------------------------------------------------------
# Middleware
# -----------------------------------------------------------------------------
MIDDLEWARE = [
    
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

# -----------------------------------------------------------------------------
# URL / WSGI
# -----------------------------------------------------------------------------
ROOT_URLCONF = "zeuzcryptoserver.urls"
WSGI_APPLICATION = "zeuzcryptoserver.wsgi.application"

# -----------------------------------------------------------------------------
# Database
# -----------------------------------------------------------------------------
import dj_database_url

# ...

DATABASES = {
    "default": dj_database_url.config(
        default="postgres://postgres:iDLijIdGtsgKjIeJxmUHDUDskdftytZX@shinkansen.proxy.rlwy.net:13821/railway",
        conn_max_age=600,
        conn_health_checks=True,
    )
}

CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = "Asia/Kolkata"

# ...

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [os.getenv("REDIS_URL", "redis://127.0.0.1:6379")],
        },
    },
}

# -----------------------------------------------------------------------------
# Password Validators
# -----------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# -----------------------------------------------------------------------------
# Caches (default: local memory, use Redis in production)
# -----------------------------------------------------------------------------
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}

# -----------------------------------------------------------------------------
# Django REST Framework
# -----------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        # "rest_framework_simplejwt.authentication.JWTAuthentication",
        "apps.accounts.authentication.SingleSessionJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ],
}

# -----------------------------------------------------------------------------
# JWT Settings (choose ONE block, not duplicates)
# -----------------------------------------------------------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),  # ✅ short for security
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

# -----------------------------------------------------------------------------
# CORS
# -----------------------------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
"https://www.zeuzcrypto.com",
"https://zeuzcrypto.com",
"https://radiant-tiramisu-e6e3c5.netlify.app",
    # "https://www.zeuzcrypto.com",
    # "https://yourdomain.com",
]
from corsheaders.defaults import default_headers

# CORS_ALLOW_HEADERS = list(default_headers) + [
#     "Content-Type",
# ]
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "Content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]


# -----------------------------------------------------------------------------
# Static & Media
# -----------------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"] if (BASE_DIR / "static").exists() else []

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# -----------------------------------------------------------------------------
# Sessions
# -----------------------------------------------------------------------------
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_SAVE_EVERY_REQUEST = True

# -----------------------------------------------------------------------------
# Internationalization
# -----------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True

# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SITE_ID = 1

# -----------------------------------------------------------------------------
# Email
# -----------------------------------------------------------------------------
# EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
# EMAIL_HOST = config("EMAIL_HOST", default="smtp.gmail.com")
# EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
# EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
# EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
# EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
# DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# -----------------------------------------------------------------------------
# Custom Settings
# -----------------------------------------------------------------------------
THROTTLE_SETTINGS = {
    "LOGIN_ATTEMPTS_PER_IP": 10,  # Per minute
    "ADMIN_LOGIN_ATTEMPTS_PER_IP": 3,
    "REGISTRATION_ATTEMPTS_PER_IP": 5,
    "FAILED_LOGIN_LOCKOUT_TIME": 30000000000,  # 5 minutes
    "MAX_LOGIN_HISTORY_ENTRIES": 100,
}

USER_AGENT_MAX_LENGTH = 500

SESSION_SETTINGS = {
    "DEFAULT_EXPIRY_DAYS": 30,
    "MAX_SESSIONS_PER_USER": 5,
    "CLEANUP_OLD_SESSIONS": True,
}

SECURITY_SETTINGS = {
    "LOG_FAILED_LOGINS": True,
    "LOG_SUCCESSFUL_LOGINS": True,
    "TRACK_SESSION_ACTIVITY": True,
    "REQUIRE_EMAIL_VERIFICATION": True,
}


# -----------------------------------------------------------------------------
# Trading System
# -----------------------------------------------------------------------------
# settings.py additions


# Trading System Settings
TRADING_SETTINGS = {
    # Risk Management
    "MAX_LEVERAGE": {
        "SPOT": 1,
        "FUTURES": 10,
        "OPTIONS": 1,
    },
    # Position Limits
    "MAX_POSITION_CONCENTRATION": 30,  # Max 30% in single asset
    "MAX_DAILY_TRADES": 50,
    "MAX_OPEN_POSITIONS": 100,
    # Margin Requirements
    "MARGIN_CALL_THRESHOLD": 80,  # 80% of initial margin
    "LIQUIDATION_THRESHOLD": 90,  # 90% of initial margin
    # Fee Structure
    "TRADING_FEES": {
        "SPOT": 0.001,  # 0.1%
        "FUTURES": 0.0005,  # 0.05%
        "OPTIONS": 0.002,  # 0.2%
    },
    # Market Hours (for validation)
    "MARKET_HOURS": {
        "CRYPTO": {"open": True, "hours": "24/7"},
        "EQUITY": {
            "open_time": "09:30",
            "close_time": "16:00",
            "timezone": "America/New_York",
            "weekends": False,
        },
    },
    # Price Update Settings
    "PRICE_UPDATE_INTERVAL": 5,  # seconds
    "BATCH_SIZE": 100,  # trades to update in one batch
    # Webhook Settings
    "WEBHOOK_TIMEOUT": 30,  # seconds
    "WEBHOOK_RETRY_ATTEMPTS": 3,
}

# Celery Settings for Background Tasks
CELERY_BEAT_SCHEDULE = {
    "update-unrealized-pnl": {
        "task": "apps.client.trading.tasks.update_unrealized_pnl",
        "schedule": 30.0,  # Every 30 seconds
    },
    "update-portfolio-metrics": {
        "task": "apps.client.trading.tasks.update_portfolio_metrics",
        "schedule": 60.0,  # Every minute
    },
    "check-options-expiry": {
        "task": "apps.client.trading.tasks.check_options_expiry",
        "schedule": crontab(hour=16, minute=0),  # 4 PM daily
    },
    "check-futures-expiry": {
        "task": "apps.client.trading.tasks.check_futures_expiry",
        "schedule": crontab(hour=16, minute=15),  # 4:15 PM daily
    },
    "daily-portfolio-snapshot": {
        "task": "apps.client.trading.tasks.daily_portfolio_snapshot",
        "schedule": crontab(hour=23, minute=59),  # End of day
    },

    'check-expired-options-daily': {
        'task': 'apps.client.trading.tasks.check_expired_options',
        'schedule': crontab(hour=0, minute=5),
    },
    'sync-active-symbols': {
        'task': 'apps.client.trading.tasks.sync_active_symbols',
        'schedule': 300.0,  # every 5 minutes
    },
    'monitor-margins': {
        'task': 'apps.client.trading.tasks.monitor_all_margins',
        'schedule': 60.0,  # every minute
    },
}

# Logging Configuration
LOGS_DIR = BASE_DIR / "logs"
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
        "file": {
            "level": "INFO",
            "class": "logging.FileHandler",
            "filename": os.path.join(LOGS_DIR, "django.log"),
            "formatter": "verbose",
        },
        "trading_file": {
            "level": "INFO",
            "class": "logging.FileHandler",
            "filename": os.path.join(LOGS_DIR, "trading.log"),
            "formatter": "verbose",
        },
        "trading_errors": {
            "level": "ERROR",
            "class": "logging.FileHandler",
            "filename": os.path.join(LOGS_DIR, "trading_errors.log"),
            "formatter": "verbose",
        },
    },
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": True,
        },
        "trading": {
            "handlers": ["trading_file", "trading_errors"],
            "level": "INFO",
            "propagate": True,
        },
        "apps.client.trading": {
            "handlers": ["trading_file", "trading_errors"],
            "level": "INFO",
            "propagate": True,
        },
    },
}


# # zeuzcryptoserver/settings/base.py

# from datetime import timedelta
# from pathlib import Path
# from decouple import config

# DEBUG = config("DEBUG", default=False, cast=bool)
# import os

# BASE_DIR = Path(__file__).resolve().parent.parent

# # Custom User Model
# AUTH_USER_MODEL = "accounts.User"

# # SECURITY WARNING: keep the secret key used in production secret!
# SECRET_KEY = "django-insecure-+5s+xno^y)ss$-8i8_#%7xv3-)im#gihn1g$c^l!wd!&6#ryj7"

# # Applications
# INSTALLED_APPS = [
#     # Local apps
#     "apps.account",  # account details, login, registration, etc.
#     "apps.accounts",
#     # Third-party apps
#     # Third party apps
#     "rest_framework",
#     "rest_framework_simplejwt",
#     "rest_framework_simplejwt.token_blacklist",
#     "corsheaders",
#     "django_filters",
#     # "rest_framework",
#     # "rest_framework_simplejwt",
#     # "rest_framework_simplejwt.token_blacklist",
#     # "corsheaders",
#     # Django contrib apps
#     "django.contrib.sites",
#     "django.contrib.admin",
#     "django.contrib.auth",
#     "django.contrib.contenttypes",
#     "django.contrib.sessions",
#     "django.contrib.messages",
#     "django.contrib.staticfiles",
# ]

# # Middleware
# MIDDLEWARE = [
#     "corsheaders.middleware.CorsMiddleware",
#     "django.middleware.security.SecurityMiddleware",
#     "django.contrib.sessions.middleware.SessionMiddleware",
#     "django.middleware.common.CommonMiddleware",
#     "django.middleware.csrf.CsrfViewMiddleware",
#     "django.contrib.auth.middleware.AuthenticationMiddleware",
#     "django.contrib.messages.middleware.MessageMiddleware",
#     "django.middleware.clickjacking.XFrameOptionsMiddleware",
# ]

# ROOT_URLCONF = "zeuzcryptoserver.urls"

# TEMPLATES = [
#     {
#         "BACKEND": "django.template.backends.django.DjangoTemplates",
#         "DIRS": [BASE_DIR / "templates"],
#         "APP_DIRS": True,
#         "OPTIONS": {
#             "context_processors": [
#                 "django.template.context_processors.debug",
#                 "django.template.context_processors.request",
#                 "django.contrib.auth.context_processors.auth",
#                 "django.contrib.messages.context_processors.messages",
#             ],
#         },
#     },
# ]
# # TEMPLATES = [
# #     {
# #         "BACKEND": "django.template.backends.django.DjangoTemplates",
# #         "DIRS": [],
# #         "APP_DIRS": True,
# #         "OPTIONS": {
# #             "context_processors": [
# #                 "django.template.context_processors.debug",
# #                 "django.template.context_processors.request",
# #                 "django.contrib.auth.context_processors.auth",
# #                 "django.contrib.messages.context_processors.messages",
# #             ],
# #         },
# #     },
# # ]

# WSGI_APPLICATION = "zeuzcryptoserver.wsgi.application"

# # Password Validation
# AUTH_PASSWORD_VALIDATORS = [
#     {
#         "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
#     },
#     {
#         "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
#         "OPTIONS": {"min_length": 8},
#     },
#     {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
#     {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
# ]

# # Cache (for throttling, sessions, etc.)
# CACHES = {
#     "default": {
#         "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
#     }
# }

# # Django REST Framework
# # REST_FRAMEWORK = {
# #     "DEFAULT_AUTHENTICATION_CLASSES": (
# #         "rest_framework_simplejwt.authentication.JWTAuthentication",
# #     ),
# #     "DEFAULT_PERMISSION_CLASSES": (
# #         "rest_framework.permissions.IsAuthenticated",
# #     ),
# #     "DEFAULT_THROTTLE_CLASSES": [
# #         "rest_framework.throttling.AnonRateThrottle",
# #         "rest_framework.throttling.UserRateThrottle",
# #         "apps.account.throttling.LoginRateThrottle",  # custom login throttle
# #     ],
# #     "DEFAULT_THROTTLE_RATES": {
# #         "anon": "100/day",
# #         "user": "1000/day",
# #         "login": "5/minute",  # limit login attempts
# #     },

# # }


# # REST Framework Throttling Configuration
# # REST_FRAMEWORK = {
# #     "DEFAULT_THROTTLE_CLASSES": [
# #         "apps.account.throttling.LoginRateThrottle",
# #         "rest_framework.throttling.AnonRateThrottle",
# #         "rest_framework.throttling.UserRateThrottle",
# #     ],
# #     "DEFAULT_THROTTLE_RATES": {
# #         "anon": "100/hour",
# #         "user": "1000/hour",
# #         # Authentication throttles
# #         "login": "10/min",  # 10 login attempts per minute per IP
# #         "registration": "5/min",  # 5 registrations per minute per IP
# #         "admin_login": "3/min",  # 3 admin login attempts per minute per IP
# #         "email_login": "5/min",  # 5 attempts per email per minute
# #         # Other throttles
# #         "password_reset": "3/min",  # Password reset requests
# #         "email_verification": "5/min",  # Email verification requests
# #     },
# # }


# # Static files
# STATIC_URL = "/static/"
# STATIC_ROOT = BASE_DIR / "staticfiles"
# STATICFILES_DIRS = [BASE_DIR / "static"] if (BASE_DIR / "static").exists() else []

# # Media files
# MEDIA_URL = "/media/"
# MEDIA_ROOT = BASE_DIR / "media"

# # Default primary key field type
# DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# # Site ID
# SITE_ID = 1

# # REST Framework
# REST_FRAMEWORK = {
#     "DEFAULT_AUTHENTICATION_CLASSES": [
#         "rest_framework_simplejwt.authentication.JWTAuthentication",
#     ],
#     "DEFAULT_PERMISSION_CLASSES": [
#         "rest_framework.permissions.IsAuthenticated",
#     ],
#     "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
#     "PAGE_SIZE": 20,
#     "DEFAULT_FILTER_BACKENDS": [
#         "django_filters.rest_framework.DjangoFilterBackend",
#         "rest_framework.filters.SearchFilter",
#         "rest_framework.filters.OrderingFilter",
#     ],
#     "DEFAULT_RENDERER_CLASSES": [
#         "rest_framework.renderers.JSONRenderer",
#         'rest_framework.renderers.BrowsableAPIRenderer',
#     ],
#     "DEFAULT_PARSER_CLASSES": [
#         "rest_framework.parsers.JSONParser",
#         "rest_framework.parsers.MultiPartParser",
#         "rest_framework.parsers.FormParser",
#     ],
# }

# # JWT Settings
# SIMPLE_JWT = {
#     "ACCESS_TOKEN_LIFETIME": timedelta(hours=1),
#     "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
#     "ROTATE_REFRESH_TOKENS": True,
#     "BLACKLIST_AFTER_ROTATION": True,
#     "UPDATE_LAST_LOGIN": True,
#     "ALGORITHM": "HS256",
#     "SIGNING_KEY": SECRET_KEY,
#     "AUTH_HEADER_TYPES": ("Bearer",),
#     "USER_ID_FIELD": "id",
#     "USER_ID_CLAIM": "user_id",
# }

# # CORS Settings
# CORS_ALLOWED_ORIGINS = [
#     "http://localhost:3000",
#     "http://127.0.0.1:3000",
#     # "https://yourdomain.com",
# ]
# CORS_ALLOW_CREDENTIALS = True

# # Email Configuration
# EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
# EMAIL_HOST = config("EMAIL_HOST", default="smtp.gmail.com")
# EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
# EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
# EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
# EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
# DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# # Production Security Settings
# # if not DEBUG:
# #     SECURE_SSL_REDIRECT = True
# #     SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
# #     SESSION_COOKIE_SECURE = True
# #     CSRF_COOKIE_SECURE = True
# #     SECURE_BROWSER_XSS_FILTER = True
# #     SECURE_CONTENT_TYPE_NOSNIFF = True

# # Custom throttling settings
# THROTTLE_SETTINGS = {
#     "LOGIN_ATTEMPTS_PER_IP": 10,  # Per minute
#     "ADMIN_LOGIN_ATTEMPTS_PER_IP": 3,  # Per minute
#     "REGISTRATION_ATTEMPTS_PER_IP": 5,  # Per minute
#     "FAILED_LOGIN_LOCKOUT_TIME": 300,  # 5 minutes in seconds
#     "MAX_LOGIN_HISTORY_ENTRIES": 100,  # Per user
# }

# # User Agent max length for database storage
# USER_AGENT_MAX_LENGTH = 500

# # Session settings
# SESSION_SETTINGS = {
#     "DEFAULT_EXPIRY_DAYS": 30,
#     "MAX_SESSIONS_PER_USER": 5,
#     "CLEANUP_OLD_SESSIONS": True,
# }

# # Security settings
# SECURITY_SETTINGS = {
#     "LOG_FAILED_LOGINS": True,
#     "LOG_SUCCESSFUL_LOGINS": True,
#     "TRACK_SESSION_ACTIVITY": True,
#     "REQUIRE_EMAIL_VERIFICATION": True,
# }

# # Cache settings for throttling (if using Redis/Memcached)
# # CACHES = {
# #     'default': {
# #         'BACKEND': 'django.core.cache.backends.redis.RedisCache',
# #         'LOCATION': 'redis://127.0.0.1:6379/1',
# #         'OPTIONS': {
# #             # 'CLIENT_CLASS': 'django_redis.client.DefaultClient',
# #         },
# #         'KEY_PREFIX': 'myapp_cache',
# #         'TIMEOUT': 300,  # 5 minutes default
# #     }
# # }

# # If you don't have Redis, you can use database cache (slower but works)
# # CACHES = {
# #     'default': {
# #         'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
# #         'LOCATION': 'cache_table',
# #     }
# # }

# # ...existing code...
# # JWT Settings
# SIMPLE_JWT = {
#     "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
#     "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
#     "ROTATE_REFRESH_TOKENS": True,
#     "BLACKLIST_AFTER_ROTATION": True,
# }

# # Internationalization
# LANGUAGE_CODE = "en-us"
# TIME_ZONE = "Asia/Kolkata"
# USE_I18N = True
# USE_TZ = True

# # Static files
# STATIC_URL = "static/"

# # Default primary key field type
# DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# # Sessions
# SESSION_COOKIE_AGE = 86400  # 24 hours
# SESSION_EXPIRE_AT_BROWSER_CLOSE = True
# SESSION_SAVE_EVERY_REQUEST = True

# # Security
# SECURE_BROWSER_XSS_FILTER = True
# SECURE_CONTENT_TYPE_NOSNIFF = True
# X_FRAME_OPTIONS = "DENY"

# # # zeuzcryptoserver/settings/base.py

# # from datetime import timedelta
# # from pathlib import Path

# # # Build paths inside the project like this: BASE_DIR / 'subdir'.

# # AUTH_USER_MODEL = 'account.User'

# # # AUTH_USER_MODEL = 'User'
# # # AUTH_USER_MODEL = 'apps.account.User'


# # # AUTH_USER_MODEL = 'apps.account.account.User'

# # # ...existing code...

# # BASE_DIR = Path(__file__).resolve().parent.parent

# # # SECURITY WARNING: keep the secret key used in production secret!
# # SECRET_KEY = "django-insecure-+5s+xno^y)ss$-8i8_#%7xv3-)im#gihn1g$c^l!wd!&6#ryj7"

# # INSTALLED_APPS =  [
# #     # """account folder including account details, login, registration, etc."""
# #     "apps.account",

# #     # """CLient folder including client related apps  etc."""


# #     # """Admin folder including Admin related apps  etc."""


# #     # """b2bAdmin folder including b2bAdmin related apps  etc."""


# #     'rest_framework',
# #     'rest_framework_simplejwt',
# #     'rest_framework_simplejwt.token_blacklist',
# #     'corsheaders',

# #     "django.contrib.admin",
# #     "django.contrib.auth",
# #     "django.contrib.contenttypes",
# #     "django.contrib.sessions",
# #     "django.contrib.messages",
# #     "django.contrib.staticfiles",
# # ]

# # MIDDLEWARE = [
# #     "django.middleware.security.SecurityMiddleware",
# #     "django.contrib.sessions.middleware.SessionMiddleware",
# #     "django.middleware.common.CommonMiddleware",
# #     "django.middleware.csrf.CsrfViewMiddleware",
# #     "django.contrib.auth.middleware.AuthenticationMiddleware",
# #     "django.contrib.messages.middleware.MessageMiddleware",
# #     "django.middleware.clickjacking.XFrameOptionsMiddleware",
# # ]

# # ROOT_URLCONF = "zeuzcryptoserver.urls"

# # TEMPLATES = [
# #     {
# #         "BACKEND": "django.template.backends.django.DjangoTemplates",
# #         "DIRS": [],
# #         "APP_DIRS": True,
# #         "OPTIONS": {
# #             "context_processors": [
# #                 "django.template.context_processors.debug",
# #                 "django.template.context_processors.request",
# #                 "django.contrib.auth.context_processors.auth",
# #                 "django.contrib.messages.context_processors.messages",
# #             ],
# #         },
# #     },
# # ]

# # WSGI_APPLICATION = "zeuzcryptoserver.wsgi.application"

# # # Password validation (common)
# # AUTH_PASSWORD_VALIDATORS = [
# #     {
# #         "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
# #     },
# #     {
# #         "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
# #     },
# #     {
# #         "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
# #     },
# #     {
# #         "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
# #     },
# # ]


# # # REST_FRAMEWORK = {
# # #     'DEFAULT_AUTHENTICATION_CLASSES': (
# # #         'rest_framework_simplejwt.authentication.JWTAuthentication',
# # #     )
# # # }

# # CACHES = {
# #     'default': {
# #         'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
# #     }
# # }

# # REST_FRAMEWORK = {
# #     'DEFAULT_AUTHENTICATION_CLASSES': (
# #         'rest_framework_simplejwt.authentication.JWTAuthentication',
# #     ),
# #     'DEFAULT_PERMISSION_CLASSES': (
# #         'rest_framework.permissions.IsAuthenticated',
# #     ),
# # }

# # SIMPLE_JWT = {
# #     'ACCESS_TOKEN_LIFETIME': timedelta(minutes=5),
# #     'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
# #     'ROTATE_REFRESH_TOKENS': True,
# #     'BLACKLIST_AFTER_ROTATION': True,
# # }


# # # Internationalization
# # LANGUAGE_CODE = "en-us"
# # TIME_ZONE = "Asia/Kolkata"
# # USE_I18N = True
# # USE_TZ = True

# # # Static files (CSS, JavaScript, Images)
# # STATIC_URL = "static/"

# # # Default primary key field type
# # DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# # # just keep this if everything works finr

# # AUTH_PASSWORD_VALIDATORS = [
# #     {
# #         'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
# #     },
# #     {
# #         'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
# #         'OPTIONS': {
# #             'min_length': 8,
# #         }
# #     },
# #     {
# #         'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
# #     },
# #     {
# #         'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
# #     },
# # ]

# # # Session settings (optional improvements)
# # SESSION_COOKIE_AGE = 86400  # 24 hours
# # SESSION_EXPIRE_AT_BROWSER_CLOSE = True
# # SESSION_SAVE_EVERY_REQUEST = True

# # # Security settings (recommended)
# # SECURE_BROWSER_XSS_FILTER = True
# # SECURE_CONTENT_TYPE_NOSNIFF = True
# # X_FRAME_OPTIONS = 'DENY'
