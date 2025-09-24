from django.apps import AppConfig


class TradingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.client.trading"

    def ready(self):
        import apps.client.trading.signals


# class TradingConfig(AppConfig):
#     default_auto_field = 'django.db.models.BigAutoField'
#     name = 'trading'
#     verbose_name = 'Trading System'
    
#     def ready(self):
#         import trading.signals