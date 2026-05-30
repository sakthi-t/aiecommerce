from rest_framework import serializers
from .models import Wishlist


class WishlistSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source="book.title", read_only=True)
    book_author = serializers.CharField(source="book.author", read_only=True)
    book_price = serializers.DecimalField(source="book.price_inr", max_digits=10, decimal_places=2, read_only=True)
    book_image = serializers.URLField(source="book.image_url", read_only=True)
    book_stock = serializers.IntegerField(source="book.quantity_available", read_only=True)

    class Meta:
        model = Wishlist
        fields = ["id", "book", "book_title", "book_author", "book_price", "book_image", "book_stock", "added_at"]
        read_only_fields = ["id", "added_at"]
