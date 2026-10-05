from app.domain.exceptions.domain_exception import DomainException


class CatalogItemVideogameMismatchException(DomainException):
    """Raised when a rank or a role does not belong to the videogame of the team."""

    def __init__(self, item_name: str, item_id: int, videogame_id: int):
        super().__init__(f"El {item_name} con id {item_id} no pertenece al videojuego con id {videogame_id}", 400)
