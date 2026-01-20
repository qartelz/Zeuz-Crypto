# zeuzcryptoserver/settings/dev.py

from .base import *

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1", "backened.zeuzcrypto.com", "www.backened.zeuzcrypto.com", "13.51.47.77",]

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
