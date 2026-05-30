import json
import jwt
import requests
from django.conf import settings
from django.http import JsonResponse
from django.views import View
from rest_framework.permissions import AllowAny


class ClerkDebugView(View):
    permission_classes = [AllowAny]

    def get(self, request):
        result = {}

        # 1. Check config
        result["jwks_url"] = settings.CLERK_JWKS_URL
        result["secret_key_set"] = bool(settings.CLERK_SECRET_KEY)

        # 2. Check JWKS reachable
        try:
            jwks_resp = requests.get(settings.CLERK_JWKS_URL, timeout=5)
            result["jwks_reachable"] = jwks_resp.status_code == 200
        except Exception as e:
            result["jwks_reachable"] = f"Error: {e}"

        # 3. Check raw incoming request
        auth_header = request.headers.get("Authorization", "")
        result["auth_header_present"] = bool(auth_header)
        result["auth_header_prefix"] = auth_header[:30] + "..." if auth_header else "none"

        # 4. If we have a token, try verifying it
        if auth_header.startswith("Bearer "):
            token = auth_header.split("Bearer ")[1]
            try:
                jwks_client = jwt.PyJWKClient(settings.CLERK_JWKS_URL)
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["RS256"],
                    options={"verify_aud": False},
                )
                result["token_valid"] = True
                result["token_sub"] = payload.get("sub", "missing")
                result["token_email"] = (
                    payload.get("email") or payload.get("email_address", "missing")
                )
            except jwt.ExpiredSignatureError:
                result["token_valid"] = "expired"
            except jwt.InvalidTokenError as e:
                result["token_valid"] = f"invalid: {e}"
            except Exception as e:
                result["token_valid"] = f"error: {e}"
        else:
            result["token_valid"] = "no token provided"

        return JsonResponse(result)
