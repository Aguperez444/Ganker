from app.domain.exceptions.domain_exception import DomainException


class InvalidRankRangeException(DomainException):
    """Raised when the minimum rank of a team is greater than its maximum rank."""

    def __init__(self, min_rank_value: int, max_rank_value: int):
        super().__init__(f"El rango mínimo ({min_rank_value}) no puede ser superior al rango máximo ({max_rank_value})", 400)
