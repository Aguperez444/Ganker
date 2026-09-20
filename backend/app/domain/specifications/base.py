from abc import ABC, abstractmethod


class Specification(ABC):
    @abstractmethod
    def to_expression(self):
        pass

    def __and__(self, other: Specification) -> 'AndSpecification':
        return AndSpecification(self, other)


class AndSpecification(Specification):
    def __init__(self, left: Specification, right: Specification):
        self.left = left
        self.right = right

    def to_expression(self):
        return self.left.to_expression(), self.right.to_expression()
