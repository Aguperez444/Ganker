import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from app.infrastructure.config.settings import settings


class LoginRateLimiter:
    def __init__(self):
        # key -> list of float timestamps
        self._attempts: dict[str, list[float]] = defaultdict(list)

    def reset(self) -> None:
        """Limpia el historial de intentos en memoria (útil para pruebas o desbloqueos)."""
        self._attempts.clear()

    @staticmethod
    def get_client_ip(request: Request) -> str:
        cf_ip = request.headers.get("cf-connecting-ip")
        if cf_ip and cf_ip.strip():
            return cf_ip.strip()
        real_ip = request.headers.get("x-real-ip")
        if real_ip and real_ip.strip():
            return real_ip.strip()
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def check(self, request: Request, identifier: str | None = None) -> None:
        """
        Verifica y registra intentos de inicio de sesión por IP y por identificador (email).
        Lanza HTTPException 429 si se supera el límite de intentos en la ventana de tiempo.
        """
        if not settings.login_rate_limit_enabled:
            return

        now = time.time()
        max_attempts = settings.login_rate_limit_max_attempts
        window = settings.login_rate_limit_window_seconds

        client_ip = self.get_client_ip(request)
        keys_to_check = [f"ip:{client_ip}"]
        if identifier:
            clean_identifier = identifier.strip().lower()
            if clean_identifier:
                keys_to_check.append(f"id:{clean_identifier}")

        retry_after = 0
        limit_exceeded = False

        for key in keys_to_check:
            # Filtrar marcas de tiempo dentro de la ventana móvil
            valid_timestamps = [t for t in self._attempts[key] if now - t < window]
            self._attempts[key] = valid_timestamps

            if len(valid_timestamps) >= max_attempts:
                limit_exceeded = True
                wait_time = int(valid_timestamps[0] + window - now) + 1
                if wait_time > retry_after:
                    retry_after = wait_time

        if limit_exceeded:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Demasiados intentos de inicio de sesión. Por favor, intente nuevamente más tarde.",
                headers={"Retry-After": str(max(1, retry_after))}
            )

        # Si no superó el límite, registrar este intento
        for key in keys_to_check:
            self._attempts[key].append(now)


login_rate_limiter = LoginRateLimiter()
