from app.domain.specifications.base import Specification


class ByResolvedBySpecification(Specification):
    def __init__(self, resolved_by: str):
        self.resolved_by = resolved_by

    def to_expression(self):
        return self.resolved_by