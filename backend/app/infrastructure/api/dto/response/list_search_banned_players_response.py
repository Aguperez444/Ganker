from pydantic import BaseModel

from app.infrastructure.api.dto.response.search_banned_players_response import SearchBannedPlayersResponse


class ListSearchBannedPlayersResponse(BaseModel):
    list_banned_players: list['SearchBannedPlayersResponse']