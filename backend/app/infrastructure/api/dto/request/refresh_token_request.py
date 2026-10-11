from pydantic import BaseModel, Field

class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="Token de refresco para obtener un nuevo access token")
