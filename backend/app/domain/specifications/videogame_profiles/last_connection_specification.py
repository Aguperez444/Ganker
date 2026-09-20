from app.domain.specifications.base import Specification


class ByLastConnectionSpecification(Specification):
    def __init__(self, time: str):
        self.time = time

    def to_expression(self):
        return self.time