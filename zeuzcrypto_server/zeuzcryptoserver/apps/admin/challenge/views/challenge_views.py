
# ==================== FILE: apps/challenges/views/challenge_views.py ====================

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import IntegrityError

# from apps.challenges.models import (
#     ChallengeProgram, ChallengeWeek, ChallengeTask,
#     UserChallengeParticipation
# )
from apps.admin.challenge.models.challenge_models import ChallengeProgram, ChallengeWeek, ChallengeTask , ChallengeReward
from apps.admin.challenge.models.challenge_models import UserChallengeParticipation
from apps.permission.permissions import IsAdmin

# from apps.challenges.serializers.challenge_serializers import (
#     ChallengeProgramSerializer, ChallengeWeekSerializer,
#     ChallengeTaskSerializer, UserChallengeParticipationSerializer,
#     UserChallengeParticipationListSerializer
# )
from apps.admin.challenge.serializers.challenge_serializers import (
    ChallengeProgramSerializer, ChallengeWeekSerializer,
    ChallengeTaskSerializer, UserChallengeParticipationSerializer,
    UserChallengeParticipationListSerializer,ChallengeRewardSerializer
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

#
# class ChallengeWeekViewSet(viewsets.ReadOnlyModelViewSet):
#     """Challenge week management"""
#     queryset = ChallengeWeek.objects.all()
#     serializer_class = ChallengeWeekSerializer
#     permission_classes = [IsAuthenticated]
#
#     def list(self, request, *args, **kwargs):
#         """List challenge weeks with optional filtering"""
#         queryset = self.get_queryset()
#
#         program_id = request.query_params.get('program_id')
#         if program_id:
#             queryset = queryset.filter(program_id=program_id)
#
#         is_active = request.query_params.get('is_active')
#         if is_active is not None:
#             queryset = queryset.filter(is_active=is_active.lower() == 'true')
#
#         is_ongoing = request.query_params.get('is_ongoing')
#         if is_ongoing and is_ongoing.lower() == 'true':
#             now = timezone.now()
#             queryset = queryset.filter(start_date__lte=now, end_date__gte=now)
#
#         serializer = self.get_serializer(queryset, many=True)
#         return Response(serializer.data)
#
#     @action(detail=True, methods=['post'])
#     def join(self, request, pk=None):
#         """Join a challenge week"""
#         week = self.get_object()
#         user = request.user
#         print(week,week.is_ongoing(),",,,,,,")
#
#
#         """
#         if monthly challange is required use this filter condition
#         """
#         # if not week.is_ongoing():
#         #     return Response(
#         #         {'error': 'Challenge is not currently active'},
#         #         status=status.HTTP_400_BAD_REQUEST
#         #     )
#
#         if UserChallengeParticipation.objects.filter(user=user, week=week).exists():
#             return Response(
#                 {'error': 'Already participating in this challenge'},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#
#         participation = UserChallengeParticipation.objects.create(
#             user=user,
#             week=week,
#             status='IN_PROGRESS'
#         )
#
#         initial_balance = request.data.get('initial_balance', 10000)
#         wallet = WalletService.create_wallet_for_participation(participation, initial_balance)
#
#         participation.join_challenge(initial_balance)
#
#         serializer = UserChallengeParticipationSerializer(participation)
#         return Response(serializer.data, status=status.HTTP_201_CREATED)
#
#     @action(detail=True, methods=['get'])
#     def user_progress(self, request, pk=None):
#         """Get user's progress in challenge"""
#         week = self.get_object()
#         user = request.user
#
#         try:
#             participation = UserChallengeParticipation.objects.get(user=user, week=week)
#             TradeService.update_participation_metrics(participation)
#
#             serializer = UserChallengeParticipationSerializer(participation)
#             return Response(serializer.data)
#         except UserChallengeParticipation.DoesNotExist:
#             return Response(
#                 {'error': 'Not participating in this challenge'},
#                 status=status.HTTP_404_NOT_FOUND
#             )
#
#     @action(detail=True, methods=['post'])
#     def calculate_score(self, request, pk=None):
#         """Calculate challenge score"""
#         week = self.get_object()
#         user = request.user
#
#         try:
#             participation = UserChallengeParticipation.objects.get(user=user, week=week)
#
#             if participation.status != 'IN_PROGRESS':
#                 return Response(
#                     {'error': 'Challenge not in progress'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )
#
#             score_data = ScoringService.calculate_scores(participation)
#             return Response(score_data)
#         except UserChallengeParticipation.DoesNotExist:
#             return Response(
#                 {'error': 'Not participating in this challenge'},
#                 status=status.HTTP_404_NOT_FOUND
#             )
#
#     @action(detail=True, methods=['post'])
#     def complete_challenge(self, request, pk=None):
#         """Complete challenge and claim rewards"""
#         week = self.get_object()
#         user = request.user
#
#         try:
#             participation = UserChallengeParticipation.objects.get(user=user, week=week)
#
#             if participation.status == 'COMPLETED':
#                 return Response(
#                     {'error': 'Challenge already completed'},
#                     status=status.HTTP_400_BAD_REQUEST
#                 )
#
#             result = RewardService.complete_and_reward(participation)
#             return Response(result)
#         except UserChallengeParticipation.DoesNotExist:
#             return Response(
#                 {'error': 'Not participating in this challenge'},
#                 status=status.HTTP_404_NOT_FOUND
#             )
#
#     @action(detail=True, methods=['post'])
#     def verify_tasks(self, request, pk=None):
#         """Verify all tasks for participation"""
#         week = self.get_object()
#         user = request.user
#
#         try:
#             participation = UserChallengeParticipation.objects.get(user=user, week=week)
#             all_completed, results = TaskVerificationEngine.verify_all_tasks(participation)
#
#             return Response({
#                 'all_tasks_completed': all_completed,
#                 'task_results': results
#             })
#         except UserChallengeParticipation.DoesNotExist:
#             return Response(
#                 {'error': 'Not participating in this challenge'},
#                 status=status.HTTP_404_NOT_FOUND
#             )
#

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

    # ✅ Updated join method with sequential completion rule
    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """Join a challenge week (must complete previous week first)"""
        week = self.get_object()
        user = request.user
        print(week, week.is_ongoing(), ",,,,,,")

        # If you want to enforce active week only, uncomment this block
        # if not week.is_ongoing():
        #     return Response(
        #         {'error': 'Challenge is not currently active'},
        #         status=status.HTTP_400_BAD_REQUEST
        #     )

        # Check if already participating
        if UserChallengeParticipation.objects.filter(user=user, week=week).exists():
            return Response(
                {'error': 'Already participating in this challenge'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Sequential join validation (must complete previous week)
        previous_week = ChallengeWeek.objects.filter(
            program=week.program,
            week_number=week.week_number - 1
        ).first()

        if previous_week:
            prev_participation = UserChallengeParticipation.objects.filter(
                user=user,
                week=previous_week
            ).first()

            if not prev_participation:
                return Response(
                    {'error': f"You must first complete Week {previous_week.week_number} "
                              f"({previous_week.title}) before joining Week {week.week_number}."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if prev_participation.status != 'COMPLETED':
                return Response(
                    {'error': f"You must complete Week {previous_week.week_number} "
                              f"({previous_week.title}) before joining Week {week.week_number}."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Proceed with joining
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
#
# class ChallengeTaskViewSet(viewsets.ReadOnlyModelViewSet):
#     """Challenge task management"""
#     queryset = ChallengeTask.objects.all()
#     serializer_class = ChallengeTaskSerializer
#     permission_classes = [IsAuthenticated]
#
#     def list(self, request, *args, **kwargs):
#         """List tasks with optional week filtering"""
#         queryset = self.get_queryset()
#
#         week_id = request.query_params.get('week_id')
#         if week_id:
#             queryset = queryset.filter(week_id=week_id)
#
#         serializer = self.get_serializer(queryset, many=True)
#         return Response(serializer.data)
#
#     @action(detail=True, methods=['post'])
#     def verify(self, request, pk=None):
#         """Verify single task completion"""
#         task = self.get_object()
#         participation_id = request.data.get('participation_id')
#
#         try:
#             participation = UserChallengeParticipation.objects.get(
#                 id=participation_id,
#                 user=request.user
#             )
#
#             completed, actual_value = TaskVerificationEngine.verify_task(participation, task)
#
#             return Response({
#                 'completed': completed,
#                 'actual_value': str(actual_value),
#                 'target_value': str(task.target_value)
#             })
#         except UserChallengeParticipation.DoesNotExist:
#             return Response(
#                 {'error': 'Participation not found'},
#                 status=status.HTTP_404_NOT_FOUND
#             )
#
#
# class ChallengeTaskViewSet(viewsets.ModelViewSet):
#     """Challenge task management (Admin CRUD + User verification)"""
#     queryset = ChallengeTask.objects.all()
#     serializer_class = ChallengeTaskSerializer
#     permission_classes = [IsAuthenticated]
#
#     def get_permissions(self):
#         """Admins can create/edit/delete, others only read and verify."""
#         if self.action in ['create', 'update', 'partial_update', 'destroy']:
#             return [IsAdmin()]
#         return [IsAuthenticated()]
#
#     def list(self, request, *args, **kwargs):
#         """List tasks with optional week filtering"""
#         queryset = self.get_queryset()
#
#         week_id = request.query_params.get('week_id')
#         if week_id:
#             queryset = queryset.filter(week_id=week_id)
#
#         serializer = self.get_serializer(queryset, many=True)
#         return Response(serializer.data)
#
#     # ✅ CREATE
#     def create(self, request, *args, **kwargs):
#         """Admin: Create a new challenge task"""
#         serializer = self.get_serializer(data=request.data)
#         serializer.is_valid(raise_exception=True)
#
#         # Basic validation
#         if not serializer.validated_data.get('week'):
#             return Response({'error': 'Week is required.'}, status=status.HTTP_400_BAD_REQUEST)
#
#         task = serializer.save()
#         return Response(self.get_serializer(task).data, status=status.HTTP_201_CREATED)
#
#     # ✅ UPDATE
#     def update(self, request, *args, **kwargs):
#         """Admin: Update a challenge task"""
#         task = self.get_object()
#         serializer = self.get_serializer(task, data=request.data, partial=True)
#         serializer.is_valid(raise_exception=True)
#         serializer.save(updated_at=timezone.now())
#         return Response(serializer.data)
#
#     # ✅ DELETE
#     def destroy(self, request, *args, **kwargs):
#         """Admin: Delete a challenge task"""
#         task = self.get_object()
#         task.delete()
#         return Response({'success': 'Task deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)
#
#     # ✅ VERIFY SINGLE TASK COMPLETION
#     @action(detail=True, methods=['post'])
#     def verify(self, request, pk=None):
#         """Verify and mark a single task as completed for a user"""
#         task = self.get_object()
#         user = request.user
#         participation_id = request.data.get('participation_id')
#
#         if not participation_id:
#             return Response({'error': 'Participation ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
#
#         try:
#             participation = UserChallengeParticipation.objects.get(id=participation_id, user=user)
#         except UserChallengeParticipation.DoesNotExist:
#             return Response({'error': 'Participation not found.'}, status=status.HTTP_404_NOT_FOUND)
#
#         # Check if task belongs to the same week as the participation
#         if participation.week_id != task.week_id:
#             return Response({'error': 'Task does not belong to this challenge week.'}, status=status.HTTP_400_BAD_REQUEST)
#
#         # Check if already completed
#         existing_completion = ChallengeTaskCompletion.objects.filter(participation=participation, task=task).first()
#         if existing_completion and existing_completion.is_completed:
#             return Response({'message': 'Task already completed.'}, status=status.HTTP_200_OK)
#
#         # Verify using engine
#         completed, actual_value = TaskVerificationEngine.verify_task(participation, task)
#
#         # Save completion result
#         try:
#             completion, created = ChallengeTaskCompletion.objects.get_or_create(
#                 participation=participation, task=task
#             )
#             if completed:
#                 completion.complete_task(actual_value=actual_value)
#             else:
#                 completion.actual_value = actual_value
#                 completion.save()
#         except IntegrityError:
#             return Response({'error': 'Task completion entry already exists.'}, status=status.HTTP_400_BAD_REQUEST)
#
#         return Response({
#             'completed': completed,
#             'actual_value': str(actual_value),
#             'target_value': str(task.target_value),
#             'task_type': task.task_type,
#             'status': 'COMPLETED' if completed else 'PENDING'
#         })
#
#     # ✅ VERIFY ALL TASKS IN A WEEK
#     @action(detail=False, methods=['post'])
#     def verify_all(self, request):
#         """Verify all tasks for a given participation"""
#         participation_id = request.data.get('participation_id')
#
#         if not participation_id:
#             return Response({'error': 'Participation ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
#
#         try:
#             participation = UserChallengeParticipation.objects.get(id=participation_id, user=request.user)
#         except UserChallengeParticipation.DoesNotExist:
#             return Response({'error': 'Participation not found.'}, status=status.HTTP_404_NOT_FOUND)
#
#         # Verify all tasks using engine
#         all_completed, results = TaskVerificationEngine.verify_all_tasks(participation)
#
#         # Save task completions
#         for task_id, data in results.items():
#             task = ChallengeTask.objects.get(id=task_id)
#             completion, _ = ChallengeTaskCompletion.objects.get_or_create(participation=participation, task=task)
#             if data.get('completed'):
#                 completion.complete_task(actual_value=data.get('actual_value'))
#             else:
#                 completion.actual_value = data.get('actual_value')
#                 completion.save()
#
#         return Response({
#             'all_tasks_completed': all_completed,
#             'results': results
#         })
#

class ChallengeTaskViewSet(viewsets.ModelViewSet):
    """Challenge task management (Admin CRUD + User verification)"""
    queryset = ChallengeTask.objects.all()
    serializer_class = ChallengeTaskSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Admins can create/edit/delete, others only read and verify."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdmin()]
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        """List tasks with optional week filtering"""
        queryset = self.get_queryset()

        week_id = request.query_params.get('week_id')
        if week_id:
            queryset = queryset.filter(week_id=week_id)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    # ✅ CREATE
    def create(self, request, *args, **kwargs):
        """Admin: Create a new challenge task (only one per week allowed)"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        week = serializer.validated_data.get('week')
        if not week:
            return Response({'error': 'Week is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # 🔒 Validate: Only one task per week
        if ChallengeTask.objects.filter(week=week).exists():
            return Response(
                {'error': f'A challenge task already exists for week {week.id}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Create task
        task = serializer.save()
        return Response(self.get_serializer(task).data, status=status.HTTP_201_CREATED)

    # # ✅ UPDATE
    # def update(self, request, *args, **kwargs):
    #     """Admin: Update a challenge task"""
    #     task = self.get_object()
    #     serializer = self.get_serializer(task, data=request.data, partial=True)
    #     serializer.is_valid(raise_exception=True)
    #     serializer.save(updated_at=timezone.now())
    #     return Response(serializer.data)


    # ✅ UPDATE (PUT)
    def update(self, request, *args, **kwargs):
        """Admin: Full update of a challenge task"""
        task = self.get_object()
        serializer = self.get_serializer(task, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_at=timezone.now())
        return Response(serializer.data, status=status.HTTP_200_OK)

    # ✅ PARTIAL UPDATE (PATCH)

    def partial_update(self, request, *args, **kwargs):
        """Admin: Partial update of a challenge task"""
        task = self.get_object()
        serializer = self.get_serializer(task, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_at=timezone.now())
        return Response(serializer.data, status=status.HTTP_200_OK)
    # ✅ DELETE
    def destroy(self, request, *args, **kwargs):
        """Admin: Delete a challenge task"""
        task = self.get_object()
        task.delete()
        return Response({'success': 'Task deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)

    # ✅ VERIFY SINGLE TASK COMPLETION
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify and mark a single task as completed for a user"""
        task = self.get_object()
        user = request.user
        participation_id = request.data.get('participation_id')

        if not participation_id:
            return Response({'error': 'Participation ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            participation = UserChallengeParticipation.objects.get(id=participation_id, user=user)
        except UserChallengeParticipation.DoesNotExist:
            return Response({'error': 'Participation not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check if task belongs to the same week as the participation
        if participation.week_id != task.week_id:
            return Response({'error': 'Task does not belong to this challenge week.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if already completed
        existing_completion = ChallengeTaskCompletion.objects.filter(
            participation=participation, task=task
        ).first()
        if existing_completion and existing_completion.is_completed:
            return Response({'message': 'Task already completed.'}, status=status.HTTP_200_OK)

        # Verify using engine
        completed, actual_value = TaskVerificationEngine.verify_task(participation, task)

        # Save completion result
        try:
            completion, created = ChallengeTaskCompletion.objects.get_or_create(
                participation=participation, task=task
            )
            if completed:
                completion.complete_task(actual_value=actual_value)
            else:
                completion.actual_value = actual_value
                completion.save()
        except IntegrityError:
            return Response({'error': 'Task completion entry already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'completed': completed,
            'actual_value': str(actual_value),
            'target_value': str(task.target_value),
            'task_type': task.task_type,
            'status': 'COMPLETED' if completed else 'PENDING'
        })

    # ✅ VERIFY ALL TASKS IN A WEEK
    @action(detail=False, methods=['post'])
    def verify_all(self, request):
        """Verify all tasks for a given participation"""
        participation_id = request.data.get('participation_id')

        if not participation_id:
            return Response({'error': 'Participation ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            participation = UserChallengeParticipation.objects.get(id=participation_id, user=request.user)
        except UserChallengeParticipation.DoesNotExist:
            return Response({'error': 'Participation not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Verify all tasks using engine
        all_completed, results = TaskVerificationEngine.verify_all_tasks(participation)

        # Save task completions
        for task_id, data in results.items():
            task = ChallengeTask.objects.get(id=task_id)
            completion, _ = ChallengeTaskCompletion.objects.get_or_create(participation=participation, task=task)
            if data.get('completed'):
                completion.complete_task(actual_value=data.get('actual_value'))
            else:
                completion.actual_value = data.get('actual_value')
                completion.save()

        return Response({
            'all_tasks_completed': all_completed,
            'results': results
        })
class ChallengeRewardViewSet(viewsets.ModelViewSet):
    """Manage challenge rewards (CRUD + filter by week)"""
    queryset = ChallengeReward.objects.all()
    serializer_class = ChallengeRewardSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Optionally filter rewards by week_id"""
        queryset = super().get_queryset()
        week_id = self.request.query_params.get('week_id')

        if week_id:
            queryset = queryset.filter(week_id=week_id)

        return queryset.order_by('-id')

    def create(self, request, *args, **kwargs):
        """Create a new reward for a week"""
        week_id = request.data.get('week')
        if not week_id:
            return Response({'error': 'Week is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            week = ChallengeWeek.objects.get(id=week_id)
        except ChallengeWeek.DoesNotExist:
            return Response({'error': 'Invalid week ID.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(week=week)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update reward details"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        """Delete a reward"""
        instance = self.get_object()
        instance.delete()
        return Response({'message': 'Reward deleted successfully.'}, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='week/(?P<week_id>[^/.]+)')
    def list_by_week(self, request, week_id=None):
        """List rewards for a specific week"""
        rewards = ChallengeReward.objects.filter(week_id=week_id)
        serializer = self.get_serializer(rewards, many=True)
        return Response(serializer.data)


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

