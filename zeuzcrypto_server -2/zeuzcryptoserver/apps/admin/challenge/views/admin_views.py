
# ==================== FILE: apps/challenges/views/admin_views.py ====================

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser

# from apps.challenges.models import (
#     ChallengeProgram, ChallengeWeek, ChallengeStatistics
# )
from apps.admin.challenge.models.challenge_models import ChallengeProgram, ChallengeWeek, ChallengeStatistics

# from apps.challenges.serializers.admin_serializers import (
#     ChallengeProgramAdminSerializer, ChallengeWeekAdminSerializer,
#     ChallengeStatisticsSerializer
# )
from apps.admin.challenge.serializers.admin_serializers import (
    ChallengeProgramAdminSerializer, ChallengeWeekAdminSerializer,
    ChallengeStatisticsSerializer
)
# from apps.challenges.services.admin_service import AdminService
from apps.admin.challenge.services.admin_service import AdminService

class ChallengeAdminViewSet(viewsets.ModelViewSet):
    """Admin challenge management (staff only)"""
    queryset = ChallengeProgram.objects.all()
    serializer_class = ChallengeProgramAdminSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]


    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({
            "message": "Challenge created successfully",
            "data": serializer.data
        }, status=status.HTTP_201_CREATED)

    # def create(self, request, *args, **kwargs):
    #     difficulty = request.data.get("difficulty")
    #     is_active = request.data.get("is_active", True)

    #     # Only check if new challenge is intended to be active
    #     if is_active in [True, "true", "True", 1, "1"]:
    #         existing_active = ChallengeProgram.objects.filter(
    #             difficulty=difficulty, is_active=True
    #         ).exists()
    #         if existing_active:
    #             return Response(
    #                 {
    #                     "error": f"An active challenge with difficulty '{difficulty}' already exists. "
    #                              f"Deactivate it before creating a new one."
    #                 },
    #                 status=status.HTTP_400_BAD_REQUEST
    #             )

    #     # Continue with normal serializer validation & save
    #     serializer = self.get_serializer(data=request.data)
    #     if serializer.is_valid():
    #         serializer.save()
    #         return Response(
    #             {
    #                 "message": "Challenge created successfully",
    #                 "data": serializer.data
    #             },
    #             status=status.HTTP_201_CREATED
    #         )
    #     return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def program_list(self, request):
        """Get all programs with statistics"""
        
        programs = AdminService.get_all_programs_with_stats()
        return Response(programs)
    
    @action(detail=True, methods=['get'])
    def program_details(self, request, pk=None):
        """Get detailed program information"""
       
        program = self.get_object()
        details = AdminService.get_program_details(program)
        return Response(details)


class ChallengeWeekAdminViewSet(viewsets.ModelViewSet):
    """Admin week management (staff only)"""
    queryset = ChallengeWeek.objects.all()

    serializer_class = ChallengeWeekAdminSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """Get all participants for a week"""
        week = self.get_object()
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        
        participants = AdminService.get_week_participants(week, page, page_size)
        return Response(participants)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get week statistics"""
        week = self.get_object()
        stats = AdminService.get_week_statistics(week)
        
        if stats:
            return Response(stats)
        return Response(
            {'error': 'Statistics not calculated yet'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    @action(detail=True, methods=['post'])
    def calculate_statistics(self, request, pk=None):
        """Calculate and update statistics"""
        week = self.get_object()
        stats = AdminService.calculate_week_statistics(week)
        return Response(stats)
    
    @action(detail=True, methods=['get'])
    def export_csv(self, request, pk=None):
        """Export participants to CSV"""
        week = self.get_object()
        return AdminService.export_participants_csv(week)

