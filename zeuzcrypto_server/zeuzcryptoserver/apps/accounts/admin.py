# accounts/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, UserProfile, UserWallet, UserBatch, UserApproval


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        'email', 'mobile', 'full_name', 'role', 'is_active', 
        'is_verified', 'is_approved', 'date_joined'
    ]
    list_filter = [
        'role', 'is_active', 'is_verified', 'is_approved', 'date_joined'
    ]
    search_fields = ['email', 'mobile', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = (
        (None, {
            'fields': ('email', 'password')
        }),
        ('Personal info', {
            'fields': ('first_name', 'last_name', 'mobile')
        }),
        ('Role & Hierarchy', {
            'fields': ('role', 'created_by', 'batch')
        }),
        ('Status', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'is_approved')
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined'),
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ['wide'],
            'fields': ['email', 'mobile', 'password1', 'password2', 'role'],
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('created_by', 'batch')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'city', 'has_avatar']
    list_filter = ['city']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'city']
    raw_id_fields = ['user']
    
    def has_avatar(self, obj):
        return bool(obj.avatar)
    has_avatar.boolean = True


@admin.register(UserWallet)
class UserWalletAdmin(admin.ModelAdmin):
    list_display = ['user', 'formatted_balance']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    raw_id_fields = ['user']
    ordering = ['-balance']
    
    def formatted_balance(self, obj):
        return format_html(
            '<span style="color: {};">${}</span>',
            'green' if obj.balance > 0 else 'red',
            f'{obj.balance:,.2f}'
        )
    formatted_balance.short_description = 'Balance'


@admin.register(UserBatch)
class UserBatchAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_by', 'user_count', 'max_users', 'utilization', 'is_active']
    list_filter = ['is_active', 'created_by']
    search_fields = ['name', 'description']
    raw_id_fields = ['created_by']
    ordering = ['-created_at']
    
    def utilization(self, obj):
        percentage = (obj.user_count / obj.max_users) * 100 if obj.max_users > 0 else 0
        color = 'red' if percentage > 90 else 'orange' if percentage > 70 else 'green'
        return format_html(
            '<span style="color: {};">{:.1f}%</span>',
            color, percentage
        )


@admin.register(UserApproval)
class UserApprovalAdmin(admin.ModelAdmin):
    list_display = ['user', 'status', 'user_role', 'approved_by', 'approved_at']
    list_filter = ['status', 'user__role']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    raw_id_fields = ['user', 'approved_by']
    ordering = ['-approved_at']
    
    def user_role(self, obj):
        return obj.user.get_role_display()
    
    actions = ['approve_selected']
    
    def approve_selected(self, request, queryset):
        for approval in queryset.filter(status='pending'):
            approval.approve(request.user)
        self.message_user(request, f'Approved {queryset.count()} requests.')
    approve_selected.short_description = 'Approve selected requests'


# Customize admin site
admin.site.site_header = 'User Management System'
admin.site.site_title = 'User Management'
admin.site.index_title = 'Administration Panel'