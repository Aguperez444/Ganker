from abc import ABC, abstractmethod
from datetime import datetime


class IModerationStatisticsRepository(ABC):
    @abstractmethod
    def query(self, start: datetime | None, end: datetime | None, as_of: datetime, ranking_limit: int) -> dict:
        """Agregados de denuncias, sanciones y apelaciones para el informe ejecutivo."""
        raise NotImplementedError
