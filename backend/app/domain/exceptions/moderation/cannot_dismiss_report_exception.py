from app.domain.exceptions.domain_exception import DomainException


class CannotDismissReportException(DomainException):
    def __init__(self):
        super().__init__(
            message="No tenés permisos para desestimar denuncias.",
            status_code=403,
        )
