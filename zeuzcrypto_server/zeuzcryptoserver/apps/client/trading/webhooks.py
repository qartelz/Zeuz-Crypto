from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
import json


@method_decorator(csrf_exempt, name='dispatch')
class MarketDataWebhookView(View):
    """Receive real-time price updates from market data provider"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            
            # Validate webhook signature (implement your own validation)
            if not self.validate_signature(request):
                return JsonResponse({'error': 'Invalid signature'}, status=401)
            
            # Process price updates
            if 'prices' in data:
                for symbol, price in data['prices'].items():
                    # Update all open trades for this symbol
                    open_trades = Trade.objects.filter(
                        asset_symbol=symbol,
                        status__in=['OPEN', 'PARTIALLY_CLOSED']
                    )
                    
                    for trade in open_trades:
                        trade.calculate_unrealized_pnl(Decimal(str(price)))
            
            return JsonResponse({'status': 'success'})
            
        except Exception as e:
            logger.error(f"Market data webhook error: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
    
    def validate_signature(self, request):
        """Validate webhook signature"""
        # Implement signature validation based on your provider
        return True


@method_decorator(csrf_exempt, name='dispatch')
class OrderExecutionWebhookView(View):
    """Receive order execution confirmations from broker"""
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            
            if not self.validate_signature(request):
                return JsonResponse({'error': 'Invalid signature'}, status=401)
            
            # Process order execution
            order_id = data.get('order_id')
            status = data.get('status')
            executed_price = data.get('executed_price')
            executed_quantity = data.get('executed_quantity')
            
            # Find the corresponding trade history record
            try:
                history = TradeHistory.objects.get(id=order_id)
                
                if status == 'FILLED':
                    # Order fully executed
                    history.price = Decimal(str(executed_price))
                    history.quantity = Decimal(str(executed_quantity))
                    history.amount = history.price * history.quantity
                    history.save()
                    
                    # Update the trade status if needed
                    trade = history.trade
                    if trade.status == 'PENDING':
                        trade.status = 'OPEN'
                        trade.save()
                
                elif status == 'PARTIALLY_FILLED':
                    # Partial execution - create additional history record
                    remaining_qty = history.quantity - Decimal(str(executed_quantity))
                    
                    # Update original record with executed portion
                    history.quantity = Decimal(str(executed_quantity))
                    history.price = Decimal(str(executed_price))
                    history.amount = history.price * history.quantity
                    history.save()
                    
                    # Create new record for remaining quantity
                    TradeHistory.objects.create(
                        trade=history.trade,
                        user=history.user,
                        action=history.action,
                        order_type=history.order_type,
                        quantity=remaining_qty,
                        price=history.price,  # Will be updated when executed
                        amount=0  # Will be calculated when executed
                    )
                
                elif status == 'CANCELLED':
                    # Order cancelled
                    history.action = 'CANCEL'
                    history.save()
                    
            except TradeHistory.DoesNotExist:
                logger.error(f"Order execution webhook: Trade history {order_id} not found")
            
            return JsonResponse({'status': 'success'})
            
        except Exception as e:
            logger.error(f"Order execution webhook error: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
    
    def validate_signature(self, request):
        """Validate webhook signature"""
        # Implement signature validation based on your broker
        return True


# management/commands/setup_trading.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from trading.models import Portfolio


class Command(BaseCommand):
    help = 'Setup trading system - create portfolios for existing users'
    
    def handle(self, *args, **options):
        users_without_portfolio = User.objects.filter(portfolio__isnull=True)
        created_count = 0
        
        for user in users_without_portfolio:
            Portfolio.objects.create(user=user)
            created_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} portfolios')
        )
