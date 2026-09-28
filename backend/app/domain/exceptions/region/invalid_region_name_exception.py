from exceptions.domain_exception import DomainException


class InvalidRegionNameException(DomainException):
    def __init__(self,name:str):
        super().__init__(
            message= f'El nombre de la region: "{name}" es inválido o usa caracteres inválidos.',
            status_code=400
        )