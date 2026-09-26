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
