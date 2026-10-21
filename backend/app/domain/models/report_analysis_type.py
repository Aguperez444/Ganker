from enum import Enum
from typing import Optional


class ReportAnalysisType(str, Enum):
    """
    Tipos de análisis disponibles para los reportes de uso. Es la fuente única de verdad del set de
    valores válidos y de su metadata, para que generación, consulta y catálogo no se desincronicen.
    """

    RANKS = "ranks"
    CHARACTERS = "characters"
    TEAMS = "teams"

    @property
    def label(self) -> str:
        return {
            ReportAnalysisType.RANKS: "Distribución por rangos",
            ReportAnalysisType.CHARACTERS: "Personajes más utilizados",
            ReportAnalysisType.TEAMS: "Equipos por franja de rangos",
        }[self]

    @property
    def description(self) -> str:
        return {
            ReportAnalysisType.RANKS: "Perfiles distintos por rango sobre los perfiles vigentes del alcance. En el general se identifica el juego de cada rango.",
            ReportAnalysisType.CHARACTERS: "Perfiles distintos que eligieron cada personaje, identificando su juego en el alcance general.",
            ReportAnalysisType.TEAMS: "Equipos por franjas del rango mínimo en un juego; en el general, cantidad de equipos por videojuego.",
        }[self]

    @property
    def requires_rank_bands(self) -> bool:
        """Los equipos se agrupan por franjas de rangos definidas por el administrador; el resto no."""
        return self is ReportAnalysisType.TEAMS

    @property
    def noun(self) -> str:
        """Sustantivo en plural para redactar mensajes de falta de datos."""
        return {
            ReportAnalysisType.RANKS: "rangos",
            ReportAnalysisType.CHARACTERS: "personajes",
            ReportAnalysisType.TEAMS: "equipos",
        }[self]

    @classmethod
    def try_from_value(cls, value: Optional[str]) -> Optional["ReportAnalysisType"]:
        normalized = (value or "").strip().lower()
        for member in cls:
            if member.value == normalized:
                return member
        return None

    @classmethod
    def values(cls) -> tuple[str, ...]:
        return tuple(member.value for member in cls)

    def __str__(self) -> str:
        return self.value
