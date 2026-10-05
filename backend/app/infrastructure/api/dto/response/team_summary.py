from pydantic import BaseModel, Field



class RoleProfileSummaryResponse(BaseModel):
    role_name: str = Field(..., description="Nombre del rol asociado al perfil de rol")
    rank_name: str = Field(..., description="Nombre del rango asociado al perfil de rol")
    rank_icon_url: str = Field(..., description="URL del ícono del rango asociado al perfil de rol")

class GameProfileSummaryResponse(BaseModel):
    region_name: str = Field(..., description="Nombre de la región asociada al perfil de juego")
    active_role_profile: RoleProfileSummaryResponse = Field(..., description="Perfil de rol activo del perfil de juego")

class UserSummaryResponse(BaseModel):
    user_id: int|None = Field(..., description="ID único del participante")
    username: str = Field(..., description="Nombre de usuario del participante")
    name: str = Field(..., description="Nombre completo del participante")
    icon_url: str = Field(..., description="URL del ícono del participante")
    active_game_profile: GameProfileSummaryResponse = Field(..., description="Perfil de juego activo del participante")


class TeamSummaryResponse(BaseModel):
    team_id: int = Field(..., description="ID único del equipo")
    team_name: str = Field(..., description="Nombre del equipo")
    description: str | None = Field(None, description="Mensaje descriptivo de la sala")
    player_count: int = Field(..., description="Cantidad de jugadores en el equipo")
    max_players: int = Field(..., description="Cantidad máxima de jugadores permitidos en el equipo")
    members: list[UserSummaryResponse] = Field(..., description="Lista de miembros del equipo")

