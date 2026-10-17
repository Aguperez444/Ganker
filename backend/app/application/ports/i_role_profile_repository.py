from abc import ABC, abstractmethod
from datetime import datetime
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.rank import Rank


class IRoleProfileRepository(ABC):

    @abstractmethod
    def reassign_associated_to_rank(self, source_rank_id: int, target_rank_id: int) -> int:
        """
        Reasigna todos los perfiles de rol de un perfil de juego que estén asociados a un rango X a otro rango Y.
        """
        raise NotImplementedError


    @abstractmethod
    def count_associated_to_rank(self, rank_id: int) -> int:
        """
        Cuenta la cantidad de perfiles de rol asociados a un rango específico.
        """
        raise NotImplementedError

    @abstractmethod
    def count_associated_to_role(self, role_id: int) -> int:
        """
        Cuenta la cantidad de perfiles de rol asociados a un rol específico.
        """
        raise NotImplementedError

    @abstractmethod
    def delete_by_role_id(self, role_id: int) -> list[int]:
        """
        Elimina todos los perfiles de rol asociados a un rol específico y retorna
        la lista de IDs de perfiles de juego afectados.
        """
        raise NotImplementedError

    @abstractmethod
    def count_by_game_profile_id(self, game_profile_id: int) -> int:
        """
        Cuenta la cantidad de perfiles de rol asociados a un perfil de juego específico.
        """
        raise NotImplementedError

    @abstractmethod
    def get_rank_usage(
        self,
        videogame_id: Optional[int],
        start_date: Optional[datetime],
        end_date: Optional[datetime],
    ) -> list[tuple["Rank", int]]:
        """
        Devuelve cada rango junto con la cantidad de jugadores (perfiles de juego distintos) que lo
        tienen asignado, opcionalmente acotado a un videojuego y a un rango de fechas de creación de
        los perfiles. Si no se especifica videojuego, se consideran los rangos de todos los videojuegos.
        """
        raise NotImplementedError


    @abstractmethod
    def soft_delete_by_role_id(self, role_id: int) -> list[int]:
        """
        Marca como eliminados lógicamente todos los perfiles de rol asociados a un rol específico
        y retorna la lista de IDs de perfiles de juego afectados.
        """
        raise NotImplementedError

    @abstractmethod
    def soft_delete_by_game_profile_id(self, game_profile_id: int) -> int:
        """
        Marca como eliminados lógicamente todos los perfiles de rol asociados a un perfil de juego.
        """
        raise NotImplementedError

    @abstractmethod
    def soft_delete_by_game_profile_ids(self, game_profile_ids: list[int]) -> int:
        """
        Marca como eliminados lógicamente todos los perfiles de rol asociados a una lista de perfiles de juego.
        """
        raise NotImplementedError