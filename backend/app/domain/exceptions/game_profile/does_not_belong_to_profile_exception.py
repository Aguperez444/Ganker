from app.domain.exceptions.domain_exception import DomainException



class DoesNotBelongToProfileException(DomainException):
    def __init__(self, item: str, name: str):
        super().__init__(
            message=f'El {item} con nombre o id {name} no pertenece al perfil.',
            status_code=400
        )