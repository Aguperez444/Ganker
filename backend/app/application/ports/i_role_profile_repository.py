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