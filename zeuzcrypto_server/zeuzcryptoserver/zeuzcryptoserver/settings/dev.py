# zeuzcryptoserver/settings/dev.py

from .base import *

DEBUG = True

ALLOWED_HOSTS = []

# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": "railway",
#         "USER": "postgres",
#         "PASSWORD": "hdmQOmcNgMkVUrCmdavwhnssCwqdjJzA",
#         "HOST": "maglev.proxy.rlwy.net",
#         "PORT": "44279",
#     }
# }
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


# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': 'zeuz_test',
#         'USER': 'zeuz_user',
#         'PASSWORD': 'sidharth',
#         'HOST': 'localhost',   
#         'PORT': '5432',
#     }
# }
