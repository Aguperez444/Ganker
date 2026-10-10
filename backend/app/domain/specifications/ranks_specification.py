from app.domain.specifications.base import Specification


class ByRanksSpecification(Specification):
    def __init__(self, ranks: list[int]):
        self.ranks = ranks

    def to_expression(self):
        return self.ranks