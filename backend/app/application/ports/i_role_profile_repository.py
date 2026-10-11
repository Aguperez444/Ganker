from abc import ABC, abstractmethod


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