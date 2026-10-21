from pydantic import Field, BaseModel


class BanPlayerRequest(BaseModel):
    player_id: int = Field(..., description="ID del jugador a banear")
    reason: str = Field(..., description="Razón del baneo")
    duration_days: int = Field(..., description="Duración del baneo en días")