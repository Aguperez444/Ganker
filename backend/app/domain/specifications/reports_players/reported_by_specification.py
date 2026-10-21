from app.domain.specifications.base import Specification


class ByReportedBySpecification(Specification):
    def __init__(self, reported_by: str):
        self.reported_by = reported_by

    def to_expression(self):
        return self.reported_by