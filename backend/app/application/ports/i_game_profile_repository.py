from abc import abstractmethod, ABC
from datetime import datetime
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.game_profile import GameProfile
    from app.domain.models.videogame import Videogame

class IGameProfileRepository(ABC):

    @abstractmethod
    def create_game_profile(self, game_profile: 'GameProfile') -> 'GameProfile':
        raise NotImplementedError

    @abstractmethod
    def get_game_profile_by_id(self, game_profile_id: int) -> Optional['GameProfile']:
        raise NotImplementedError

    @abstractmethod
    def get_game_profile_by_player_and_videogame(self, player_id: int, videogame_id: int) -> Optional['GameProfile']:
        raise NotImplementedError

    @abstractmethod
    def update_game_profile(self, game_profile: 'GameProfile') -> 'GameProfile':
        raise NotImplementedError

    @abstractmethod
    def disassociate_region(self, region_id: int) -> None:
        raise NotImplementedError

    @abstractmethod
    def delete_game_profile(self, game_profile_id: int) -> bool:
        """
        Elimina un perfil de juego por su ID.
        """
        raise NotImplementedError

    @abstractmethod
    def soft_delete_game_profile(self, game_profile_id: int) -> bool:
        """
        Marca como eliminado lógicamente un perfil de juego por su ID.
        """
        raise NotImplementedError

    @abstractmethod
    def soft_delete_by_player_id(self, player_id: int) -> list[int]:
        """
        Marca como eliminados lógicamente todos los perfiles de juego de un jugador y retorna sus IDs.
        """
        raise NotImplementedError

    @abstractmethod
    def soft_delete_by_videogame_id(self, videogame_id: int) -> list[int]:
        """
        Marca como eliminados lógicamente todos los perfiles de juego de un videojuego y retorna sus IDs.
        """
        raise NotImplementedError

    def get_by_user_id_and_game_id(self, user_id, game_id):
        """
        Obtiene un perfil de juego por el ID del usuario asignado y el id del juego asignado.
        """
        raise NotImplementedError

    @abstractmethod
    def get_profile_counts_by_videogame(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> list[tuple['Videogame', int]]:
        """
        Devuelve cada videojuego registrado junto con la cantidad de perfiles de jugador asociados,
        opcionalmente acotado a un rango de fechas de creación de los perfiles.
        Los videojuegos sin perfiles se incluyen con cantidad 0.
        """
        raise NotImplementedError