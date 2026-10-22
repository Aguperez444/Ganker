from datetime import datetime
from typing import Optional

from app.domain.specifications.base import Specification


class ByCreateAtSpecification(Specification):
    def __init__ (self, min_date: Optional[datetime], end_date: Optional[datetime]):
        self.min_date = min_date
        self.end_date = end_date

    def to_expression(self):
        return self.min_date, self.end_date