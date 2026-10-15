from abc import ABC, abstractmethod


class IEmailService(ABC):

    @abstractmethod
    async def send_password_reset_email(self, to_email: str, raw_token: str) -> None:
        raise NotImplementedError