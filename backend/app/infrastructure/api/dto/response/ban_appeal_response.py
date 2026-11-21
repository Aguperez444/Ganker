from datetime import datetime

from pydantic import BaseModel

from app.domain.models.ban_appeal import AppealableBan, BanAppeal, BanAppealStatus


class AppealableBanResponse(BaseModel):
    ban_id: int
    user_id: int
    username: str
    reason: str
    created_at: datetime
    expires_at: datetime | None
    active: bool

    @classmethod
    def from_domain(cls, ban: AppealableBan):
        return cls(**vars(ban))


class BanAppealResponse(BaseModel):
    id: int
    ban: AppealableBanResponse
    text: str
    status: BanAppealStatus
    created_at: datetime
    images: list[str]
    resolved_at: datetime | None
    resolver_user_id: int | None
    resolver_username: str | None

    @classmethod
    def from_domain(cls, appeal: BanAppeal):
        return cls(
            id=appeal.appeal_id, ban=AppealableBanResponse.from_domain(appeal.ban),
            text=appeal.text, status=appeal.status, created_at=appeal.created_at,
            images=appeal.images, resolved_at=appeal.resolved_at,
            resolver_user_id=appeal.resolver_user_id, resolver_username=appeal.resolver_username,
        )


class OwnBanAppealResponse(BaseModel):
    ban: AppealableBanResponse
    appeal: BanAppealResponse | None


class ListBanAppealsResponse(BaseModel):
    appeals: list[BanAppealResponse]
