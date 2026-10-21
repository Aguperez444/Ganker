from app.domain.specifications.base import Specification


class ByStatusSpecification(Specification):
    def __init__(self, status: str):
        self.status = status

    def to_expression(self):
        return self.status