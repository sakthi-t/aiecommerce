from rest_framework import generics, permissions, status, views
from rest_framework.response import Response

from django.utils import timezone

from apps.common.permissions import IsAdminUser
from .models import SupportSession
from .serializers import (
    SessionFeedbackSerializer,
    StartSessionResponseSerializer,
    SupportSessionSerializer,
)
from .services import create_livekit_room, generate_livekit_token, dispatch_agent_to_room


class StartSessionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        room_name = create_livekit_room()
        identity = f"customer-{user.id}"
        token = generate_livekit_token(
            room_name=room_name,
            participant_name=identity,
            clerk_user_id=user.username,
        )
        session = SupportSession.objects.create(
            user=user,
            livekit_room_name=room_name,
            started_at=None,
        )
        try:
            dispatch_agent_to_room(room_name)
        except Exception:
            pass
        serializer = StartSessionResponseSerializer(
            {
                "session_id": session.id,
                "livekit_room_name": room_name,
                "livekit_token": token,
            }
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SessionFeedbackView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, session_id):
        try:
            session = SupportSession.objects.get(id=session_id, user=request.user)
        except SupportSession.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = SessionFeedbackSerializer(session, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            if not session.ended_at:
                session.ended_at = timezone.now()
                session.save(update_fields=["ended_at"])
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminSessionListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = SupportSessionSerializer
    queryset = SupportSession.objects.select_related(
        "user__userprofile"
    ).prefetch_related("transcripts").order_by("-created_at")

    def list(self, request, *args, **kwargs):
        from django.db.models import Avg, Count
        response = super().list(request, *args, **kwargs)
        stats = SupportSession.objects.filter(rating__isnull=False).aggregate(
            avg_rating=Avg("rating"),
            total_rated=Count("id"),
        )
        response.data["stats"] = {
            "avg_rating": round(stats["avg_rating"], 1) if stats["avg_rating"] else None,
            "total_rated": stats["total_rated"] or 0,
            "total_sessions": SupportSession.objects.count(),
        }
        return response


class AdminSessionDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = SupportSessionSerializer
    queryset = SupportSession.objects.select_related(
        "user__userprofile"
    ).prefetch_related("transcripts")
