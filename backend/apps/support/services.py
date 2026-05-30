import asyncio
import time
import uuid

from django.conf import settings
from livekit import api


def _get_http_url() -> str:
    return settings.LIVEKIT_URL.replace("wss://", "https://")


async def _create_room_async() -> str:
    room_name = _generate_room_name()
    lk = api.LiveKitAPI(
        url=_get_http_url(),
        api_key=settings.LIVEKIT_API_KEY,
        api_secret=settings.LIVEKIT_API_SECRET,
    )
    try:
        await lk.room.create_room(api.CreateRoomRequest(name=room_name, empty_timeout=600))
        return room_name
    finally:
        await lk.aclose()


def create_livekit_room() -> str:
    return asyncio.run(_create_room_async())


def generate_livekit_token(room_name: str, participant_name: str, clerk_user_id: str) -> str:
    return (
        api.AccessToken(
            api_key=settings.LIVEKIT_API_KEY,
            api_secret=settings.LIVEKIT_API_SECRET,
        )
        .with_identity(participant_name)
        .with_name(participant_name)
        .with_grants(api.VideoGrants(room_join=True, room=room_name))
        .with_metadata(clerk_user_id)
        .to_jwt()
    )


async def _dispatch_async(room_name: str) -> None:
    lk = api.LiveKitAPI(
        url=_get_http_url(),
        api_key=settings.LIVEKIT_API_KEY,
        api_secret=settings.LIVEKIT_API_SECRET,
    )
    try:
        await lk.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(agent_name="haney", room=room_name)
        )
    finally:
        await lk.aclose()


def dispatch_agent_to_room(room_name: str) -> None:
    asyncio.run(_dispatch_async(room_name))


def delete_livekit_room(room_name: str) -> None:
    try:
        asyncio.run(_delete_room_async(room_name))
    except Exception:
        pass


async def _delete_room_async(room_name: str) -> None:
    lk = api.LiveKitAPI(
        url=_get_http_url(),
        api_key=settings.LIVEKIT_API_KEY,
        api_secret=settings.LIVEKIT_API_SECRET,
    )
    try:
        await lk.room.delete_room(api.DeleteRoomRequest(room=room_name))
    finally:
        await lk.aclose()


def _generate_room_name() -> str:
    return f"support-{uuid.uuid4().hex[:12]}-{int(time.time())}"
