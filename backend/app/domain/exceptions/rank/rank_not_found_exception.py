from app.domain.exceptions.domain_exception import DomainException


class RankNotFoundException(DomainException):
    def __init__(self, rank_id: int):
        super().__init__(
            message=f'El rango con id {rank_id} no fue encontrado.',
            status_code=404
        )