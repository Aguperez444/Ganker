from app.domain.exceptions.domain_exception import DomainException


class InsufficientHierarchyToResolveBanAppealException(DomainException):
    def __init__(self):
        super().__init__(
            message="No tenés permisos sobre un usuario de igual o mayor jerarquía.",
            status_code=403,
        )
