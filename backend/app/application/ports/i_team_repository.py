from abc import ABC, abstractmethod

from datetime import datetime
from typing import TYPE_CHECKING, Optional, List

if TYPE_CHECKING:
    from app.domain.models.team import Team
    from app.domain.models.rank import Rank


class ITeamRepository(ABC):

    @abstractmethod
    def count_associated_to_rank(self, rank_id: int) -> int:
        """Cuenta equipos activos e inactivos que usan el rango como mínimo o máximo."""
        raise NotImplementedError

    @abstractmethod
    def reassign_associated_to_rank(self, source_rank_id: int, target_rank_id: int) -> int:
        """Reasigna los límites que usan el rango, incluidos los de equipos inactivos."""
        raise NotImplementedError

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
    def update_team(self, team: 'Team') -> 'Team':
        """
        Actualiza los datos básicos y requisitos de un equipo.
        """
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
    def delete_team(self, target_team: 'Team') -> None:
        """
        Persiste la disolución y eliminación de un equipo
        desvinculando a todos los miembros y vaciando los miembros de la conversación asociada.
        """
        raise NotImplementedError

    @abstractmethod
    def deactivate_team(self, target_team: 'Team') -> 'Team':
        """
        Marca un equipo como inactivo en la base de datos sin alterar a sus miembros ni la conversación.
        """
        raise NotImplementedError

    @abstractmethod
    def get_team_info_by_conversation_ids(self, conversation_ids: List[int]) -> dict[int, tuple[int, Optional[str]]]:
        """Devuelve un diccionario conversation_id -> (team_id, icon_url) para las conversaciones que pertenecen a un equipo."""
        raise NotImplementedError

    @abstractmethod
    def get_team_counts_by_min_rank(
        self,
        videogame_id: Optional[int],
        start_date: Optional[datetime],
        end_date: Optional[datetime],
    ) -> list[tuple["Rank", int]]:
        """
        Devuelve cada rango mínimo de equipo del videojuego junto con la cantidad de equipos registrados
        en esa franja, opcionalmente acotado a un rango de fechas de creación de los equipos.
        """
        raise NotImplementedError
