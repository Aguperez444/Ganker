from typing import Optional

from app.domain.exceptions.domain_exception import DomainException


class InvalidRegionException(DomainException):
    """Raised when the region of a player is not admitted by a team."""

    def __init__(self, team_region_id: Optional[int], player_region_id: Optional[int], team_id: Optional[int] = None):
        team_ref = f"El equipo {team_id}" if team_id is not None else "El equipo"
        player_region = f"la región {player_region_id}" if player_region_id is not None else "una región no definida"
        super().__init__(f"{team_ref} solo admite jugadores de la región {team_region_id} y el jugador tiene {player_region}", 400)
