import asyncio
import re
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from dotenv import load_dotenv
load_dotenv(BACKEND_DIR / ".env")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()

from asgiref.sync import sync_to_async
from django.conf import settings
from livekit.agents import JobContext, WorkerOptions, WorkerType, cli
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import openai as lk_openai


@sync_to_async
def _build_context(room_name):
    from apps.orders.models import Order
    from apps.support.models import SupportSession

    session = (
        SupportSession.objects.filter(livekit_room_name=room_name)
        .select_related("user__userprofile")
        .first()
    )
    if not session:
        return "No customer context available.", ""

    user = session.user
    name = user.email or "Customer"
    try:
        name = user.userprofile.display_name or user.email or "Customer"
    except Exception:
        pass

    orders = Order.objects.filter(user=user).order_by("-created_at")
    lines = []
    for o in orders:
        items = o.items.all()
        book_list = ", ".join(f"{i.book_title} x{i.quantity}" for i in items)
        lines.append(f"Order #{o.id} — {o.status.upper()} — {book_list} — ₹{o.total_amount}")
    order_text = "\n".join(lines) if lines else "No orders found."
    return f"Customer: {name}\nOrders ({len(orders)} total):\n{order_text}", name


async def entrypoint(ctx: JobContext):
    room = ctx.room.name
    result = await _build_context(room)
    ctx_info, name = result
    if not ctx_info:
        ctx_info, name = "No customer context available.", ""

    instructions = f"""You are Haney, a friendly bookstore support assistant for an online bookstore.

IMPORTANT PRIVACY RULE: You only know about THIS customer's orders from the context below. Never claim to know about orders or customers not listed here. If asked about an order number that does NOT appear in your context, honestly say "I don't see that order in your account — could you double-check the order number?"

IMPORTANT FEEDBACK RULE: Near the end of the conversation, invite the customer to rate: "If you have a moment, could you rate your experience from 1 to 5, with 5 being excellent?" If the customer gives a numeric or word rating (like "four" or "five"), acknowledge it warmly. If they continue talking about orders instead, help them first, then invite feedback again later.

Customer context:
{ctx_info}

Rules:
- Answer concisely and warmly
- Reference specific order details from your context above
- Do NOT create, cancel, modify orders, process refunds, or change inventory
- If asked for unsupported actions, politely explain manual review is needed
- Never reveal another customer's information
- If an order number is not in your context, say so — don't make things up"""

    greeting = (
        f"Hello {name}! I'm Haney, your bookstore support assistant. How can I help you today?"
        if name
        else "Hello! I'm Haney, your bookstore support assistant. How can I help you today?"
    )

    api_key = settings.OPENAI_API_KEY

    agent = Agent(
        instructions=instructions,
        llm=lk_openai.realtime.RealtimeModel(
            model=os.getenv("OPENAI_REALTIME_MODEL", "gpt-realtime"),
            voice="shimmer",
            modalities=["audio", "text"],
            api_key=api_key,
        ),
        stt=lk_openai.STT(api_key=api_key),
        tts=lk_openai.TTS(api_key=api_key, voice="shimmer"),
        allow_interruptions=True,
    )

    session = AgentSession()

    @session.on("user_input_transcribed")
    def on_user_input(ev):
        text = getattr(ev, "transcript", None) or getattr(ev, "text", None) or ""
        if not text.strip():
            return
        asyncio.create_task(_store_message_async(room, "customer", text.strip()))
        rating = _extract_rating(text.strip())
        if rating is not None:
            asyncio.create_task(_save_rating_async(room, rating, text.strip()))
        # After user speaks, delay then grab agent response from realtime model
        asyncio.create_task(_capture_latest_agent(room, session, agent))

    await session.start(agent=agent, room=ctx.room)

    # Store the initial greeting
    asyncio.create_task(_store_message_async(room, "agent", greeting))
    await session.say(greeting)


async def _capture_latest_agent(room, session, agent):
    """Capture the most recent assistant response from the realtime model."""
    await asyncio.sleep(1.5)
    try:
        llm_model = agent.llm if hasattr(agent, "llm") else None
        if llm_model is None:
            return
        conversation = getattr(llm_model, "conversation", None)
        if conversation is None:
            return
        items = list(getattr(conversation, "item", []))
        for item in reversed(items):
            if getattr(item, "role", None) != "assistant":
                continue
            text_parts = []
            for c in getattr(item, "content", []):
                t = getattr(c, "transcript", "") or getattr(c, "text", "") or str(c)
                text_parts.append(t)
            text = " ".join(text_parts).strip()
            if text:
                asyncio.create_task(_store_message_async(room, "agent", text))
                rating = _extract_rating(text)
                if rating is not None:
                    asyncio.create_task(_save_rating_async(room, rating, text))
                break
    except Exception:
        pass


def _extract_rating(text):
    word_map = {
        "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
        "wone": 1, "to": 2, "too": 2, "tree": 3, "tri": 3,
        "free": 3, "fore": 4, "for": 4, "fi": 5, "fai": 5,
        "fife": 5, "hive": 5, "high": 5,
    }
    lower = text.lower()

    for pattern in [
        r"rating\s*(?:of|is)?\s*(\d)",
        r"give\s*(?:it)?\s*(?:a|an)?\s*(\d)",
        r"rate\s*(?:it)?\s*(?:as|a|an)?\s*(\d)",
        r"(\d)\s*(?:out\s*of|/)\s*5",
        r"(?:score|mark)\s*(?:of|is)?\s*(\d)",
        r"(?:go|going)\s*(?:with|for)?\s*(\d)",
        r"(?:think|say|choose)\s*(\d)",
        r"(\d)\s*stars?",
        r"(?:my\s+)?rating\s+(?:is|would be)?\s*(\d)",
    ]:
        m = re.search(pattern, lower)
        if m:
            val = int(m.group(1))
            if 1 <= val <= 5:
                return val

    keys = "|".join(sorted(word_map, key=len, reverse=True))
    for pattern in [
        rf"rating\s*(?:of|is)?\s*({keys})",
        rf"give\s*(?:it)?\s*(?:a|an)?\s*({keys})",
        rf"rate\s*(?:it)?\s*(?:as|a|an)?\s*({keys})",
        rf"({keys})\s*(?:out\s*of|/)\s*5",
        rf"({keys})\s*stars?",
        rf"(?:go|going)\s*(?:with|for)?\s*({keys})",
        rf"(?:think|say|choose)\s*({keys})",
        rf"(?:my\s+)?rating\s+(?:is|would be)?\s*({keys})",
    ]:
        m = re.search(pattern, lower)
        if m:
            return word_map.get(m.group(1))

    words = lower.split()
    if 1 <= len(words) <= 3:
        for word in words:
            w = word.strip(".,'\"!?")
            if w in word_map:
                return word_map[w]
    return None


@sync_to_async
def _save_rating_async(room_name, rating, text):
    from apps.support.models import SupportSession

    s = SupportSession.objects.filter(livekit_room_name=room_name).first()
    if s and s.rating is None:
        s.rating = rating
        s.feedback = text
        s.save(update_fields=["rating", "feedback"])


@sync_to_async
def _store_message_async(room_name, speaker, message):
    from django.utils import timezone
    from apps.support.models import SupportSession, TranscriptMessage

    if not message.strip():
        return
    s = SupportSession.objects.filter(livekit_room_name=room_name).first()
    if s:
        TranscriptMessage.objects.create(session=s, speaker=speaker, message=message)
        if not s.started_at:
            s.started_at = timezone.now()
            s.save(update_fields=["started_at"])


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            worker_type=WorkerType.ROOM,
            ws_url=settings.LIVEKIT_URL,
            api_key=settings.LIVEKIT_API_KEY,
            api_secret=settings.LIVEKIT_API_SECRET,
            agent_name="haney",
        )
    )
