from typing import Optional

from pydantic import BaseModel, Field


class FederatedAuthorizationUrlResponse(BaseModel):
    authorization_url: str = Field(..., description="URL del proveedor externo a la que se redirige al jugador")
    provider: str = Field(..., description="Identificador del proveedor federado")


class FederatedCallbackResponse(BaseModel):
    status: str = Field(
        ...,
        description="'authenticated' si el jugador ya tenía cuenta o se asoció por email; 'needs_registration' si debe elegir su username y nombre",
    )
    provider: str = Field(..., description="Identificador del proveedor federado")
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: Optional[str] = None
    registration_token: Optional[str] = None
    suggested_username: Optional[str] = None
    suggested_name: Optional[str] = None
    email: Optional[str] = None
    avatar_url: Optional[str] = None
