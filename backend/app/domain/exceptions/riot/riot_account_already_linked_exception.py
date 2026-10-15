from app.domain.exceptions.domain_exception import DomainException


class RiotAccountAlreadyLinkedException(DomainException):
    def __init__(self, riot_id: str):
        super().__init__(
            message=f"La cuenta de Riot '{riot_id}' ya está vinculada a otro perfil de Ganker.",
            status_code=409
        )
