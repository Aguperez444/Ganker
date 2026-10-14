from pydantic import BaseModel, Field

from app.domain.models.discord_account_link import DiscordVisibility


class LinkDiscordAccountRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=200, description="Código que devuelve Discord al autorizar")
    state: str = Field(..., min_length=1, max_length=1000, description="State que generó Ganker al iniciar la conexión")
    visibility: DiscordVisibility = Field(DiscordVisibility.TEAMMATES, description="Quién puede ver la cuenta de Discord")
