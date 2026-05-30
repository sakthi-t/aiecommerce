from django.conf import settings
from django.db import models


class SupportSession(models.Model):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="support_sessions",
    )
    livekit_room_name = models.CharField(max_length=100)
    vapi_conversation_id = models.CharField(max_length=100, null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    duration_seconds = models.IntegerField(null=True, blank=True)
    rating = models.IntegerField(null=True, blank=True, choices=RATING_CHOICES)
    feedback = models.TextField(blank=True)
    summary = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Session {self.id} by {self.user.email}"


class TranscriptMessage(models.Model):
    class Speaker(models.TextChoices):
        CUSTOMER = "customer", "Customer"
        AGENT = "agent", "Agent"

    session = models.ForeignKey(
        SupportSession,
        on_delete=models.CASCADE,
        related_name="transcripts",
    )
    speaker = models.CharField(max_length=10, choices=Speaker.choices)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp"]

    def __str__(self):
        return f"[{self.speaker}] {self.message[:80]}"
