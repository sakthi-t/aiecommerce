from django.urls import path
from . import views

urlpatterns = [
    path("", views.OrderListView.as_view(), name="orders-list"),
    path("<int:pk>/", views.OrderDetailView.as_view(), name="orders-detail"),
    path("admin/list/", views.AdminOrderListView.as_view(), name="admin-orders-list"),
    path("admin/<int:pk>/status/", views.AdminOrderStatusUpdateView.as_view(), name="admin-orders-status"),
]
