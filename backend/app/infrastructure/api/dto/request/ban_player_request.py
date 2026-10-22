from pydantic import Field, BaseModel


class BanPlayerRequest(BaseModel):
    player_id: int = Field(..., gt=0, description="ID del jugador a banear")
    reason: str = Field(..., min_length=1, max_length=500, pattern=r"\S", description="Razón del baneo")
    duration_days: int = Field(..., ge=1, description="Duración del baneo en días, sin máximo de negocio; si excede la fecha representable, vence al final del año 9999")
