from app.domain.exceptions.domain_exception import DomainException


class InvalidIdException(DomainException):
    def __init__(self, bad_id):
        super().__init__("El id de una clase solo puede ser un número entero positivo. Se recibió: {}".format(bad_id), 400)