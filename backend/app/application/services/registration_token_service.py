import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from app.domain.models.pending_registration import PendingRegistration


class RegistrationTokenService:
    @staticmethod
    def renew(registration: PendingRegistration) -> str:
        raw_token = secrets.token_urlsafe(32)
        registration.token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        registration.expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        return raw_token
