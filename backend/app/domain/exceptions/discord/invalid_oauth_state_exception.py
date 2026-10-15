from app.domain.exceptions.domain_exception import DomainException


class InvalidOAuthStateException(DomainException):
    """El 'state' de OAuth no es válido, venció o pertenece a otro usuario (protección contra CSRF)."""

    def __init__(self):
        super().__init__(
            message="La solicitud de conexión con Discord no es válida o venció. Volvé a intentarlo.",
            status_code=400
        )
