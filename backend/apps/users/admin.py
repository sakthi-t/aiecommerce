from django.contrib import admin
from apps.users.models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ["clerk_user_id", "display_name", "email", "role", "created_at"]
    list_filter = ["role"]
    search_fields = ["clerk_user_id", "display_name", "email"]
