from rest_framework import serializers
from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    book_author = serializers.CharField(source="book.author", read_only=True)
    book_price = serializers.DecimalField(
        source="book.price_inr", max_digits=10, decimal_places=2, read_only=True
    )
    book_image = serializers.URLField(source="book.image_url", read_only=True)
    book_stock = serializers.IntegerField(source="book.quantity_available", read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "book",
            "book_title",
            "book_author",
            "book_price",
            "book_image",
            "book_stock",
            "quantity",
            "added_at",
        ]
        read_only_fields = ["id", "book", "added_at"]


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ["id", "items", "subtotal", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_subtotal(self, obj):
        return sum(item.book.price_inr * item.quantity for item in obj.items.all())
