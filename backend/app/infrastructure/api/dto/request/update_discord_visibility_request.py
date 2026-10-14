from pydantic import BaseModel, Field

from app.domain.models.discord_account_link import DiscordVisibility


class UpdateDiscordVisibilityRequest(BaseModel):
    visibility: DiscordVisibility = Field(..., description="'everyone' (todos los jugadores) o 'teammates' (compañeros de equipo)")
