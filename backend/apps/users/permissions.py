from rest_framework import permissions

from apps.common.permissions import IsAdminUser


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if IsAdminUser().has_permission(request, view):
            return True
        return obj.user == request.user
