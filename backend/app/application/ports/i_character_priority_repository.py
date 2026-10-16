from abc import ABC, abstractmethod
from datetime import datetime
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domain.models.character import Character


class ICharacterPriorityRepository(ABC):

    @abstractmethod
    def count_associated_to_character(self, character_id: int) -> int:
        """
        Cuenta la cantidad de asignaciones de prioridad asociadas a un personaje específico.
        """
        raise NotImplementedError

    @abstractmethod
    def delete_and_readjust_for_character(self, character_id: int) -> None:
        """
        Elimina las asociaciones del personaje en los perfiles de juego y reajusta
        las prioridades restantes de cada perfil para evitar huecos en la secuencia (1, 2, 3...).
        """
        raise NotImplementedError

    @abstractmethod
    def get_character_usage(
        self,
        videogame_id: Optional[int],
        start_date: Optional[datetime],
        end_date: Optional[datetime],
    ) -> list[tuple["Character", int]]:
        """
        Devuelve cada personaje junto con la cantidad de jugadores (perfiles de juego distintos) que
        lo seleccionaron, opcionalmente acotado a un videojuego y a un rango de fechas de creación de
        los perfiles. Si no se especifica videojuego, se consideran los personajes de todos los videojuegos.
        """
        raise NotImplementedError
