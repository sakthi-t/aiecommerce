import cloudinary.uploader
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.parsers import MultiPartParser
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsAdminUser
from .models import Book
from .serializers import BookSerializer
from .services import get_book_inventory_stats


class BookPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = "page_size"
    max_page_size = 50


class BookListCreateView(generics.ListCreateAPIView):
    serializer_class = BookSerializer
    pagination_class = BookPagination

    def get_queryset(self):
        qs = Book.objects.all()
        search = self.request.query_params.get("q", "").strip()
        if search:
            qs = qs.filter(
                Q(title__icontains=search)
                | Q(author__icontains=search)
                | Q(genre__icontains=search)
            )
        return qs

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminUser()]
        return [permissions.AllowAny()]


class BookDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    lookup_field = "id"

    def get_permissions(self):
        if self.request.method in ("PUT", "PATCH", "DELETE"):
            return [IsAdminUser()]
        return [permissions.AllowAny()]


class BookInventoryStatsView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        stats = get_book_inventory_stats()
        return Response(stats)


class BookImageUploadView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser]

    def post(self, request, id):
        try:
            book = Book.objects.get(id=id)
        except Book.DoesNotExist:
            return Response(
                {"detail": "Book not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        image_file = request.FILES.get("image")
        if not image_file:
            return Response(
                {"detail": "No image file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        upload_result = cloudinary.uploader.upload(image_file)
        book.image_url = upload_result.get("secure_url", upload_result.get("url"))
        book.save(update_fields=["image_url"])

        return Response({"image_url": book.image_url})
