from django.urls import path, include

urlpatterns = [
    path("account/", include("apps.accounts.urls")),  
]
