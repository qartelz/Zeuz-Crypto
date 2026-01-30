from django.urls import path
from . import views

app_name = 'subscriptions'

urlpatterns = [
    # Plan URLs
    path('plans/', views.PlanViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='plan-list'),
    
    path('plans/<uuid:pk>/', views.PlanViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='plan-detail'),
    
    path('plans/active/', views.PlanViewSet.as_view({
        'get': 'active'
    }), name='plan-active'),
    
    path('plans/<uuid:pk>/applicable_coupons/', views.PlanViewSet.as_view({
        'get': 'applicable_coupons'
    }), name='plan-applicable-coupons'),
    
    # Coupon URLs
    path('coupons/', views.CouponViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='coupon-list'),
    
    path('coupons/<uuid:pk>/', views.CouponViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='coupon-detail'),
    
    path('coupons/<uuid:pk>/validate_coupon/', views.CouponViewSet.as_view({
        'post': 'validate_coupon'
    }), name='coupon-validate'),
    
    # PlanCoupon URLs
    path('plan-coupons/', views.PlanCouponViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='plan-coupon-list'),
    
    path('plan-coupons/<uuid:pk>/', views.PlanCouponViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='plan-coupon-detail'),
    
    # Subscription URLs
    path('subscriptions/', views.SubscriptionViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='subscription-list'),
    
    path('subscriptions/<uuid:pk>/', views.SubscriptionViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='subscription-detail'),
    
    path('subscriptions/active/', views.SubscriptionViewSet.as_view({
        'get': 'active'
    }), name='subscription-active'),
    
    path('subscriptions/<uuid:pk>/cancel/', views.SubscriptionViewSet.as_view({
        'post': 'cancel'
    }), name='subscription-cancel'),
    
    path('subscriptions/expiring_soon/', views.SubscriptionViewSet.as_view({
        'get': 'expiring_soon'
    }), name='subscription-expiring-soon'),

    path('subscriptions/idle_status/', views.SubscriptionViewSet.as_view({
        'get': 'idle_status'
    }), name='subscription-idle-status'),
]

"""
API Endpoints Documentation:

PLAN ENDPOINTS:
* GET/POST /api/plans/ - List all plans or create new plan
* GET/PUT/PATCH/DELETE /api/plans/{id}/ - Retrieve, update or delete specific plan
* GET /api/plans/active/ - Get only active plans (query param: ?user_type=B2B|B2C)
* GET /api/plans/{id}/applicable_coupons/ - Get valid coupons for a specific plan

COUPON ENDPOINTS (Admin only):
* GET/POST /api/coupons/ - List all coupons or create new coupon
* GET/PUT/PATCH/DELETE /api/coupons/{id}/ - Retrieve, update or delete specific coupon
* POST /api/coupons/{id}/validate_coupon/ - Validate coupon against a plan (body: {"plan_id": "uuid"})

PLAN-COUPON ENDPOINTS (Admin only):
* GET/POST /api/plan-coupons/ - List all plan-coupon relationships or create new one
* GET/PUT/PATCH/DELETE /api/plan-coupons/{id}/ - Manage specific plan-coupon relationship

SUBSCRIPTION ENDPOINTS (Authenticated users):
* GET/POST /api/subscriptions/ - List user's subscriptions or create new subscription
* GET/PUT/PATCH/DELETE /api/subscriptions/{id}/ - Manage specific subscription
* GET /api/subscriptions/active/ - Get user's currently active subscriptions
* POST /api/subscriptions/{id}/cancel/ - Cancel a subscription
* GET /api/subscriptions/expiring_soon/ - Get subscriptions expiring in next 7 days

SUBSCRIPTION HISTORY ENDPOINTS (Authenticated users):
* GET /api/subscription-history/ - List user's subscription history
* GET /api/subscription-history/{id}/ - Get specific history record
* GET /api/subscription-history/by_subscription/?subscription_id=uuid - Get history for specific subscription

SUBSCRIPTION ORDER ENDPOINTS:
* GET/POST /api/subscription-orders/ - List user's orders or create new order
* GET/PUT/PATCH/DELETE /api/subscription-orders/{id}/ - Manage specific order
* POST /api/subscription-orders/admin_assign_plan/ - Admin assign plan to user (Admin only)
* POST /api/subscription-orders/purchase_plan/ - User purchase plan (B2C only)
* POST /api/subscription-orders/{id}/complete_order/ - Complete pending order (Admin only)
* POST /api/subscription-orders/{id}/cancel_order/ - Cancel order
* GET /api/subscription-orders/pending_orders/ - Get pending orders
* GET /api/subscription-orders/completed_orders/ - Get completed orders  
* GET /api/subscription-orders/{id}/order_subscription/ - Get subscription from order
* GET /api/subscription-orders/order_stats/ - Get order statistics (Admin only)

QUERY PARAMETERS:
Plans:
- ?user_type=B2B|B2C - Filter by user type
- ?is_active=true|false - Filter by active status
- ?search=keyword - Search in name/description
- ?ordering=field_name - Order by field (prefix with - for desc)

Coupons:
- ?discount_type=PERCENTAGE|FIXED - Filter by discount type
- ?is_active=true|false - Filter by active status
- ?search=code - Search by coupon code

Subscriptions:
- ?status=ACTIVE|EXPIRED|CANCELLED - Filter by status
- ?plan=uuid - Filter by plan ID
- ?ordering=start_date,-created_at - Order results

CREATE SUBSCRIPTION PAYLOAD:
{
    "plan_id": "uuid",
    "coupon_code": "OPTIONAL_CODE", // optional
    "start_date": "2023-12-01T00:00:00Z" // optional, defaults to now
}
"""



# from django.urls import path
# from . import views

# app_name = "subscriptions"

# urlpatterns = [
#     # Plan URLs
#     path(
#         "plans/",
#         views.PlanViewSet.as_view({"get": "list", "post": "create"}),
#         name="plan-list",
#     ),
#     path(
#         "plans/<uuid:pk>/",
#         views.PlanViewSet.as_view(
#             {
#                 "get": "retrieve",
#                 "put": "update",
#                 "patch": "partial_update",
#                 "delete": "destroy",
#             }
#         ),
#         name="plan-detail",
#     ),
#     path(
#         "plans/active/",
#         views.PlanViewSet.as_view({"get": "active"}),
#         name="plan-active",
#     ),
#     path(
#         "plans/<uuid:pk>/applicable_coupons/",
#         views.PlanViewSet.as_view({"get": "applicable_coupons"}),
#         name="plan-applicable-coupons",
#     ),
#     # Coupon URLs
#     path(
#         "coupons/",
#         views.CouponViewSet.as_view({"get": "list", "post": "create"}),
#         name="coupon-list",
#     ),
#     path(
#         "coupons/<uuid:pk>/",
#         views.CouponViewSet.as_view(
#             {
#                 "get": "retrieve",
#                 "put": "update",
#                 "patch": "partial_update",
#                 "delete": "destroy",
#             }
#         ),
#         name="coupon-detail",
#     ),
#     path(
#         "coupons/<uuid:pk>/validate_coupon/",
#         views.CouponViewSet.as_view({"post": "validate_coupon"}),
#         name="coupon-validate",
#     ),
#     # PlanCoupon URLs
#     path(
#         "plan-coupons/",
#         views.PlanCouponViewSet.as_view({"get": "list", "post": "create"}),
#         name="plan-coupon-list",
#     ),
#     path(
#         "plan-coupons/<uuid:pk>/",
#         views.PlanCouponViewSet.as_view(
#             {
#                 "get": "retrieve",
#                 "put": "update",
#                 "patch": "partial_update",
#                 "delete": "destroy",
#             }
#         ),
#         name="plan-coupon-detail",
#     ),
#     # Subscription URLs
#     path(
#         "subscriptions/",
#         views.SubscriptionViewSet.as_view({"get": "list", "post": "create"}),
#         name="subscription-list",
#     ),
#     path(
#         "subscriptions/<uuid:pk>/",
#         views.SubscriptionViewSet.as_view(
#             {
#                 "get": "retrieve",
#                 "put": "update",
#                 "patch": "partial_update",
#                 "delete": "destroy",
#             }
#         ),
#         name="subscription-detail",
#     ),
#     path(
#         "subscriptions/active/",
#         views.SubscriptionViewSet.as_view({"get": "active"}),
#         name="subscription-active",
#     ),
#     path(
#         "subscriptions/<uuid:pk>/cancel/",
#         views.SubscriptionViewSet.as_view({"post": "cancel"}),
#         name="subscription-cancel",
#     ),
#     path(
#         "subscriptions/expiring_soon/",
#         views.SubscriptionViewSet.as_view({"get": "expiring_soon"}),
#         name="subscription-expiring-soon",
#     ),
#     # Subscription History URLs
#     path(
#         "subscriptions/<uuid:pk>/history/",
#         views.SubscriptionViewSet.as_view({"get": "history"}),
#         name="subscription-history",
#     ),
#     # Global Subscription History URLs
#     path(
#         "history/",
#         views.SubscriptionHistoryViewSet.as_view({"get": "list"}),
#         name="history-list",
#     ),
#     path(
#         "history/<uuid:pk>/",
#         views.SubscriptionHistoryViewSet.as_view({"get": "retrieve"}),
#         name="history-detail",
#     ),
# ]

# """
# API Endpoints Documentation:

# PLAN ENDPOINTS:
# * GET/POST /api/plans/ - List all plans or create new plan
# * GET/PUT/PATCH/DELETE /api/plans/{id}/ - Retrieve, update or delete specific plan
# * GET /api/plans/active/ - Get only active plans (query param: ?user_type=B2B|B2C)
# * GET /api/plans/{id}/applicable_coupons/ - Get valid coupons for a specific plan

# COUPON ENDPOINTS (Admin only):
# * GET/POST /api/coupons/ - List all coupons or create new coupon
# * GET/PUT/PATCH/DELETE /api/coupons/{id}/ - Retrieve, update or delete specific coupon
# * POST /api/coupons/{id}/validate_coupon/ - Validate coupon against a plan (body: {"plan_id": "uuid"})

# PLAN-COUPON ENDPOINTS (Admin only):
# * GET/POST /api/plan-coupons/ - List all plan-coupon relationships or create new one
# * GET/PUT/PATCH/DELETE /api/plan-coupons/{id}/ - Manage specific plan-coupon relationship

# SUBSCRIPTION ENDPOINTS (Authenticated users):
# * GET/POST /api/subscriptions/ - List user's subscriptions or create new subscription
# * GET/PUT/PATCH/DELETE /api/subscriptions/{id}/ - Manage specific subscription
# * GET /api/subscriptions/active/ - Get user's currently active subscriptions
# * POST /api/subscriptions/{id}/cancel/ - Cancel a subscription
# * GET /api/subscriptions/expiring_soon/ - Get subscriptions expiring in next 7 days
# * GET /api/subscriptions/{id}/history/ - Get history for a specific subscription

# SUBSCRIPTION HISTORY ENDPOINTS (Authenticated users):
# * GET /api/history/ - List all history entries (filtered by user unless staff)
# * GET /api/history/{id}/ - Get details of a specific history entry

# QUERY PARAMETERS:
# Plans:
# - ?user_type=B2B|B2C - Filter by user type
# - ?is_active=true|false - Filter by active status
# - ?search=keyword - Search in name/description
# - ?ordering=field_name - Order by field (prefix with - for desc)

# Coupons:
# - ?discount_type=PERCENTAGE|FIXED - Filter by discount type
# - ?is_active=true|false - Filter by active status
# - ?search=code - Search by coupon code

# Subscriptions:
# - ?status=ACTIVE|EXPIRED|CANCELLED - Filter by status
# - ?plan=uuid - Filter by plan ID
# - ?ordering=start_date,-created_at - Order results

# CREATE SUBSCRIPTION PAYLOAD:
# {
#     "plan_id": "uuid",
#     "coupon_code": "OPTIONAL_CODE", // optional
#     "start_date": "2023-12-01T00:00:00Z" // optional, defaults to now
# }
# """
