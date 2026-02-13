import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "zeuzcryptoserver.settings.prod")
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    # "websocket": URLRouter(websocket_urlpatterns), # Define routing in routing.py and import here
})
