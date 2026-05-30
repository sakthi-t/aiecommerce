import logging
import jwt
import requests
from django.conf import settings
from rest_framework import authentication
from rest_framework.exceptions import AuthenticationFailed, PermissionDenied
from apps.users.services import get_or_create_user_from_clerk

logger = logging.getLogger(__name__)


class ClerkJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get("Authorization")
        logger.info(f"[ClerkAuth] Auth header present: {bool(auth_header)}")

        if not auth_header or not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split("Bearer ")[1]
        logger.info(f"[ClerkAuth] Token prefix: {token[:20]}...")

        payload = self._verify_clerk_token(token)
        if not payload:
            logger.warning("[ClerkAuth] Token verification failed")
            raise AuthenticationFailed("Invalid or expired token")

        clerk_user_id = payload.get("sub")
        logger.info(f"[ClerkAuth] Verified user: {clerk_user_id}")

        if not clerk_user_id:
            raise AuthenticationFailed("Token missing user identifier")

        user = get_or_create_user_from_clerk(clerk_user_id, payload)
        logger.info(f"[ClerkAuth] User profile synced: {user.username}")

        try:
            if not user.userprofile.is_active:
                raise PermissionDenied(detail="Account is deactivated")
        except PermissionDenied:
            raise
        except Exception:
            pass

        return (user, None)

    def _verify_clerk_token(self, token):
        try:
            jwks_client = jwt.PyJWKClient(settings.CLERK_JWKS_URL)
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
        except Exception:
            return None
