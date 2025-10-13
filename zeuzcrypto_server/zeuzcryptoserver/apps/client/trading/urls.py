# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import GetOpenTradeBySymbol

router = DefaultRouter()
router.register(r'trades', views.TradeViewSet, basename='trades')
router.register(r'portfolio', views.PortfolioViewSet, basename='portfolio')

urlpatterns = [
    path('api/trading/', include(router.urls)),
    
    # Trading endpoints
    path('place-order/', views.PlaceOrderView.as_view(), name='place-order'),
    path('close-trade/<uuid:trade_id>/', views.CloseTradeView.as_view(), name='close-trade'),
    path('partial-close/<uuid:trade_id>/', views.PartialCloseView.as_view(), name='partial-close'),
    
    # Portfolio endpoints
    path('portfolio/summary/', views.PortfolioSummaryView.as_view(), name='portfolio-summary'),
    path('portfolio/positions/', views.ActivePositionsView.as_view(), name='active-positions'),
    path('portfolio/pnl/', views.PnLReportView.as_view(), name='pnl-report'),
    
    # Trade history
    path('history/', views.TradeHistoryView.as_view(), name='trade-history'),
    path('trades/<uuid:trade_id>/history/', views.TradeDetailHistoryView.as_view(), name='trade-detail-history'),
    
    # Market data
    path('update-prices/', views.UpdatePricesView.as_view(), name='update-prices'),
    path('trade/open/', GetOpenTradeBySymbol.as_view(), name='get-open-trade'),
    
    # Risk management
    path('risk-check/', views.RiskCheckView.as_view(), name='risk-check'),
    # URL patterns (add to your urls.py)




  


]