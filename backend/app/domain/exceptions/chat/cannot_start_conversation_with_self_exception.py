from app.domain.exceptions.domain_exception import DomainException


class CannotStartConversationWithSelfException(DomainException, ValueError):
    def __init__(self, message: str = "No podés iniciar una conversación con vos mismo"):
        super().__init__(message=message, status_code=400)
