from rest_framework import serializers


class StartSessionResponseSerializer(serializers.Serializer):
    session_id = serializers.IntegerField()
    vapi_assistant_id = serializers.CharField()
    vapi_public_key = serializers.CharField()
    customer_name = serializers.CharField()
    vapi_conversation_id = serializers.CharField()
    ctx_info = serializers.CharField()
