from app.domain.specifications.base import Specification


class ByNamePlayerSpecification(Specification):
    def __init__(self, name: str):
        self.name = name

    def to_expression(self):
        return self.name