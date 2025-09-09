# zeuzcryptoserver/settings/base.py

from datetime import timedelta
from pathlib import Path
from decouple import config
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# -----------------------------------------------------------------------------
# Security & Debug
# -----------------------------------------------------------------------------
DEBUG = config("DEBUG", default=False, cast=bool)

# ⚠️ For production, use environment variable for SECRET_KEY
SECRET_KEY = config("SECRET_KEY", default="django-insecure-dev-key")

# -----------------------------------------------------------------------------
# Custom User Model
# -----------------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"

# -----------------------------------------------------------------------------
# Installed Apps
# -----------------------------------------------------------------------------
INSTALLED_APPS = [
    # Local apps
    "apps.account",   
    "apps.accounts",  

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
# Templates
# -----------------------------------------------------------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],  # keep this for custom templates
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# -----------------------------------------------------------------------------
# Password Validators
# -----------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
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
        "rest_framework_simplejwt.authentication.JWTAuthentication",
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
    # "https://yourdomain.com",
]
CORS_ALLOW_CREDENTIALS = True

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
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = config("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# -----------------------------------------------------------------------------
# Custom Settings
# -----------------------------------------------------------------------------
THROTTLE_SETTINGS = {
    "LOGIN_ATTEMPTS_PER_IP": 10,  # Per minute
    "ADMIN_LOGIN_ATTEMPTS_PER_IP": 3,
    "REGISTRATION_ATTEMPTS_PER_IP": 5,
    "FAILED_LOGIN_LOCKOUT_TIME": 300,  # 5 minutes
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
