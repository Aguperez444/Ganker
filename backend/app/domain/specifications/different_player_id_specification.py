from app.domain.specifications.base import Specification


class ByDifferentPlayerIDSpecification(Specification):
    def __init__(self, player_id: int):
        self.player_id = player_id

    def to_expression(self):
        return self.player_id