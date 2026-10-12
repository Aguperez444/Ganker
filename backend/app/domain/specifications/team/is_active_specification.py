from app.domain.specifications.base import Specification

class ByIsActiveSpecification(Specification):
    def __init__(self, is_active: bool):
        self.is_active = is_active

    def to_expression(self):
        return self.is_active