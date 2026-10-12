from app.domain.specifications.base import Specification


class ByRolesSpecification(Specification):
    def __init__(self, roles: list[int]):
        self.roles = roles

    def to_expression(self):
        return self.roles
