from pydantic import BaseModel, Field



class RoleProfileSummaryResponse(BaseModel):
    role_id: int | None = Field(None, description="ID del rol")
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
    videogame_id: int | None = Field(None, description="ID del videojuego")
    videogame_name: str | None = Field(None, description="Nombre del videojuego")
    region_id: int | None = Field(None, description="ID de la región")
    region_name: str | None = Field(None, description="Nombre de la región")
    min_rank_id: int | None = Field(None, description="ID del rango mínimo")
    min_rank_name: str | None = Field(None, description="Nombre del rango mínimo")
    min_rank_value: int | None = Field(None, description="Valor del rango mínimo")
    max_rank_id: int | None = Field(None, description="ID del rango máximo")
    max_rank_name: str | None = Field(None, description="Nombre del rango máximo")
    max_rank_value: int | None = Field(None, description="Valor del rango máximo")
    allow_other_regions: bool | None = Field(None, description="Permite otras regiones")
    members: list[UserSummaryResponse] = Field(..., description="Lista de miembros del equipo")

