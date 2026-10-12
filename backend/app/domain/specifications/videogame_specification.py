from app.domain.specifications.base import Specification


class ByVideogameSpecification(Specification):
    def __init__(self, videogame: int):
        self.videogame = videogame

    def to_expression(self):
        return self.videogame