from app.domain.exceptions.domain_exception import DomainException

class TeamWithoutRegionMustAllowOthersException(DomainException):
    def __init__(self):
        super().__init__("Un equipo sin región especificada debe permitir jugadores de otras regiones.", 400)
