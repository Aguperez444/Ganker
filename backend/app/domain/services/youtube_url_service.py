import re
from urllib.parse import urlparse, parse_qs

from app.domain.exceptions.moderation.invalid_evidence_video_url_exception import InvalidEvidenceVideoUrlException

# Los IDs de video de YouTube tienen 11 caracteres: letras, números, "-" y "_"
VIDEO_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")
YOUTUBE_HOSTS = {"youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"}
SHORT_HOSTS = {"youtu.be", "www.youtu.be"}
PATH_PREFIXES = ("/shorts/", "/embed/", "/live/", "/v/")


class YoutubeUrlService:
    @staticmethod
    def normalize(url: str) -> str:
        """
        Valida un link de YouTube (watch, youtu.be, shorts, embed o live) y lo devuelve
        en formato canónico https://www.youtube.com/watch?v=ID.
        Lanza InvalidEvidenceVideoUrlException si no es un video de YouTube.
        """
        parsed = urlparse((url or "").strip())
        if parsed.scheme not in {"http", "https"}:
            raise InvalidEvidenceVideoUrlException()

        host = (parsed.hostname or "").lower()
        video_id = None
        if host in SHORT_HOSTS:
            video_id = parsed.path.strip("/").split("/")[0]
        elif host in YOUTUBE_HOSTS:
            if parsed.path == "/watch":
                video_id = parse_qs(parsed.query).get("v", [None])[0]
            else:
                for prefix in PATH_PREFIXES:
                    if parsed.path.startswith(prefix):
                        video_id = parsed.path.removeprefix(prefix).split("/")[0]
                        break

        if not video_id or not VIDEO_ID_PATTERN.match(video_id):
            raise InvalidEvidenceVideoUrlException()

        return f"https://www.youtube.com/watch?v={video_id}"
