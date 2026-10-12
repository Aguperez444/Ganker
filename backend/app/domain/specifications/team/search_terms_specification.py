from app.domain.specifications.base import Specification


class BySearchTermsSpecification(Specification):
    def __init__(self, terms: str):
        self.terms = terms

    def to_expression(self):
        escaped = self.terms.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        pattern = f"%{escaped}%"
        return pattern
