from app.domain.exceptions.domain_exception import DomainException


class InvalidRiotIdException(DomainException):
    def __init__(self, riot_id: str):
        super().__init__(
            message=f"'{riot_id}' no es un Riot ID válido. Tiene que tener la forma Nombre#TAG (por ejemplo, Faker#KR1).",
            status_code=400
        )
