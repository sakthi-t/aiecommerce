from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    ROLE_CUSTOMER = "customer"
    ROLE_ADMIN = "admin"

    ROLE_CHOICES = [
        (ROLE_CUSTOMER, "Customer"),
        (ROLE_ADMIN, "Admin"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="userprofile",
    )
    clerk_user_id = models.CharField(max_length=255, unique=True, db_index=True)
    email = models.EmailField(blank=True)
    display_name = models.CharField(max_length=255, blank=True)
    role = models.CharField(
        max_length=20, choices=ROLE_CHOICES, default=ROLE_CUSTOMER
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.display_name} ({self.role})"
