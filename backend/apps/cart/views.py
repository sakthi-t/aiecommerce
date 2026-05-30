from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from apps.books.models import Book


def _get_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart = _get_cart(request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def post(self, request):
        book_id = request.data.get("book_id")
        quantity = int(request.data.get("quantity", 1))

        if not book_id:
            return Response({"detail": "book_id required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            book = Book.objects.get(id=book_id)
        except Book.DoesNotExist:
            return Response({"detail": "Book not found"}, status=status.HTTP_404_NOT_FOUND)

        cart = _get_cart(request.user)
        item, created = CartItem.objects.get_or_create(
            cart=cart, book=book, defaults={"quantity": min(quantity, book.quantity_available)}
        )
        if not created:
            item.quantity = min(item.quantity + 1, book.quantity_available)
            item.save(update_fields=["quantity"])

        return Response(CartItemSerializer(item).data, status=status.HTTP_201_CREATED)


class CartItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        cart = _get_cart(self.request.user)
        return CartItem.objects.filter(cart=cart)

    def perform_update(self, serializer):
        quantity = int(self.request.data.get("quantity", 1))
        instance = self.get_object()
        max_qty = instance.book.quantity_available
        serializer.save(quantity=min(quantity, max_qty))

    def perform_destroy(self, instance):
        instance.delete()
