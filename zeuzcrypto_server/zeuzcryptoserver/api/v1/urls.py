from django.urls import path, include

urlpatterns = [
    path("account/", include("apps.accounts.urls")),  
    path("admin/subscriptions/", include("apps.admin.subscriptions.urls")),
]
