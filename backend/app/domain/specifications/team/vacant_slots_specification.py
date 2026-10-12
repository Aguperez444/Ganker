from app.domain.specifications.base import Specification

class ByVacantSlotsSpecification(Specification):
    def __init__(self, vacant_slots: int):
        self.vacant_slots = vacant_slots

    def to_expression(self):
        return self.vacant_slots