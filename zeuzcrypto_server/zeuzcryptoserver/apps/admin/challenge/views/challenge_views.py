
# ==================== FILE: apps/challenges/views/challenge_views.py ====================

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

# from apps.challenges.models import (
#     ChallengeProgram, ChallengeWeek, ChallengeTask,
#     UserChallengeParticipation
# )
from apps.admin.challenge.models.challenge_models import ChallengeProgram, ChallengeWeek, ChallengeTask
from apps.admin.challenge.models.challenge_models import UserChallengeParticipation 

# from apps.challenges.serializers.challenge_serializers import (
#     ChallengeProgramSerializer, ChallengeWeekSerializer,
#     ChallengeTaskSerializer, UserChallengeParticipationSerializer,
#     UserChallengeParticipationListSerializer
# )
from apps.admin.challenge.serializers.challenge_serializers import (
    ChallengeProgramSerializer, ChallengeWeekSerializer,
    ChallengeTaskSerializer, UserChallengeParticipationSerializer,
    UserChallengeParticipationListSerializer
)
# from apps.challenges.services.wallet_service import WalletService
from apps.admin.challenge.services.wallet_service import WalletService

# from apps.challenges.services.scoring_service import ScoringService
from apps.admin.challenge.services.scoring_service import ScoringService

# from apps.challenges.services.reward_service import RewardService
from apps.admin.challenge.services.reward_service import RewardService  

# from apps.challenges.services.trade_service import TradeService
from apps.admin.challenge.services.trade_service import TradeService

# from apps.challenges.services.task_verification import TaskVerificationEngine
from apps.admin.challenge.services.task_verification import TaskVerificationEngine


class ChallengeProgramViewSet(viewsets.ReadOnlyModelViewSet):
    """List and retrieve challenge programs"""
    queryset = ChallengeProgram.objects.filter(is_active=True)
    serializer_class = ChallengeProgramSerializer
    permission_classes = [IsAuthenticated]


class ChallengeWeekViewSet(viewsets.ReadOnlyModelViewSet):
    """Challenge week management"""
    queryset = ChallengeWeek.objects.all()
    serializer_class = ChallengeWeekSerializer
    permission_classes = [IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        """List challenge weeks with optional filtering"""
        queryset = self.get_queryset()
        
        program_id = request.query_params.get('program_id')
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        is_ongoing = request.query_params.get('is_ongoing')
        if is_ongoing and is_ongoing.lower() == 'true':
            now = timezone.now()
            queryset = queryset.filter(start_date__lte=now, end_date__gte=now)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Join a challenge week"""
        week = self.get_object()
        user = request.user
        
        if not week.is_ongoing():
            return Response(
                {'error': 'Challenge is not currently active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if UserChallengeParticipation.objects.filter(user=user, week=week).exists():
            return Response(
                {'error': 'Already participating in this challenge'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        participation = UserChallengeParticipation.objects.create(
            user=user,
            week=week,
            status='IN_PROGRESS'
        )
        
        initial_balance = request.data.get('initial_balance', 10000)
        wallet = WalletService.create_wallet_for_participation(participation, initial_balance)
        
        participation.join_challenge(initial_balance)
        
        serializer = UserChallengeParticipationSerializer(participation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def user_progress(self, request, pk=None):
        """Get user's progress in challenge"""
        week = self.get_object()
        user = request.user
        
        try:
            participation = UserChallengeParticipation.objects.get(user=user, week=week)
            TradeService.update_participation_metrics(participation)
            
            serializer = UserChallengeParticipationSerializer(participation)
            return Response(serializer.data)
        except UserChallengeParticipation.DoesNotExist:
            return Response(
                {'error': 'Not participating in this challenge'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def calculate_score(self, request, pk=None):
        """Calculate challenge score"""
        week = self.get_object()
        user = request.user
        
        try:
            participation = UserChallengeParticipation.objects.get(user=user, week=week)
            
            if participation.status != 'IN_PROGRESS':
                return Response(
                    {'error': 'Challenge not in progress'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            score_data = ScoringService.calculate_scores(participation)
            return Response(score_data)
        except UserChallengeParticipation.DoesNotExist:
            return Response(
                {'error': 'Not participating in this challenge'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def complete_challenge(self, request, pk=None):
        """Complete challenge and claim rewards"""
        week = self.get_object()
        user = request.user
        
        try:
            participation = UserChallengeParticipation.objects.get(user=user, week=week)
            
            if participation.status == 'COMPLETED':
                return Response(
                    {'error': 'Challenge already completed'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            result = RewardService.complete_and_reward(participation)
            return Response(result)
        except UserChallengeParticipation.DoesNotExist:
            return Response(
                {'error': 'Not participating in this challenge'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def verify_tasks(self, request, pk=None):
        """Verify all tasks for participation"""
        week = self.get_object()
        user = request.user
        
        try:
            participation = UserChallengeParticipation.objects.get(user=user, week=week)
            all_completed, results = TaskVerificationEngine.verify_all_tasks(participation)
            
            return Response({
                'all_tasks_completed': all_completed,
                'task_results': results
            })
        except UserChallengeParticipation.DoesNotExist:
            return Response(
                {'error': 'Not participating in this challenge'},
                status=status.HTTP_404_NOT_FOUND
            )


class ChallengeTaskViewSet(viewsets.ReadOnlyModelViewSet):
    """Challenge task management"""
    queryset = ChallengeTask.objects.all()
    serializer_class = ChallengeTaskSerializer
    permission_classes = [IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        """List tasks with optional week filtering"""
        queryset = self.get_queryset()
        
        week_id = request.query_params.get('week_id')
        if week_id:
            queryset = queryset.filter(week_id=week_id)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify single task completion"""
        task = self.get_object()
        participation_id = request.data.get('participation_id')
        
        try:
            participation = UserChallengeParticipation.objects.get(
                id=participation_id,
                user=request.user
            )
            
            completed, actual_value = TaskVerificationEngine.verify_task(participation, task)
            
            return Response({
                'completed': completed,
                'actual_value': str(actual_value),
                'target_value': str(task.target_value)
            })
        except UserChallengeParticipation.DoesNotExist:
            return Response(
                {'error': 'Participation not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class UserChallengeParticipationViewSet(viewsets.ReadOnlyModelViewSet):
    """User participation management"""
    serializer_class = UserChallengeParticipationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return UserChallengeParticipation.objects.filter(user=self.request.user)
    
    def list(self, request, *args, **kwargs):
        """List user participations with lighter serializer"""
        queryset = self.get_queryset()
        serializer = UserChallengeParticipationListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def my_participations(self, request):
        """Get current user's participations with filtering"""
        queryset = self.get_queryset()
        
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        week_id = request.query_params.get('week_id')
        if week_id:
            queryset = queryset.filter(week_id=week_id)
        
        program_id = request.query_params.get('program_id')
        if program_id:
            queryset = queryset.filter(week__program_id=program_id)
        
        serializer = UserChallengeParticipationListSerializer(queryset, many=True)
        return Response(serializer.data)

