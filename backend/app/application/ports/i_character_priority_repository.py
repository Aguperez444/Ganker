from abc import ABC, abstractmethod


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
    def soft_delete_character(self, character_id: int) -> None:
        """
        Marca como eliminadas lógicamente las asociaciones del personaje
        """
        raise NotImplementedError

    @abstractmethod
    def soft_delete_by_game_profile_id(self, game_profile_id: int) -> int:
        """
        Marca como eliminadas lógicamente todas las asociaciones de prioridad de un perfil de juego.
        """
        raise NotImplementedError

    @abstractmethod
    def soft_delete_by_game_profile_ids(self, game_profile_ids: list[int]) -> int:
        """
        Marca como eliminadas lógicamente todas las asociaciones de prioridad de una lista de perfiles de juego.
        """
        raise NotImplementedError
