from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["id", "book", "book_title", "book_price", "quantity"]
        read_only_fields = ["id"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "user_email",
            "user_name",
            "total_amount",
            "status",
            "stripe_session_id",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "total_amount",
            "stripe_session_id",
            "created_at",
            "updated_at",
        ]

    def get_user_name(self, obj):
        try:
            return obj.user.userprofile.display_name or obj.user.email
        except Exception:
            return obj.user.email or "Unknown"


class AdminOrderStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["status"]
