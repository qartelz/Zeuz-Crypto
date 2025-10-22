
# ==================== FILE: apps/challenges/services/task_verification.py ====================

from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
# from apps.challenges.models import ChallengeTaskCompletion
from apps.admin.challenge.models.challenge_models import ChallengeTaskCompletion


class TaskVerificationEngine:
    """Engine for verifying task completions"""
    
    @staticmethod
    def verify_trade_count_task(participation, task):
        """Verify if user has made required number of trades"""
        actual_count = participation.trades.count()
        target_count = int(task.target_value)
        
        task_completion, created = ChallengeTaskCompletion.objects.get_or_create(
            participation=participation,
            task=task
        )
        
        if actual_count >= target_count:
            task_completion.complete_task(actual_value=Decimal(str(actual_count)))
            return True, actual_count
        
        return False, actual_count
    
    @staticmethod
    def verify_portfolio_balance_task(participation, task):
        """Verify if portfolio balance meets minimum threshold"""
        current_return = participation.calculate_return_percentage()
        target_threshold = float(task.target_value)
        
        task_completion, created = ChallengeTaskCompletion.objects.get_or_create(
            participation=participation,
            task=task
        )
        
        if current_return >= target_threshold:
            task_completion.complete_task(actual_value=Decimal(str(current_return)))
            return True, current_return
        
        return False, current_return
    
    @staticmethod
    def verify_profit_target_task(participation, task):
        """Verify if user achieved profit target"""
        target_return = float(task.target_value)
        actual_return = float(participation.portfolio_return_pct)
        
        task_completion, created = ChallengeTaskCompletion.objects.get_or_create(
            participation=participation,
            task=task
        )
        
        if actual_return >= target_return:
            task_completion.complete_task(actual_value=Decimal(str(actual_return)))
            return True, actual_return
        
        return False, actual_return
    
    @staticmethod
    def verify_holding_period_task(participation, task):
        """Verify if user held a position for required duration"""
        holding_days = int(task.target_value)
        
        # Check closed trades that were held for required duration
        trades = participation.trades.filter(status='CLOSED', closed_at__isnull=False)
        
        task_completion, created = ChallengeTaskCompletion.objects.get_or_create(
            participation=participation,
            task=task
        )
        
        for trade in trades:
            holding_duration = (trade.closed_at - trade.opened_at).days
            if holding_duration >= holding_days:
                task_completion.complete_task(actual_value=Decimal(str(holding_duration)))
                return True, holding_duration
        
        return False, 0
    
    @staticmethod
    def verify_task(participation, task):
        """Verify a single task"""
        if task.task_type == 'TRADE_COUNT':
            return TaskVerificationEngine.verify_trade_count_task(participation, task)
        elif task.task_type == 'PORTFOLIO_BALANCE':
            return TaskVerificationEngine.verify_portfolio_balance_task(participation, task)
        elif task.task_type == 'PROFIT_TARGET':
            return TaskVerificationEngine.verify_profit_target_task(participation, task)
        elif task.task_type == 'HOLDING_PERIOD':
            return TaskVerificationEngine.verify_holding_period_task(participation, task)
        else:
            return False, 0
    
    @staticmethod
    def verify_all_tasks(participation):
        """Verify all tasks for a participation"""
        week = participation.week
        tasks = week.tasks.all()
        
        results = {}
        all_mandatory_completed = True
        
        for task in tasks:
            completed, value = TaskVerificationEngine.verify_task(participation, task)
            
            results[str(task.id)] = {
                'title': task.title,
                'completed': completed,
                'actual_value': value,
                'target_value': float(task.target_value) if task.target_value else 0,
                'is_mandatory': task.is_mandatory
            }
            
            if task.is_mandatory and not completed:
                all_mandatory_completed = False
        
        return all_mandatory_completed, results

