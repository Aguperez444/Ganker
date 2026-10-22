import time
from collections import defaultdict
from threading import Lock
from fastapi import Request
from app.domain.exceptions.auth.rate_limit_exceeded_exception import RateLimitExceededException
from app.infrastructure.config.settings import settings


class AuthRateLimiter:
    """
    Clase para limitar la cantidad de intentos de inicio de sesión o recuperación de
    contraseña por IP y por identificador (email). Se utiliza un diccionario en memoria
    para almacenar los intentos recientes y se limpia automáticamente de acuerdo a la
    ventana de tiempo configurada. Se puede configurar el prefijo de configuración para
    distintos tipos de intentos (login, forgot_password, etc.).
    Por defecto, si no se pasan parámetros se configura para login.
    """
    def __init__(self, settings_prefix: str = "login", detail: str | None = None):
        # key -> list of float timestamps
        self._attempts: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()
        self._settings_prefix = settings_prefix
        self._detail = detail or "Demasiados intentos de inicio de sesión. Por favor, intente nuevamente más tarde."

    def reset(self) -> None:
        """Limpia el historial de intentos en memoria (útil para pruebas o desbloqueos)."""
        with self._lock:
            self._attempts.clear()

    @staticmethod
    def get_client_ip(request: Request) -> str:
        # Uvicorn resuelve X-Forwarded-For únicamente para los proxies permitidos
        # por FORWARDED_ALLOW_IPS. No volver a interpretar headers del cliente.
        return request.client.host if request.client else "unknown"

    def check(self, request: Request, identifier: str | None = None) -> None:
        """
        Verifica y registra intentos de inicio de sesión por IP y por identificador (email).
        Lanza RateLimitExceededException si se supera el límite de intentos en la ventana de tiempo.
        """
        if not getattr(settings, f"{self._settings_prefix}_rate_limit_enabled"):
            return

        with self._lock:
            self._check_and_record(request, identifier)

    def _check_and_record(self, request: Request, identifier: str | None) -> None:
        now = time.monotonic()
        max_attempts = getattr(settings, f"{self._settings_prefix}_rate_limit_max_attempts")
        window = getattr(settings, f"{self._settings_prefix}_rate_limit_window_seconds")

        # Evitar retener indefinidamente IPs y correos fuera de la ventana.
        self._attempts = defaultdict(list, {
            key: timestamps for key, timestamps in self._attempts.items()
            if timestamps and now - timestamps[-1] < window
        })

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
            raise RateLimitExceededException(
                message=self._detail,
                retry_after=max(1, retry_after)
            )

        # Si no superó el límite, registrar este intento
        for key in keys_to_check:
            self._attempts[key].append(now)


login_rate_limiter = AuthRateLimiter()
forgot_password_rate_limiter = AuthRateLimiter(
    settings_prefix="forgot_password",
    detail="Demasiadas solicitudes de recuperación. Por favor, intente nuevamente más tarde.",
)
