from abc import ABC, abstractmethod

from typing import TYPE_CHECKING, Optional

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
                     role_id: Optional[int] = None, search_term: Optional[str] = None) -> List['Team']:
        raise NotImplementedError

    @abstractmethod
    def is_user_in_any_active_team(self, user_id: int) -> bool:
        raise NotImplementedError
        
    @abstractmethod
    def create_team(self, team: 'Team') -> 'Team':
        raise NotImplementedError