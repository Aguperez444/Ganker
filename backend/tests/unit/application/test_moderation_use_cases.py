from datetime import datetime, timedelta
from unittest.mock import MagicMock
import pytest

from app.application.use_cases.ban_player import BanPlayer
from app.application.use_cases.forgot_password import ForgotPassword
from app.application.use_cases.get_or_create_conversation import GetOrCreateConversation
from app.application.use_cases.query_discord_account import QueryDiscordAccount
from app.application.use_cases.query_users import QueryUsers
from app.application.use_cases.refresh_token import RefreshToken
from app.application.use_cases.report_player import ReportPlayer
from app.application.use_cases.search_banned_players import SearchBannedPlayers
from app.application.use_cases.search_reports_players import SearchReportsPlayers
from app.application.use_cases.unban_player import UnbanPlayer
from app.application.use_cases.user_login import UserLogin
from app.domain.exceptions.moderation.ban_not_finished_exception import BanNotFinishedException
from app.domain.exceptions.moderation.not_banned_player_exception import NotBannedPlayerException
from app.domain.exceptions.moderation.cannot_ban_self_exception import CannotBanSelfException
from app.domain.exceptions.moderation.cannot_report_self_exception import CannotReportSelfException
from app.domain.exceptions.moderation.cannot_unban_self_exception import CannotUnbanSelfException
from app.domain.exceptions.moderation.not_valid_report_reason_exception import NotValidReportReasonException
from app.domain.exceptions.user.user_not_found_exception import UserNotFoundException
from app.domain.models.user import User
from app.domain.models.user_role import UserRole
from app.domain.services.catalog_validation_service import CatalogValidationService
from app.domain.specifications.base import AndSpecification
from app.infrastructure.api.dto.request.ban_player_request import BanPlayerRequest
from app.infrastructure.api.dto.request.login_request import LoginRequest
from app.infrastructure.api.dto.request.report_player_request import ReportPlayerRequest
from app.infrastructure.database.models.player_report_orm import PlayerReportORM, ReportReason, ReportStatus


def _make_mock_uow():
    uow = MagicMock()
    uow.__enter__.return_value = uow
    uow.__exit__.return_value = None
    return uow


def _make_domain_user(
    user_id: int = 1,
    username: str = "player1",
    name: str = "Player One",
    mail: str = "player1@example.com",
    role: UserRole = UserRole.PLAYER,
    banned: bool = False,
    deleted: bool = False,
) -> User:
    return User(
        user_id=user_id,
        username=username,
        name=name,
        mail=mail,
        password_hash="hashed_pw",
        role=role,
        profiles=[],
        icon_url="/media/users/icons/default.png",
        last_connection=datetime.now(),
        deleted=deleted,
        banned=banned,
    )


class TestReportPlayerUseCaseUnit:

    def test_report_player_success(self):
        uow = _make_mock_uow()
        reporter = _make_domain_user(user_id=1, username="reporter")
        reported = _make_domain_user(user_id=2, username="reported")

        uow.user_repo.get_user_by_id.side_effect = lambda uid: reporter if uid == 1 else reported

        persisted_report = PlayerReportORM(
            id=10,
            reporter_id=1,
            reported_id=2,
            status=ReportStatus.PENDING,
            reason=ReportReason.CHEATING,
            description="Uso de aimbot en partida competitiva",
            create_at=datetime.now(),
        )
        uow.moderation_repo.report_player.return_value = persisted_report

        request = ReportPlayerRequest(
            reported_id=2,
            reason=ReportReason.CHEATING,
            description="Uso de aimbot en partida competitiva",
        )

        use_case = ReportPlayer(uow)
        response = use_case.execute(request, reporter_id=1)

        assert response.report_id == 10
        assert response.reporter_id == 1
        assert response.reported_id == 2
        assert response.reason == ReportReason.CHEATING.value
        assert response.status == ReportStatus.PENDING.value
        uow.moderation_repo.report_player.assert_called_once()

    def test_report_player_self_report_raises_400(self):
        uow = _make_mock_uow()
        user = _make_domain_user(user_id=5, username="sameuser")
        uow.user_repo.get_user_by_id.return_value = user

        request = ReportPlayerRequest(
            reported_id=5,
            reason=ReportReason.SPAMMING,
            description="Auto reporte no permitido",
        )

        use_case = ReportPlayer(uow)
        with pytest.raises(CannotReportSelfException) as exc_info:
            use_case.execute(request, reporter_id=5)

        assert exc_info.value.status_code == 400
        uow.moderation_repo.report_player.assert_not_called()

    @pytest.mark.parametrize(
        "valid_reason",
        [
            ReportReason.CHEATING,
            ReportReason.ABUSIVE_BEHAVIOR,
            ReportReason.SPAMMING,
            ReportReason.INAPPROPRIATE_CONTENT,
            ReportReason.OTHER,
        ],
    )
    def test_report_player_validates_all_enum_reasons(self, valid_reason):
        CatalogValidationService.validate_reason_is_valid_for_report(valid_reason.value)

    @pytest.mark.parametrize("invalid_reason", ["invalid_reason", "hacking", "griefing", ""])
    def test_report_player_invalid_reason_raises_not_valid_reason_exception(self, invalid_reason):
        with pytest.raises(NotValidReportReasonException) as exc_info:
            CatalogValidationService.validate_reason_is_valid_for_report(invalid_reason)

        assert exc_info.value.status_code == 400

    def test_report_player_use_case_rejects_unvalidated_invalid_reason(self):
        uow = _make_mock_uow()
        reporter = _make_domain_user(user_id=1, username="reporter")
        reported = _make_domain_user(user_id=2, username="reported")
        uow.user_repo.get_user_by_id.side_effect = lambda uid: reporter if uid == 1 else reported

        raw_request = MagicMock()
        raw_request.reported_id = 2
        raw_request.reason = "razon_inexistente"
        raw_request.description = "Descripción"

        use_case = ReportPlayer(uow)
        with pytest.raises(NotValidReportReasonException) as exc_info:
            use_case.execute(raw_request, reporter_id=1)

        assert exc_info.value.status_code == 400
        uow.moderation_repo.report_player.assert_not_called()


class TestBanAndUnbanUseCasesUnit:

    def test_ban_player_by_admin_success(self):
        uow = _make_mock_uow()
        admin = _make_domain_user(user_id=1, username="admin", role=UserRole.ADMIN)
        target = _make_domain_user(user_id=2, username="toxicplayer", role=UserRole.PLAYER)
        uow.user_repo.get_user_by_id.side_effect = lambda uid: admin if uid == 1 else target

        request = BanPlayerRequest(
            player_id=2,
            reason="Comportamiento abusivo reiterado",
            duration_days=7,
        )

        use_case = BanPlayer(uow)
        use_case.execute(request, admin_id=1)

        uow.moderation_repo.ban_user.assert_called_once()
        called_player_id, called_admin_id, called_register = uow.moderation_repo.ban_user.call_args[0]
        assert called_player_id == 2
        assert called_admin_id == 1
        assert called_register.banned_user == 2
        assert called_register.banned_by == 1
        assert called_register.reason == "Comportamiento abusivo reiterado"
        assert called_register.expires_at > datetime.now() + timedelta(days=6)

    def test_ban_player_self_ban_raises_400(self):
        uow = _make_mock_uow()
        admin = _make_domain_user(user_id=1, username="admin", role=UserRole.ADMIN)
        uow.user_repo.get_user_by_id.return_value = admin

        request = BanPlayerRequest(player_id=1, reason="Auto baneo", duration_days=3)
        use_case = BanPlayer(uow)

        with pytest.raises(CannotBanSelfException) as exc_info:
            use_case.execute(request, admin_id=1)

        assert exc_info.value.status_code == 400
        uow.moderation_repo.ban_user.assert_not_called()

    def test_unban_player_success(self):
        uow = _make_mock_uow()
        admin = _make_domain_user(user_id=1, username="admin", role=UserRole.ADMIN)
        target = _make_domain_user(user_id=2, username="bannedplayer", banned=True)
        uow.user_repo.get_user_by_id.side_effect = lambda uid: admin if uid == 1 else target

        use_case = UnbanPlayer(uow)
        use_case.execute(player_id=2, admin_id=1)

        uow.moderation_repo.manual_unban_user.assert_called_once_with(2)

    def test_unban_player_self_unban_raises_403(self):
        uow = _make_mock_uow()
        admin = _make_domain_user(user_id=1, username="admin", role=UserRole.ADMIN)
        uow.user_repo.get_user_by_id.return_value = admin

        use_case = UnbanPlayer(uow)
        with pytest.raises(CannotUnbanSelfException) as exc_info:
            use_case.execute(player_id=1, admin_id=1)

        assert exc_info.value.status_code == 403
        uow.moderation_repo.manual_unban_user.assert_not_called()


class TestSearchBannedAndReportedPlayersUnit:

    def test_search_banned_players_builds_combined_specifications(self):
        uow = _make_mock_uow()
        now = datetime.now()
        exp = now + timedelta(days=5)

        mock_record = MagicMock()
        mock_record.id = 1
        mock_record.moderator_banned_player.username = "admin_mod"
        mock_record.banned_player.username = "cheater_user"
        mock_record.create_at = now
        mock_record.expires_at = exp
        mock_record.reason = "cheating"
        uow.find_by_specification_repo.get_banned_players.return_value = [mock_record]

        use_case = SearchBannedPlayers(uow)
        results = use_case.execute(
            banned_by="admin_mod",
            banned_user="cheater_user",
            min_date_create=now - timedelta(days=1),
            max_date_create=now + timedelta(days=1),
            min_date_expire=now,
            max_date_expire=exp + timedelta(days=1),
            reason="cheating",
            skip=0,
            limit=10,
        )

        assert len(results) == 1
        assert results[0].banned_by == "admin_mod"
        assert results[0].banned_user == "cheater_user"
        assert results[0].reason == "cheating"

        spec_arg, skip_arg, limit_arg = uow.find_by_specification_repo.get_banned_players.call_args[0]
        assert isinstance(spec_arg, AndSpecification)
        assert skip_arg == 0
        assert limit_arg == 10

    def test_search_reports_players_builds_combined_specifications(self):
        uow = _make_mock_uow()
        now = datetime.now()

        mock_report = MagicMock()
        mock_report.id = 7
        mock_report.reported.username = "reported_guy"
        mock_report.reporter.username = "reporter_guy"
        mock_report.status = "resolved"
        mock_report.reason = "spamming"
        mock_report.description = "Spam en chat"
        mock_report.create_at = now
        mock_report.resolved_at = now
        mock_report.resolver_player.username = "admin_mod"
        uow.find_by_specification_repo.get_reports_players.return_value = [mock_report]

        use_case = SearchReportsPlayers(uow)
        results = use_case.execute(
            reported_by="reporter_guy",
            reported_user="reported_guy",
            status="resolved",
            reason="spamming",
            resolved_by="admin_mod",
            min_create_date=now - timedelta(days=1),
            max_create_date=now + timedelta(days=1),
            skip=0,
            limit=5,
        )

        assert len(results) == 1
        assert results[0].reported_name == "reported_guy"
        assert results[0].reporter_name == "reporter_guy"
        assert results[0].resolver_id == "admin_mod"


class TestSecurityAndExclusionUnit:

    def test_user_login_blocks_banned_user(self):
        uow = _make_mock_uow()
        banned_user = _make_domain_user(user_id=9, mail="banned@example.com", banned=True)
        uow.user_repo.get_user_by_mail.return_value = banned_user
        uow.moderation_repo.unban_user_if_applicable.side_effect = BanNotFinishedException()

        token_service = MagicMock()
        password_hasher = MagicMock()
        password_hasher.verify_password.return_value = True

        use_case = UserLogin(uow=uow, token_service=token_service, password_hasher=password_hasher)
        with pytest.raises(BanNotFinishedException) as exc_info:
            use_case.execute(LoginRequest(mail="banned@example.com", password="Password123"))

        assert exc_info.value.status_code == 400
        token_service.generate_tokens.assert_not_called()

    def test_refresh_token_blocks_banned_user(self):
        uow = _make_mock_uow()
        banned_user = _make_domain_user(user_id=9, mail="banned@example.com", banned=True)
        uow.refresh_token_repo.is_valid.return_value = True
        uow.user_repo.get_user_by_id.return_value = banned_user
        uow.moderation_repo.unban_user_if_applicable.side_effect = BanNotFinishedException()

        token_service = MagicMock()
        token_service.verify_refresh_token.return_value = {"user_id": 9, "jti": "jti-123"}

        use_case = RefreshToken(uow=uow, token_service=token_service)
        with pytest.raises(BanNotFinishedException) as exc_info:
            use_case.execute("valid_refresh_token")

        assert exc_info.value.status_code == 400
        token_service.generate_tokens.assert_not_called()

    def test_query_users_excludes_banned_user_from_public_and_by_id(self):
        uow = _make_mock_uow()
        banned_user = _make_domain_user(user_id=9, banned=True)
        uow.user_repo.get_user_by_id.return_value = banned_user

        use_case = QueryUsers(uow)
        with pytest.raises(UserNotFoundException):
            use_case.get_public_profile(9)

        with pytest.raises(UserNotFoundException):
            use_case.get_by_id(9)

    def test_get_or_create_conversation_excludes_banned_target(self):
        uow = _make_mock_uow()
        active_user = _make_domain_user(user_id=1, banned=False)
        banned_user = _make_domain_user(user_id=2, banned=True)
        uow.user_repo.get_user_by_id.side_effect = lambda uid: active_user if uid == 1 else banned_user

        use_case = GetOrCreateConversation(uow)
        with pytest.raises(UserNotFoundException):
            use_case.execute(current_user_id=1, target_user_id=2)

    def test_query_discord_account_excludes_banned_owner(self):
        uow = _make_mock_uow()
        banned_owner = _make_domain_user(user_id=2, banned=True)
        uow.user_repo.get_user_by_id.return_value = banned_owner

        use_case = QueryDiscordAccount(uow)
        with pytest.raises(UserNotFoundException):
            use_case.execute(owner_id=2, viewer_id=1)

    def test_forgot_password_returns_none_for_banned_user(self):
        uow = _make_mock_uow()
        banned_user = _make_domain_user(user_id=2, mail="banned@example.com", banned=True)
        uow.user_repo.get_user_by_mail.return_value = banned_user

        use_case = ForgotPassword(uow)
        result = use_case.execute("banned@example.com")

        assert result is None
        uow.reset_token_repo.create.assert_not_called()
