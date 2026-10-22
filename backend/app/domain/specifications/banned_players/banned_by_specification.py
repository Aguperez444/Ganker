from app.domain.specifications.base import Specification


class ByBannedBySpecification(Specification):
    def __init__(self, banned_by: str):
        self.banned_by: str = banned_by

    def to_expression(self):
        return self.banned_by