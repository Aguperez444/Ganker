from app.domain.specifications.base import Specification


class ByReasonSpecification(Specification):
    def __init__(self, reason: str):
        self.reason = reason

    def to_expression(self):
        return self.reason