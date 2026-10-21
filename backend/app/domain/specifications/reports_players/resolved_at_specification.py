from datetime import datetime
from typing import Optional

from app.domain.specifications.base import Specification



class ByResolvedAtSpecification(Specification):
    def __init__(self, min_date: Optional[datetime], max_date: Optional[datetime]):
        self.min_date = min_date
        self.max_date = max_date

    def to_expression(self):
        return self.min_date, self.max_date