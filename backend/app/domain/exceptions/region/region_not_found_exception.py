from app.domain.exceptions.domain_exception import DomainException


class RegionNotFoundException(DomainException):
    def __init__(self, region_id: int):
        super().__init__(
            message=f'Region con el id {region_id} no encontrada.',
            status_code=404
        )