from app.domain.specifications.base import Specification


class ByBannedUsersSpecification(Specification):
    def __init__(self, banned_user_id: str):
        self.banned_user_id: str = banned_user_id

    def to_expression(self):
        return self.banned_user_id