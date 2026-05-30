from django.conf import settings
from django.db import models
from apps.books.models import Book


class Wishlist(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist",
    )
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["user", "book"]

    def __str__(self):
        return f"{self.user.username} → {self.book.title}"
