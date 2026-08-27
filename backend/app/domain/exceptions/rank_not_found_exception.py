from exceptions.domain_exception import DomainException


class RankNotFoundException(DomainException):
    def __init__(self, rank_id: int):
        super().__init__(
            message=f'The rank with id {rank_id} not found.',
            status_code=404
        )