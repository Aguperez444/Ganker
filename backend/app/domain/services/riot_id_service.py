import re

from app.domain.exceptions.riot.invalid_riot_id_exception import InvalidRiotIdException

# Riot ID = nombre de juego (3 a 16 caracteres) + "#" + tag (3 a 5 letras o números)
RIOT_ID_PATTERN = re.compile(r"^(?P<game_name>[^#]{3,16})#(?P<tag_line>[A-Za-z0-9]{3,5})$")


class RiotIdService:
    @staticmethod
    def parse(riot_id: str) -> tuple[str, str]:
        """Separa un Riot ID 'Nombre#TAG' en (nombre, tag). Lanza InvalidRiotIdException si no tiene ese formato."""
        cleaned = (riot_id or "").strip()
        match = RIOT_ID_PATTERN.match(cleaned)
        if not match or not match.group("game_name").strip():
            raise InvalidRiotIdException(cleaned)
        return match.group("game_name").strip(), match.group("tag_line")
