# zeuzcryptoserver/settings/prod.py

from .base import *

import os

DEBUG = False

# Set this environment variable to a comma-separated list of allowed hosts
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "yourdomain.com").split(",")

# Example PostgreSQL production database, replace with your real credentials
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("POSTGRES_DB", "prod_db_name"),
        "USER": os.getenv("POSTGRES_USER", "prod_db_user"),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "prod_db_pass"),
        "HOST": os.getenv("POSTGRES_HOST", "localhost"),
        "PORT": os.getenv("POSTGRES_PORT", "5432"),
    }
}

# Other production security-related settings, e.g., 
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
