from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            profile = request.user.userprofile
            return profile.role == "admin"
        except Exception:
            return False


class IsActiveUser(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            profile = request.user.userprofile
            if not profile.is_active:
                raise PermissionDenied(detail="Account is deactivated")
            return True
        except PermissionDenied:
            raise
        except Exception:
            return True
