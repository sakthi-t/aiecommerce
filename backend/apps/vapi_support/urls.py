from django.urls import path

from .views import StartSessionView, VapiWebhookView

app_name = "vapi_support"

urlpatterns = [
    path("start-session/", StartSessionView.as_view(), name="vapi-start-session"),
    path("webhook/", VapiWebhookView.as_view(), name="vapi-webhook"),
]
