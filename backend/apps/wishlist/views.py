from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Wishlist
from .serializers import WishlistSerializer
from apps.books.models import Book


class WishlistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        items = Wishlist.objects.filter(user=request.user)
        serializer = WishlistSerializer(items, many=True)
        return Response(serializer.data)

    def post(self, request):
        book_id = request.data.get("book_id")
        if not book_id:
            return Response({"detail": "book_id required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            Book.objects.get(id=book_id)
        except Book.DoesNotExist:
            return Response({"detail": "Book not found"}, status=status.HTTP_404_NOT_FOUND)

        item, created = Wishlist.objects.get_or_create(
            user=request.user, book_id=book_id
        )
        if not created:
            return Response({"detail": "Already in wishlist"}, status=status.HTTP_200_OK)

        return Response(WishlistSerializer(item).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        book_id = request.data.get("book_id")
        if not book_id:
            return Response({"detail": "book_id required"}, status=status.HTTP_400_BAD_REQUEST)

        deleted, _ = Wishlist.objects.filter(user=request.user, book_id=book_id).delete()
        if not deleted:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(status=status.HTTP_204_NO_CONTENT)
