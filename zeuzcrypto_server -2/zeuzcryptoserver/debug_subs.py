import os
import django
import sys
from django.conf import settings

# Add the project root to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "zeuzcryptoserver.settings_production.dev")
django.setup()

from apps.accounts.models import User
from apps.admin.subscriptions.models import Subscription


try:
    print(f"User Table Name: {User._meta.db_table}")
    print(f"DATABASES: {settings.DATABASES}")

    print("Searching for user 'Amal'...")
    user = User.objects.filter(first_name__icontains="Amal").first()
    
    if not user:
        print("User not found via first_name. Trying to list all users to verify DB connection...")
        print(f"Total Users in DB: {User.objects.count()}")
    else:
        print(f"Found User: {user.email} (ID: {user.id})")
        
        # Check all subscriptions for this user
        subscriptions = Subscription.objects.filter(user=user)
        print(f"Total Subscriptions found: {subscriptions.count()}")
        
        for sub in subscriptions:
            print("-" * 30)
            print(f"ID: {sub.id}")
            print(f"Plan: {sub.plan.name}")
            print(f"Status: {sub.status}")
            print(f"Start Date: {sub.start_date}")
            print(f"End Date: {sub.end_date}")
            
        active_sub = Subscription.objects.filter(user=user, status='ACTIVE').first()
        print("-" * 30)
        print(f"Active Subscription Query Result: {active_sub}")

except Exception as e:
    print(f"Error: {e}")
