from app.domain.exceptions.domain_exception import DomainException


class EntityNotPersistedException(DomainException):
    def __init__(self, entity_name: str):
        super().__init__(f"Se está intentando acceder a una operación con la entidad:"
                         f" {entity_name} que todavía no está persistida.", 400)