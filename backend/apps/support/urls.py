from django.urls import path

from .views import (
    AdminSessionDetailView,
    AdminSessionListView,
    SessionFeedbackView,
    StartSessionView,
)

app_name = "support"

urlpatterns = [
    path("start-session/", StartSessionView.as_view(), name="start-session"),
    path("sessions/<int:session_id>/feedback/", SessionFeedbackView.as_view(), name="session-feedback"),
    path("admin/sessions/", AdminSessionListView.as_view(), name="admin-sessions"),
    path("admin/sessions/<int:pk>/", AdminSessionDetailView.as_view(), name="admin-session-detail"),
]
