import time
import uuid

from django.conf import settings
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework import permissions, status, views
from rest_framework.response import Response

from apps.orders.models import Order
from apps.support.models import SupportSession, TranscriptMessage
from .serializers import StartSessionResponseSerializer


def _get_customer_name(user):
    try:
        return user.userprofile.display_name or user.email or "Customer"
    except Exception:
        return user.email or "Customer"


def _build_customer_context(user):
    name = _get_customer_name(user)
    orders = Order.objects.filter(user=user).order_by("-created_at")
    lines = []
    for o in orders:
        items = o.items.all()
        book_list = ", ".join(f"{i.book_title} x{i.quantity}" for i in items)
        lines.append(f"Order #{o.id} — {o.status.upper()} — {book_list} — ₹{o.total_amount}")
    order_text = "\n".join(lines) if lines else "No orders found."
    return f"Customer: {name}\nOrders ({len(orders)} total):\n{order_text}"


class StartSessionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        vapi_conv_id = f"vapi-{uuid.uuid4().hex[:12]}-{int(time.time())}"
        customer_name = _get_customer_name(user)
        ctx_info = _build_customer_context(user)

        session = SupportSession.objects.create(
            user=user,
            vapi_conversation_id=vapi_conv_id,
        )

        serializer = StartSessionResponseSerializer(
            {
                "session_id": session.id,
                "vapi_assistant_id": settings.VAPI_ASSISTANT_ID,
                "vapi_public_key": settings.VAPI_PUBLIC_KEY,
                "customer_name": customer_name,
                "vapi_conversation_id": vapi_conv_id,
                "ctx_info": ctx_info,
            }
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name="dispatch")
class VapiWebhookView(views.APIView):
    permission_classes = []

    def post(self, request):
        payload = request.data
        message = payload.get("message", {})
        event_type = message.get("type", "")

        session = self._match_session(event_type, message)
        if not session:
            return Response({"detail": "ok"}, status=status.HTTP_200_OK)

        if event_type == "conversation-update":
            self._handle_conversation_update(session, message)
        elif event_type == "status-update":
            self._handle_status_update(session, message)
        elif event_type == "end-of-call-report":
            self._handle_end_of_call_report(session, message)

        return Response({"detail": "ok"}, status=status.HTTP_200_OK)

    def _match_session(self, event_type, message):
        return SupportSession.objects.filter(
            vapi_conversation_id__isnull=False,
        ).order_by("-created_at").first()

    def _handle_conversation_update(self, session, message):
        messages = message.get("messages", []) or message.get("conversation", [])
        if not messages:
            return

        if not session.started_at:
            session.started_at = timezone.now()
            session.save(update_fields=["started_at"])

        for msg in messages:
            role = msg.get("role", "")
            content = msg.get("message") or msg.get("content", "")
            if role == "system" or not content.strip():
                continue
            speaker = "agent" if role in ("assistant", "bot") else "customer"
            TranscriptMessage.objects.get_or_create(
                session=session,
                speaker=speaker,
                message=content.strip(),
                defaults={"timestamp": timezone.now()},
            )

    def _handle_status_update(self, session, message):
        status_value = message.get("status", "")

        if status_value in ("in-progress", "started") and not session.started_at:
            session.started_at = timezone.now()
            session.save(update_fields=["started_at"])

        if status_value == "ended":
            session.ended_at = timezone.now()
            duration = message.get("duration")
            if duration:
                session.duration_seconds = int(duration / 1000) if duration > 1000 else int(duration)
            session.save(update_fields=["ended_at", "duration_seconds"])

    def _handle_end_of_call_report(self, session, message):
        import json
        print("END-OF-CALL REPORT PAYLOAD:", json.dumps(message, indent=2)[:3000], flush=True)

        analysis = message.get("analysis", {}) or {}
        summary = analysis.get("summary", "")
        if summary and not session.summary:
            session.summary = summary

        artifact = message.get("artifact", {}) or {}
        structured_outputs = artifact.get("structuredOutputs", {}) or {}

        # Also check top-level structuredData and message-level structured-data events
        if not structured_outputs:
            structured_outputs = message.get("structuredData", {}) or {}

        if isinstance(structured_outputs, dict):
            for key, value in structured_outputs.items():
                if isinstance(value, dict) and value.get("name") == "customer_feedback":
                    rating = value.get("result")
                    if rating is not None and session.rating is None:
                        session.rating = int(rating)
                        session.feedback = value.get("feedback", "") or ""
                        print(f"SAVED RATING: {session.rating} for session {session.id}", flush=True)

        transcript_msgs = artifact.get("messages", []) or []

        if session.summary or session.rating is not None:
            session.ended_at = timezone.now()
            save_fields = ["ended_at"]
            if session.summary:
                save_fields.append("summary")
            if session.rating is not None:
                save_fields.extend(["rating", "feedback"])
            session.save(update_fields=save_fields)

        artifact_duration = 0
        for msg in transcript_msgs:
            role = msg.get("role", "")
            content = msg.get("message", "")
            if role == "system" or not content.strip():
                continue
            speaker = "agent" if role in ("assistant", "bot") else "customer"
            TranscriptMessage.objects.get_or_create(
                session=session,
                speaker=speaker,
                message=content.strip(),
                defaults={"timestamp": timezone.now()},
            )
            msg_time = msg.get("endTime") or msg.get("time", 0)
            if msg_time > artifact_duration:
                artifact_duration = msg_time

        if not session.ended_at:
            session.ended_at = timezone.now()
        if artifact_duration and not session.duration_seconds:
            session.duration_seconds = int(artifact_duration / 1000)
        session.save(update_fields=["ended_at", "duration_seconds"])
