from datetime import datetime, timedelta
from app.domain.specifications.base import Specification


class ByLastConnectionSpecification(Specification):
    def __init__(self, days: int = 4):
        self.days = days

    def to_expression(self):
        return datetime.now() - datetime.timedelta(days=self.days)  # Filtra jugadores que se conectaron en los últimos self.days días
