class CatalogCharacter:
    """
    Personaje tal como lo publica un catálogo externo (ej. la API de Riot Games).
    Todavía no es un Character del sistema: solo tiene el nombre y desde dónde
    se puede descargar su ícono.
    """

    def __init__(self, name: str, icon_source: str):
        self._name: str = name
        self._icon_source: str = icon_source

    @property
    def name(self) -> str:
        return self._name

    @property
    def icon_source(self) -> str:
        return self._icon_source

    def __repr__(self) -> str:
        return f"CatalogCharacter(name='{self.name}', icon_source='{self.icon_source}')"
