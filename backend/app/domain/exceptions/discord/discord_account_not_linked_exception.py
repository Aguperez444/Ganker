from app.domain.exceptions.domain_exception import DomainException


class DiscordAccountNotLinkedException(DomainException):
    def __init__(self):
        super().__init__(
            message="No tenés una cuenta de Discord vinculada.",
            status_code=404
        )
