from app.application.ports.i_unit_of_work import IUnitOfWork
from app.application.services.registration_token_service import RegistrationTokenService


class ResendRegistration:
    def __init__(self, uow: IUnitOfWork):
        self.uow = uow

    def execute(self, mail: str) -> tuple[str, str] | None:
        with self.uow as uow:
            if uow.user_repo.get_user_by_mail(mail) is not None:
                return None
            registration = uow.pending_registration_repo.get_by_mail(mail)
            if registration is None:
                return None
            raw_token = RegistrationTokenService.renew(registration)
            uow.pending_registration_repo.save(registration)
            return raw_token, registration.username
