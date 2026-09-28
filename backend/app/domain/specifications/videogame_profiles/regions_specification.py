from specifications.base import Specification


class ByRegionsSpecification(Specification):
    def __init__(self, regions: list[int]):
        self.regions = regions

    def to_expression(self):
        return self.regions