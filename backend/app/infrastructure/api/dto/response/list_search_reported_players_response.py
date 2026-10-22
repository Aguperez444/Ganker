from pydantic import BaseModel

from app.infrastructure.api.dto.response.search_reported_players_response import SearchReportedPlayersResponse


class ListSearchReportedPlayersResponse(BaseModel):
    reports: list['SearchReportedPlayersResponse']