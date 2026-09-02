from app.domain.exceptions.domain_exception import DomainException



class InvalidRankValueException(DomainException):
    def __init__(self, value: int):
        super().__init__(
            message=f'El valor de rango: "{value}" es inválido o usa caracteres inválidos, solo se permiten números positivos.',
            status_code=400
        )
