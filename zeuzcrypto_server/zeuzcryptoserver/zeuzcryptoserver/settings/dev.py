# zeuzcryptoserver/settings/dev.py

from .base import *

DEBUG = True
# ALLOWED_HOSTS = ["zeuzcrypto.com", "www.zeuzcrypto.com", "13.51.47.77"]
ALLOWED_HOSTS = []
# ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=lambda v: [s.strip() for s in v.split(',')])

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
# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": "railway",
#         "USER": "postgres",
#         "PASSWORD": "iDLijIdGtsgKjIeJxmUHDUDskdftytZX",
#         "HOST": "shinkansen.proxy.rlwy.net",
#         "PORT": "13821",
#     }
# }

# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": "zeuzcrupto",   # 👈 your new local DB
#         "USER": "postgres",     # default superuser for local PostgreSQL
#         "PASSWORD": "sidharth",         # leave blank if you don’t use a password locally
#         "HOST": "localhost",    # local DB
#         "PORT": "5432",         # default PostgreSQL port
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
