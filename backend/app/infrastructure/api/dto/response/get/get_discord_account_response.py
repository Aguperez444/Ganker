from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class GetDiscordAccountResponse(BaseModel):
    linked: bool = Field(..., description="Indica si hay una cuenta de Discord visible para quien consulta")
    discord_user_id: Optional[str] = Field(None, description="ID de la cuenta en Discord")
    username: Optional[str] = Field(None, description="Nombre de usuario de Discord (único)")
    display_name: Optional[str] = Field(None, description="Nombre visible en Discord")
    avatar_url: Optional[str] = Field(None, description="Avatar de Discord")
    profile_url: Optional[str] = Field(None, description="Link para abrir el perfil en Discord")
    visibility: Optional[str] = Field(None, description="Quién puede verla (solo se informa al dueño de la cuenta)")
    linked_at: Optional[datetime] = Field(None, description="Cuándo se vinculó (solo se informa al dueño de la cuenta)")


class DiscordAuthorizationUrlResponse(BaseModel):
    authorization_url: str = Field(..., description="URL de Discord a la que hay que mandar al jugador para que autorice")
