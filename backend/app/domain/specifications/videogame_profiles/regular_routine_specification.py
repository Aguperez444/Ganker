from app.domain.specifications.base import Specification


class ByRegularRoutineSpecification(Specification):
    def __init__(self, time: str):
        self.time = time

    def to_expression(self):
        return self.time