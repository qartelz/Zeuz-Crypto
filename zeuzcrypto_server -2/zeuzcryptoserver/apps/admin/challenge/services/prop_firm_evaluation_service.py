
# ==================== FILE: apps/challenges/services/prop_firm_evaluation_service.py ====================

from decimal import Decimal
from django.db.models import Count
from apps.admin.challenge.models.evaluation_models import ChallengeEvaluationReport
from apps.admin.challenge.models.challenge_models import ChallengeTaskCompletion

class PropFirmEvaluationService:
    """
    Dedicated service for calculating the Prop-Firm Risk Score (0-100).
    Logic strictly adheres to the definitions provided.
    """
    
    @classmethod
    def evaluate(cls, participation):
        """
        Evaluate a participation and generate a detailed report.
        """
        week = participation.week
        
        # ---------------------------------------------------------
        # 1. TASK DISCIPLINE SCORE (Max 30)
        # ---------------------------------------------------------
        mandatory_tasks = week.tasks.filter(is_mandatory=True).count()
        completed_mandatory = ChallengeTaskCompletion.objects.filter(
            participation=participation,
            task__week=week,
            task__is_mandatory=True,
            is_completed=True
        ).count()
        
        if mandatory_tasks == 0:
            task_score = Decimal('30.00')
        else:
            ratio = Decimal(completed_mandatory) / Decimal(mandatory_tasks)
            task_score = ratio * Decimal('30.00')
            
        # ---------------------------------------------------------
        # 2. TRADING DISCIPLINE SCORE (Max 30)
        # ---------------------------------------------------------
        trading_discipline_total = Decimal('0.00')
        
        # A. Trade Count Compliance (10 pts)
        min_trades = week.min_trades_required
        actual_trades = participation.total_trades
        
        if min_trades == 0:
            count_score = Decimal('10.00')
        elif actual_trades >= min_trades:
            count_score = Decimal('10.00')
        else:
            # Proportional score
            count_score = (Decimal(actual_trades) / Decimal(min_trades)) * Decimal('10.00')
            
        # B. Asset Class Compliance (10 pts)
        asset_score = Decimal('10.00')
        asset_violation = False
        
        if week.trading_type == 'SPOT':
            if participation.futures_trades > 0 or participation.options_trades > 0:
                asset_score = Decimal('0.00')
                asset_violation = True
        elif week.trading_type == 'SPOT_FUTURES':
            if participation.options_trades > 0:
                asset_score = Decimal('0.00')
                asset_violation = True
                
        # C. Overtrading Penalty (10 pts)
        overtrading_score = Decimal('10.00')
        if min_trades > 0:
            ideal_max = min_trades * 1.5
            if actual_trades > ideal_max:
                # Scale down score based on excess
                excess = actual_trades - ideal_max
                penalty = min(Decimal('10.00'), Decimal(excess) * Decimal('2.00')) # -2 pts per extra trade above buffer
                overtrading_score = Decimal('10.00') - penalty
        
        trading_discipline_total = count_score + asset_score + overtrading_score
        
        # ---------------------------------------------------------
        # 3. PROFIT OUTCOME SCORE (Max 25)
        # ---------------------------------------------------------
        profit_score = Decimal('0.00')
        roi = participation.portfolio_return_pct
        target = week.target_goal
        
        if roi >= target:
            profit_score = Decimal('25.00')
        elif roi > 0:
            # Scale 15-24 based on progress
            progress = roi / target if target > 0 else 0
            profit_score = Decimal('15.00') + (progress * Decimal('9.00'))
        elif roi <= -10:
            # Loss > 10%
            profit_score = Decimal('0.00') # Or 0-5
        else:
            # Loss <= -10% (Small loss)
            profit_score = Decimal('5.00') # 5-10 range
            
        # ⚠️ Never reward profit that violates discipline
        if asset_violation:
            profit_score = Decimal('0.00')
            
        # ---------------------------------------------------------
        # 4. CONSISTENCY BONUS (Max 15)
        # ---------------------------------------------------------
        consistency_score = Decimal('0.00')
        
        if participation.status == 'COMPLETED':
            consistency_score += Decimal('5.00')
        
        # Consistent Activity (Controlled behavior)
        # Reuse overtrading score logic somewhat or check wallet allocation
        # If no overtrading penalty was severe, give rest of points
        if overtrading_score > 5:
             consistency_score += Decimal('5.00')
             
        # Did they blow up account? (Drawdown check > 20% implies reckless)
        # Simplified: If Profit Score was not 0 (meaning no huge loss), give bonus
        if profit_score > 0:
             consistency_score += Decimal('5.00')
             
        # Cap at 15
        consistency_score = min(Decimal('15.00'), consistency_score)
        
        # ---------------------------------------------------------
        # FINAL CALCULATION
        # ---------------------------------------------------------
        final_score = task_score + trading_discipline_total + profit_score + consistency_score
        
        # Tier Assignment
        if final_score >= 85:
            tier = 'PLATINUM'
        elif final_score >= 70:
            tier = 'GOLD'
        elif final_score >= 40:
            tier = 'SILVER'
        else:
            tier = 'BRONZE'
            
        # Behavior Tagging
        tag = 'BALANCED'
        issue = "Solid performance."
        focus = []
        
        if asset_violation:
            tag = 'RECKLESS'
            issue = "You traded forbidden assets for this challenge type."
            focus = ["Stick to the allowed asset class.", "Read challenge rules carefully."]
        elif task_score < 15:
            tag = 'INCONSISTENT'
            issue = "You ignored mandatory tasks."
            focus = ["Complete all assigned tasks first.", "Discipline starts with following instructions."]
        elif overtrading_score < 5:
            tag = 'EMOTIONAL'
            issue = "You significantly overtraded relative to the requirement."
            focus = ["Quality over quantity.", "Wait for high-probability setups."]
        elif final_score > 80:
            tag = 'DISCIPLINED'
            issue = "Excellent adherence to process."
            focus = ["Maintain this consistency.", "Increase position sizing slightly."]
            
        # Save Report
        report, _ = ChallengeEvaluationReport.objects.update_or_create(
            participation=participation,
            defaults={
                'task_discipline_score': task_score,
                'completed_mandatory_tasks': completed_mandatory,
                'total_mandatory_tasks': mandatory_tasks,
                
                'trading_discipline_score': trading_discipline_total,
                'trade_count_subscore': count_score,
                'asset_class_subscore': asset_score,
                'overtrading_penalty': overtrading_score,
                
                'profit_outcome_score': profit_score,
                'consistency_bonus_score': consistency_score,
                
                'final_score': final_score,
                'tier_name': tier,
                'behavior_tag': tag,
                'key_issue': issue,
                'next_challenge_focus': focus
            }
        )
        
        return {
            'final_score': float(final_score),
            'breakdown': {
                'Task Discipline': float(task_score),
                'Trading Discipline': float(trading_discipline_total),
                'Profit Outcome': float(profit_score),
                'Consistency Bonus': float(consistency_score)
            },
            'tier': tier,
            'tag': tag,
            'diagnosis': issue
        }
