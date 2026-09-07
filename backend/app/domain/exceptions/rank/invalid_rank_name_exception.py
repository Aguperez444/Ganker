from app.domain.exceptions.domain_exception import DomainException



class InvalidRankNameException(DomainException):
    def __init__(self, name: str):
        super().__init__(
            message=f'El nombre de rango: "{name}" es inválido o usa caracteres inválidos.',
            status_code=400
        )
