from rest_framework import serializers
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = [
            "id",
            "clerk_user_id",
            "email",
            "display_name",
            "role",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "clerk_user_id", "created_at", "updated_at"]


class AdminUserListSerializer(serializers.ModelSerializer):
    total_orders = serializers.IntegerField(read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "display_name",
            "email",
            "role",
            "is_active",
            "total_orders",
            "created_at",
        ]
        read_only_fields = fields
