import os
from celery import Celery
from django.conf import settings
from celery.schedules import crontab, timedelta

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "zeuzcryptoserver.settings.base")

app = Celery("zeuzcryptoserver")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# Configure Celery Beat schedule
app.conf.beat_schedule = {
    'update-portfolio-metrics': {
        'task': 'apps.client.trading.tasks.update_portfolio_metrics',
        'schedule': timedelta(seconds=30),
    },
    'update-unrealized-pnl': {
        'task': 'apps.client.trading.tasks.update_unrealized_pnl',
        'schedule': timedelta(seconds=30),
    },
    'check-options-expiry': {
        'task': 'apps.client.trading.tasks.check_options_expiry',
        'schedule': crontab(minute=0, hour=0),  # Every day at midnight
    },
    'check-futures-expiry': {
        'task': 'apps.client.trading.tasks.check_futures_expiry',
        'schedule': crontab(minute=0, hour=0),  # Every day at midnight
    },
    'daily-portfolio-snapshot': {
        'task': 'apps.client.trading.tasks.daily_portfolio_snapshot',
        'schedule': crontab(minute=0, hour=0),  # Every day at midnight
    },
}
