from app.application.ports.i_unit_of_work import IUnitOfWork
from app.infrastructure.api.dto.response.active_banned_players_response import (
    ActiveBannedPlayerResponse,
    ActiveBannedPlayersResponse,
)


class QueryActiveBans:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def execute(
        self, username: str | None = None, skip: int = 0, limit: int = 10,
    ) -> ActiveBannedPlayersResponse:
        with self.uow as uow:
            rows = uow.moderation_repo.get_active_bans(
                username.strip() if username is not None else None, skip, limit,
            )
            return ActiveBannedPlayersResponse(players=[
                ActiveBannedPlayerResponse(
                    user_id=user_id, username=name, reason=reason, expires_at=expires_at,
                )
                for user_id, name, reason, expires_at in rows
            ])
