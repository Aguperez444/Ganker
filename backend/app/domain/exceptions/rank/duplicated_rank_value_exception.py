from app.domain.exceptions.domain_exception import DomainException



class DuplicatedRankValueException(DomainException):
    def __init__(self, value: int):
        super().__init__(
            message=f'El valor de rango: "{value}" ya existe.',
            status_code=409
        )
