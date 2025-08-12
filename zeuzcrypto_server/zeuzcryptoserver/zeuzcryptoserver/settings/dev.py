# zeuzcryptoserver/settings/dev.py

from .base import *

DEBUG = True

ALLOWED_HOSTS = []

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "railway",
        "USER": "postgres",
        "PASSWORD": "hdmQOmcNgMkVUrCmdavwhnssCwqdjJzA",
        "HOST": "maglev.proxy.rlwy.net",
        "PORT": "44279",
    }
}
