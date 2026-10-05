from abc import ABC, abstractmethod

from typing import TYPE_CHECKING, Optional, List

if TYPE_CHECKING:
    from app.domain.models.team import Team


class ITeamRepository(ABC):

    @abstractmethod
    def get_by_id_for_update(self, team_id: int) -> Optional['Team']:
        """
        Obtiene un equipo por su ID con un bloqueo FOR UPDATE para evitar colisiones en entornos concurrentes.
        """
        raise NotImplementedError

    @abstractmethod
    def update_team_members(self, target_team: 'Team') -> 'Team':
        """
        Actualiza los miembros de un equipo.
        """
        raise NotImplementedError
        
    @abstractmethod
    def search_teams(self, videogame_id: Optional[int] = None, region_id: Optional[int] = None, 
                     rank_id: Optional[int] = None, vacant_slots: Optional[int] = None, 
                     role_id: Optional[int] = None, search_term: Optional[str] = None,
                     limit: Optional[int] = None, offset: int = 0) -> List['Team']:
        """Busca equipos activos con al menos una vacante, aplicando los filtros recibidos."""
        raise NotImplementedError

    @abstractmethod
    def get_by_id(self, team_id: int) -> Optional['Team']:
        raise NotImplementedError

    @abstractmethod
    def get_active_team_by_user_id(self, user_id: int) -> Optional['Team']:
        """Obtiene el equipo activo del que el usuario es miembro (None si no pertenece a ninguno)."""
        raise NotImplementedError

    @abstractmethod
    def is_user_in_any_active_team(self, user_id: int) -> bool:
        raise NotImplementedError
        
    @abstractmethod
    def create_team(self, team: 'Team') -> 'Team':
        raise NotImplementedError

    @abstractmethod
    def get_team_info_by_conversation_ids(self, conversation_ids: List[int]) -> dict[int, tuple[int, Optional[str]]]:
        """Devuelve un diccionario conversation_id -> (team_id, icon_url) para las conversaciones que pertenecen a un equipo."""
        raise NotImplementedError
