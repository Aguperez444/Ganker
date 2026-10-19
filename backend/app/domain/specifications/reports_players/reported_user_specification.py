from app.domain.specifications.base import Specification


class ByReportedUserSpecification(Specification):
    def __init__(self, reported_user: str):
        self.reported_user = reported_user

    def to_expression(self):
        return self.reported_user