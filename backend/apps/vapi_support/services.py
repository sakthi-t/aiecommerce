import httpx
from django.conf import settings

VAPI_BASE = "https://api.vapi.ai"


def _headers():
    return {
        "Authorization": f"Bearer {settings.VAPI_API_KEY}",
        "Content-Type": "application/json",
    }
