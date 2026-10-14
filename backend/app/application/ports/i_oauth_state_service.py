from abc import ABC, abstractmethod


class IOAuthStateService(ABC):
    """
    Genera y valida el parámetro 'state' de OAuth: ata la autorización al jugador que la pidió y vence
    a los pocos minutos, para que nadie pueda vincular su cuenta externa al perfil de otro (CSRF).
    """

    @abstractmethod
    def create_state(self, user_id: int) -> str:
        raise NotImplementedError

    @abstractmethod
    def validate_state(self, state: str, user_id: int) -> None:
        """Lanza InvalidOAuthStateException si el state no es válido, venció o es de otro usuario."""
        raise NotImplementedError
