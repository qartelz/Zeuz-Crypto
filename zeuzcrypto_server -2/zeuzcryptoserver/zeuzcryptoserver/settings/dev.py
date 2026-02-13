# zeuzcryptoserver/settings/dev.py

from .base import *

DEBUG = True

ALLOWED_HOSTS = ["*"]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "railway",
        "USER": "postgres",
        "PASSWORD": "iDLijIdGtsgKjIeJxmUHDUDskdftytZX",
        "HOST": "shinkansen.proxy.rlwy.net",
        "PORT": "13821",
    }
}
