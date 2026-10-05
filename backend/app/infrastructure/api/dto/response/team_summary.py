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
    team_member_role_id: int | None = Field(None, description="ID del slot del equipo (es el que se envía al unirse a una vacante)")
    is_vacant: bool = Field(False, description="Indica si el slot está vacante")
    is_leader: bool = Field(False, description="Indica si el participante es el líder del equipo")
    user_id: int|None = Field(..., description="ID único del participante")
    username: str = Field(..., description="Nombre de usuario del participante")
    name: str = Field(..., description="Nombre completo del participante")
    icon_url: str = Field(..., description="URL del ícono del participante")
    active_game_profile: GameProfileSummaryResponse = Field(..., description="Perfil de juego activo del participante")


class RepresentativeRankResponse(BaseModel):
    rank_id: int = Field(..., description="ID del rango de los integrantes más cercano al promedio")
    name: str = Field(..., description="Nombre del rango representativo")
    icon_url: str = Field(..., description="Ícono del rango representativo")
    average_value: float = Field(..., description="Valor promedio de rango de los integrantes actuales")


class JoinEligibilityResponse(BaseModel):
    can_join: bool = Field(..., description="Indica si el jugador que consulta cumple los requisitos para unirse")
    reason: str | None = Field(None, description="Motivo por el que no puede unirse, si corresponde")


class TeamSummaryResponse(BaseModel):
    team_id: int = Field(..., description="ID único del equipo")
    team_name: str = Field(..., description="Nombre del equipo")
    description: str | None = Field(None, description="Mensaje descriptivo de la sala")
    icon_url: str | None = Field(None, description="URL del ícono del equipo (también es el ícono del chatroom)")
    is_active: bool = Field(True, description="Indica si el equipo está activo")
    conversation_id: int | None = Field(None, description="ID del chatroom asociado al equipo")
    vacant_slots: int = Field(0, description="Cantidad de vacantes disponibles")
    representative_rank: RepresentativeRankResponse | None = Field(None, description="Rango representativo de la sala")
    is_member: bool | None = Field(None, description="Si el jugador que consulta es miembro (solo si hay jugador que consulta)")
    is_leader: bool | None = Field(None, description="Si el jugador que consulta es el líder (solo si hay jugador que consulta)")
    join_eligibility: JoinEligibilityResponse | None = Field(None, description="Si el jugador que consulta puede unirse (solo si hay jugador que consulta)")
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


class JoinTeamResponse(BaseModel):
    status: str = Field("success", description="Resultado de la operación")
    message: str = Field(..., description="Mensaje de confirmación para el jugador")
    chatroom_id: int = Field(..., description="ID del chatroom del equipo al que se incorporó el jugador")
    data: TeamSummaryResponse = Field(..., description="Estado actualizado del equipo")
