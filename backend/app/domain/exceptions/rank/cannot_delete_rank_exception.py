from app.domain.exceptions.domain_exception import DomainException

class CannotDeleteRankException(DomainException):
    def __init__(self, rank_id: int):
        super().__init__(message=f'No es posible eliminar el rango con id {rank_id} porque tiene perfiles asociados'
                                 f' y no existe otro rango en el videojuego para reasignarlos.', status_code=400)