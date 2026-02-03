
# ==================== FILE: apps/challenges/views/admin_views.py ====================

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser

# from apps.challenges.models import (
#     ChallengeProgram, ChallengeWeek, ChallengeStatistics
# )
from apps.admin.challenge.models.challenge_models import ChallengeProgram, ChallengeWeek, ChallengeStatistics, UserChallengeParticipation

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
    
    def create(self, request, *args, **kwargs):
        """Create a new challenge week with debug logging"""
        print("=" * 80)
        print("📥 INCOMING DATA FROM REACT:")
        print("=" * 80)
        print(f"Request Data: {request.data}")
        print(f"Content Type: {request.content_type}")
        print(f"User: {request.user}")
        print(f"User is authenticated: {request.user.is_authenticated}")
        print(f"User is admin: {request.user.is_staff if request.user.is_authenticated else False}")
        print("=" * 80)
        
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            print("✅ VALIDATED DATA:")
            print(f"{serializer.validated_data}")
            print("=" * 80)
            
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            
            print("✅ CREATED SUCCESSFULLY:")
            print(f"{serializer.data}")
            print("=" * 80)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        
        except Exception as e:
            print("❌ ERROR OCCURRED:")
            print(f"Error Type: {type(e).__name__}")
            print(f"Error Message: {str(e)}")
            if hasattr(e, 'detail'):
                print(f"Error Detail: {e.detail}")
            print("=" * 80)
            raise
    
    def update(self, request, *args, **kwargs):
        """Update a challenge week with debug logging"""
        print("=" * 80)
        print("📝 UPDATE DATA FROM REACT:")
        print("=" * 80)
        print(f"Request Data: {request.data}")
        print(f"Partial: {kwargs.get('partial', False)}")
        print("=" * 80)
        
        return super().update(request, *args, **kwargs)
    
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


# Add imports at the top if not present, but I'll add them inside the method or file if possible, 
# or I'll split this into two edits: one for imports, one for the class.
# Let's try to add the class first, assuming some imports might be needed.
# Actually, I should check existing imports.
# Existing imports: 
# from apps.admin.challenge.models.challenge_models import ...
# I need User and Subscription.
# User is likely in apps.accounts.models
# Subscription is in apps.admin.subscriptions.models

from apps.accounts.models import User
from apps.admin.subscriptions.models import Subscription, Plan
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from datetime import timedelta
from django.utils import timezone

class AdminDashboardViewSet(viewsets.ViewSet):
    """
    Dashboard Aggregated Statistics
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        # 1. User Metrics
        total_users = User.objects.count()
        new_users_last_7_days = User.objects.filter(
            date_joined__gte=timezone.now() - timedelta(days=7)
        ).count()

        # 2. Challenge Metrics
        active_challenges_count = ChallengeWeek.objects.filter(is_active=True).count()
        completed_challenges_count = UserChallengeParticipation.objects.filter(status='COMPLETED').count()
        
        # 3. Subscription/Financial Metrics
        from apps.admin.subscriptions.models import SubscriptionOrder
        active_subs = Subscription.objects.filter(status='ACTIVE').count()
        
        # Revenue & Orders
        # Use Subscription model for revenue as Orders might be missing for legacy data
        total_revenue = Subscription.objects.aggregate(Sum('final_price'))['final_price__sum'] or 0
        
        thirty_days_ago = timezone.now() - timedelta(days=30)
        new_subs_30d = Subscription.objects.filter(start_date__gte=thirty_days_ago).count()

        # 4. Charts Data
        
        # User Growth (Last 6 months)
        six_months_ago = timezone.now() - timedelta(days=180)
        user_growth_qs = User.objects.filter(date_joined__gte=six_months_ago)\
            .annotate(month=TruncMonth('date_joined'))\
            .values('month')\
            .annotate(count=Count('id'))\
            .order_by('month')
            
        user_growth_data = [
            {
                "month": entry['month'].strftime('%b'),
                "users": entry['count']
            }
            for entry in user_growth_qs
        ]

        # Subscription Plan Distribution
        plan_distribution_qs = Subscription.objects.values('plan__name').annotate(count=Count('id'))
        plan_distribution_data = [
            {"name": item['plan__name'], "value": item['count']} for item in plan_distribution_qs
        ]
        
        # Monthly Revenue (Last 6 months)
        revenue_growth_qs = Subscription.objects.filter(
            created_at__gte=six_months_ago
        ).annotate(month=TruncMonth('created_at'))\
         .values('month')\
         .annotate(revenue=Sum('final_price'))\
         .order_by('month')

        revenue_chart_data = [
            {
                "month": entry['month'].strftime('%b'),
                "revenue": float(entry['revenue'])
            }
            for entry in revenue_growth_qs
        ]
        
        # 5. Recent Activity (Latest 5 users)
        recent_users_qs = User.objects.order_by('-date_joined')[:5]
        recent_users_data = [
            {
                "id": u.id,
                "name": f"{u.first_name} {u.last_name}",
                "email": u.email,
                "joined_at": u.date_joined,
                "status": "Active" if u.is_active else "Inactive"
            }
            for u in recent_users_qs
        ]

        return Response({
            "overview": {
                "total_users": total_users,
                "new_users_7d": new_users_last_7_days,
                "active_challenges": active_challenges_count,
                "completed_participations": completed_challenges_count,
                "active_subscriptions": active_subs,
                "total_revenue": float(total_revenue),
                "new_subs_30d": new_subs_30d
            },
            "charts": {
                "user_growth": user_growth_data,
                "plan_distribution": plan_distribution_data,
                "revenue_trend": revenue_chart_data
            },
            "recent_activity": recent_users_data
        })
