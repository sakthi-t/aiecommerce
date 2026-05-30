from django.urls import path
from apps.users import views
from apps.users.views_debug import ClerkDebugView

urlpatterns = [
    path("me/", views.MeView.as_view(), name="users-me"),
    path("debug/", ClerkDebugView.as_view(), name="users-debug"),
    path("<int:id>/", views.UserProfileDetailView.as_view(), name="users-detail"),
    path(
        "admin/list/",
        views.AdminUserListView.as_view(),
        name="users-admin-list",
    ),
    path(
        "admin/<int:id>/role/",
        views.AdminUpdateUserRoleView.as_view(),
        name="users-admin-role",
    ),
    path(
        "admin/<int:id>/deactivate/",
        views.AdminDeactivateUserView.as_view(),
        name="users-admin-deactivate",
    ),
    path(
        "admin/<int:id>/reactivate/",
        views.AdminReactivateUserView.as_view(),
        name="users-admin-reactivate",
    ),
]
