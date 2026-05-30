from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.users.models import UserProfile
from apps.users.services import get_or_create_user_from_clerk


class Command(BaseCommand):
    help = "Create a test user with UserProfile for testing Phase 2"

    def add_arguments(self, parser):
        parser.add_argument("--admin", action="store_true", help="Create as admin")

    @transaction.atomic
    def handle(self, *args, **options):
        clerk_id = "user_test_clerk_001"
        is_admin = options["admin"]
        role = UserProfile.ROLE_ADMIN if is_admin else UserProfile.ROLE_CUSTOMER

        payload = {
            "sub": clerk_id,
            "email": "test@bookstore.local",
            "name": "Test User",
        }

        user = get_or_create_user_from_clerk(clerk_id, payload)
        profile = user.userprofile
        profile.role = role
        profile.save(update_fields=["role"])

        self.stdout.write(
            self.style.SUCCESS(
                f"Test user: username={user.username} email={user.email} role={profile.role}"
            )
        )
