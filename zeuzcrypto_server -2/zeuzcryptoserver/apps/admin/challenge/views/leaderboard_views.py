
# ==================== FILE: apps/challenges/views/leaderboard_views.py ====================

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

# from apps.challenges.services.leaderboard_service import LeaderboardService
from apps.admin.challenge.services.leaderboard_service import LeaderboardService


class LeaderboardViewSet(viewsets.ViewSet):
    """Leaderboard endpoints"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def week_leaderboard(self, request):
        """Get week leaderboard"""
        week_id = request.query_params.get('week_id')
        limit = int(request.query_params.get('limit', 10))
        sort_by = request.query_params.get('sort_by', 'total_score')
        
        if not week_id:
            return Response(
                {'error': 'week_id required'},
                status=400
            )
        
        leaderboard = LeaderboardService.get_week_leaderboard(week_id, limit, sort_by)
        return Response(leaderboard)
    
    @action(detail=False, methods=['get'])
    def program_leaderboard(self, request):
        """Get program cumulative leaderboard"""
        program_id = request.query_params.get('program_id')
        limit = int(request.query_params.get('limit', 10))
        
        if not program_id:
            return Response(
                {'error': 'program_id required'},
                status=400
            )
        
        leaderboard = LeaderboardService.get_program_leaderboard(program_id, limit)
        return Response(leaderboard)
    
    @action(detail=False, methods=['get'])
    def behavioral_leaderboard(self, request):
        """Get leaderboard by behavioral tag"""
        week_id = request.query_params.get('week_id')
        behavioral_tag = request.query_params.get('tag', 'DISCIPLINED')
        limit = int(request.query_params.get('limit', 10))
        
        if not week_id:
            return Response(
                {'error': 'week_id required'},
                status=400
            )
        
        leaderboard = LeaderboardService.get_behavioral_leaderboard(week_id, behavioral_tag, limit)
        return Response(leaderboard)