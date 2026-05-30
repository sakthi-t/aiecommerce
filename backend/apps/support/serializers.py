from rest_framework import serializers
from .models import SupportSession, TranscriptMessage


class TranscriptMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = TranscriptMessage
        fields = ["id", "speaker", "message", "timestamp"]
        read_only_fields = ["id", "timestamp"]


class SupportSessionSerializer(serializers.ModelSerializer):
    transcripts = TranscriptMessageSerializer(many=True, read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = SupportSession
        fields = [
            "id",
            "user",
            "user_email",
            "user_name",
            "livekit_room_name",
            "vapi_conversation_id",
            "started_at",
            "ended_at",
            "duration_seconds",
            "rating",
            "feedback",
            "summary",
            "transcripts",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "livekit_room_name",
            "vapi_conversation_id",
            "created_at",
        ]

    def get_user_name(self, obj):
        try:
            return obj.user.userprofile.display_name or obj.user.email
        except Exception:
            return obj.user.email or "Unknown"


class StartSessionResponseSerializer(serializers.Serializer):
    session_id = serializers.IntegerField()
    livekit_room_name = serializers.CharField()
    livekit_token = serializers.CharField()


class SessionFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportSession
        fields = ["rating", "feedback"]
