from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile

from app.application.use_cases.create_ban_appeal import CreateBanAppeal, MAX_APPEAL_TEXT_LENGTH
from app.application.use_cases.query_ban_appeals import QueryBanAppeals
from app.application.use_cases.resolve_ban_appeal import ResolveBanAppeal
from app.domain.models.ban_appeal import BanAppealStatus
from app.infrastructure.api.auth.jwt_ban_appeal_token_service import JwtBanAppealTokenService
from app.infrastructure.api.dependencies.auth import oauth2_scheme, get_current_user_id, require_admin
from app.infrastructure.api.dto.request.resolve_ban_appeal_request import ResolveBanAppealRequest
from app.infrastructure.api.dto.response.ban_appeal_response import (
    AppealableBanResponse, BanAppealResponse, ListBanAppealsResponse, OwnBanAppealResponse,
)
from app.infrastructure.config.settings import settings
import app.infrastructure.database.unit_of_work.uow_factory as uow_factory_module
from app.infrastructure.storage.local_disk_storage_service import LocalDiskStorageService

router = APIRouter(prefix="/api/v1/ban-appeals", tags=["Ban appeals"])


def get_appeal_identity(token: str = Depends(oauth2_scheme)):
    return JwtBanAppealTokenService(settings.jwt_secret_key).verify_token(token)


@router.get("/mine", response_model=OwnBanAppealResponse)
def get_own_appeal(identity: dict = Depends(get_appeal_identity)):
    ban, appeal = QueryBanAppeals(uow_factory_module.uow_factory()).get_own(**identity)
    return OwnBanAppealResponse(
        ban=AppealableBanResponse.from_domain(ban),
        appeal=BanAppealResponse.from_domain(appeal) if appeal else None,
    )


@router.post("/mine", response_model=BanAppealResponse, status_code=201)
def create_appeal(
    text: Annotated[str, Form(min_length=1, max_length=MAX_APPEAL_TEXT_LENGTH)],
    images: list[UploadFile] | None = File(None),
    identity: dict = Depends(get_appeal_identity),
):
    appeal = CreateBanAppeal(uow_factory_module.uow_factory(), LocalDiskStorageService()).execute(
        **identity, text=text, images=[(image.file, image.filename) for image in images or []],
    )
    return BanAppealResponse.from_domain(appeal)


@router.get("", response_model=ListBanAppealsResponse, dependencies=[Depends(require_admin)])
def search_appeals(
    username: Annotated[str | None, Query(max_length=100)] = None,
    status: BanAppealStatus | None = None,
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
):
    appeals = QueryBanAppeals(uow_factory_module.uow_factory()).execute(username, status, skip, limit)
    return ListBanAppealsResponse(appeals=[BanAppealResponse.from_domain(appeal) for appeal in appeals])


@router.get("/{appeal_id}", response_model=BanAppealResponse, dependencies=[Depends(require_admin)])
def get_appeal(appeal_id: int):
    return BanAppealResponse.from_domain(QueryBanAppeals(uow_factory_module.uow_factory()).get_detail(appeal_id))


@router.post("/{appeal_id}/resolve", response_model=BanAppealResponse, dependencies=[Depends(require_admin)])
def resolve_appeal(appeal_id: int, request: ResolveBanAppealRequest, admin_id: int = Depends(get_current_user_id)):
    appeal = ResolveBanAppeal(uow_factory_module.uow_factory()).execute(appeal_id, admin_id, BanAppealStatus(request.decision))
    return BanAppealResponse.from_domain(appeal)
