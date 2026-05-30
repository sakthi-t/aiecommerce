from django.db.models import Count
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsAdminUser
from apps.users.models import UserProfile
from apps.users.permissions import IsOwnerOrAdmin
from apps.users.serializers import AdminUserListSerializer, UserProfileSerializer


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile = request.user.userprofile
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)


class UserProfileDetailView(generics.RetrieveUpdateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsOwnerOrAdmin]
    lookup_field = "id"


class AdminUserListView(generics.ListAPIView):
    serializer_class = AdminUserListSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return UserProfile.objects.annotate(
            total_orders=Count("user__orders")
        ).order_by("-created_at")


class AdminUpdateUserRoleView(generics.UpdateAPIView):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAdminUser]
    lookup_field = "id"


class AdminDeactivateUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, id):
        try:
            profile = UserProfile.objects.get(id=id)
        except UserProfile.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        profile.is_active = False
        profile.save(update_fields=["is_active"])
        return Response({"detail": "User deactivated"})


class AdminReactivateUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, id):
        try:
            profile = UserProfile.objects.get(id=id)
        except UserProfile.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        profile.is_active = True
        profile.save(update_fields=["is_active"])
        return Response({"detail": "User reactivated"})
