from app.domain.specifications.base import Specification


class ByCharactersSpecification(Specification):
    def __init__(self, characters: list[int]):
        self.characters = characters

    def to_expression(self):
        return self.characters