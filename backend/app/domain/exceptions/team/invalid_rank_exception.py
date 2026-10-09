from app.domain.exceptions.domain_exception import DomainException


class InvalidrankException(DomainException):
    """Raised when a role is already occupied in a team."""

    def __init__(self, team_id: int, rank_id: int, rank_value: int, min_value: int, max_value: int):
        super().__init__(f"El rango con ID {rank_id} no es válido para el equipo con ID {team_id}."
                         f" Valor: {rank_value}, Mínimo admitido: {min_value}, Máximo admitido: {max_value}", 400)
