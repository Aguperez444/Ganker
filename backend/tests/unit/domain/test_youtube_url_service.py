import pytest

from app.domain.exceptions.moderation.invalid_evidence_video_url_exception import InvalidEvidenceVideoUrlException
from app.domain.services.youtube_url_service import YoutubeUrlService

CANONICAL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"


@pytest.mark.parametrize("url", [
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "http://youtube.com/watch?v=dQw4w9WgXcQ&t=30s",
    "https://m.youtube.com/watch?feature=share&v=dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ?si=abc",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "https://www.youtube.com/live/dQw4w9WgXcQ",
    "  https://youtu.be/dQw4w9WgXcQ  ",
])
def test_normalize_accepts_youtube_formats(url):
    assert YoutubeUrlService.normalize(url) == CANONICAL


@pytest.mark.parametrize("url", [
    "",
    "dQw4w9WgXcQ",
    "ftp://youtube.com/watch?v=dQw4w9WgXcQ",
    "javascript:alert(1)",
    "https://vimeo.com/123456",
    "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ",
    "https://www.youtube.com/watch?v=corto",
    "https://www.youtube.com/channel/UC1234567890",
    "https://youtu.be/",
])
def test_normalize_rejects_invalid_links(url):
    with pytest.raises(InvalidEvidenceVideoUrlException) as exc_info:
        YoutubeUrlService.normalize(url)
    assert exc_info.value.status_code == 400
