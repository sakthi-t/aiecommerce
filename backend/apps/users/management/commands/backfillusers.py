from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.users.services import _fetch_user_from_clerk


class Command(BaseCommand):
    help = "Backfill user emails and display names from Clerk API"

    def handle(self, *args, **options):
        users = User.objects.filter(email="") | User.objects.filter(first_name="")
        total = users.count()
        self.stdout.write(f"Found {total} users with missing data")

        for user in users:
            clerk_id = user.username
            if not clerk_id.startswith("user_"):
                continue
            data = _fetch_user_from_clerk(clerk_id)
            if not data:
                self.stdout.write(self.style.WARNING(f"Skipping {clerk_id[:20]}..."))
                continue

            emails = data.get("email_addresses", [])
            email = emails[0].get("email_address", "") if emails else ""
            first = data.get("first_name", "")
            last = data.get("last_name", "")
            name = f"{first} {last}".strip()

            updated = False
            if email and not user.email:
                user.email = email
                updated = True
            if name and not user.first_name:
                user.first_name = name
                updated = True
            if updated:
                user.save()
                self.stdout.write(self.style.SUCCESS(f"Updated: {name} ({email})"))

            # Also update UserProfile
            try:
                profile = user.userprofile
                if email and not profile.email:
                    profile.email = email
                    updated = True
                if name and not profile.display_name:
                    profile.display_name = name
                    updated = True
                if updated:
                    profile.save()
            except Exception:
                pass
