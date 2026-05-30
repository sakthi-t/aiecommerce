from django.contrib import admin
from .models import SupportSession, TranscriptMessage


@admin.register(SupportSession)
class SupportSessionAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "livekit_room_name", "started_at", "duration_seconds", "rating"]
    search_fields = ["user__email", "user__userprofile__display_name"]
    readonly_fields = ["livekit_room_name", "created_at"]


@admin.register(TranscriptMessage)
class TranscriptMessageAdmin(admin.ModelAdmin):
    list_display = ["id", "session", "speaker", "short_message", "timestamp"]
    list_filter = ["speaker"]

    @admin.display(description="Message")
    def short_message(self, obj):
        return obj.message[:120]
