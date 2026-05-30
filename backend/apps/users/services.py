import logging
import requests
from django.conf import settings
from django.contrib.auth.models import User
from django.db import transaction
from apps.users.models import UserProfile

logger = logging.getLogger(__name__)


@transaction.atomic
def get_or_create_user_from_clerk(clerk_user_id: str, payload: dict):
    email = payload.get("email") or payload.get("email_address") or ""
    display_name = (
        payload.get("name")
        or f"{payload.get('first_name', '')} {payload.get('last_name', '')}".strip()
        or ""
    )

    # Fallback: fetch email/name from Clerk API if not in JWT
    if not email or not display_name:
        clerk_data = _fetch_user_from_clerk(clerk_user_id)
        if clerk_data:
            if not email:
                email_addrs = clerk_data.get("email_addresses", [])
                email = email_addrs[0].get("email_address", "") if email_addrs else ""
            if not display_name:
                first = clerk_data.get("first_name", "")
                last = clerk_data.get("last_name", "")
                display_name = f"{first} {last}".strip() or email

    user, user_created = User.objects.get_or_create(
        username=clerk_user_id,
        defaults={
            "email": email,
            "first_name": display_name,
        },
    )

    if not user_created:
        if email and user.email != email:
            user.email = email
            user.save(update_fields=["email"])
        if display_name and user.first_name != display_name:
            user.first_name = display_name
            user.save(update_fields=["first_name"])

    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={
            "clerk_user_id": clerk_user_id,
            "email": email,
            "display_name": display_name,
            "role": UserProfile.ROLE_CUSTOMER,
        },
    )

    # Sync role from Clerk metadata
    logger.info(f"[RoleSync] Fetching role for clerk_user_id={clerk_user_id}")
    synced_role = _fetch_role_from_clerk(clerk_user_id)
    logger.info(f"[RoleSync] Got role={synced_role} for user={user.username}, current={profile.role}")
    if synced_role and profile.role != synced_role:
        profile.role = synced_role
        profile.save(update_fields=["role"])
        logger.info(f"[RoleSync] Updated role to {synced_role} for {user.username}")

    # Sync email/name to profile if missing
    if email and not profile.email:
        profile.email = email
        profile.save(update_fields=["email"])
    if display_name and not profile.display_name:
        profile.display_name = display_name
        profile.save(update_fields=["display_name"])

    return user


def _fetch_user_from_clerk(clerk_user_id: str):
    secret_key = settings.CLERK_SECRET_KEY
    if not secret_key:
        logger.warning("CLERK_SECRET_KEY not configured — cannot fetch user from Clerk")
        return None
    try:
        resp = requests.get(
            f"https://api.clerk.com/v1/users/{clerk_user_id}",
            headers={"Authorization": f"Bearer {secret_key}"},
            timeout=5,
        )
        if resp.status_code == 200:
            return resp.json()
        logger.warning(f"Clerk API returned {resp.status_code} for user {clerk_user_id}")
    except Exception as e:
        logger.warning(f"Clerk API call failed for user {clerk_user_id}: {e}")
    return None


def _fetch_role_from_clerk(clerk_user_id: str):
    data = _fetch_user_from_clerk(clerk_user_id)
    if not data:
        return None
    public_meta = data.get("public_metadata", {})
    private_meta = data.get("private_metadata", {})
    role = (
        private_meta.get("role")
        or public_meta.get("role")
        or data.get("unsafe_metadata", {}).get("role")
    )
    if role in ("admin", "customer"):
        return role
    return None
