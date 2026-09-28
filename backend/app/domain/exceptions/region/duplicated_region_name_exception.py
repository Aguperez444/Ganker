from exceptions.domain_exception import DomainException


class DuplicatedRegionNameException(DomainException):

    def __init__(self, name:str):
        super().__init__(
            message=f'El nombre de la region: "{name}" ya existe.',
            status_code=409
        )