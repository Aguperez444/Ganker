from fastapi import APIRouter, Depends, Form

from app.application.use_cases.create_region import CreateRegion
from app.application.use_cases.delete_region import DeleteRegion
from app.application.use_cases.query_regions import QueryRegions
from app.application.use_cases.update_region import UpdateRegion
from app.infrastructure.api.dependencies.auth import require_player, require_admin
from app.infrastructure.api.dto.response.base_classes.region_object_response import RegionObjectResponse
from app.infrastructure.api.dto.response.delete.delete_region_response import DeleteRegionResponse
from app.infrastructure.api.dto.response.get.get_regions_response import GetRegionsResponse
from app.infrastructure.database.unit_of_work.uow_factory import uow_factory
from app.infrastructure.storage.local_disk_storage_service import LocalDiskStorageService

router = APIRouter(prefix="/api/v1/regions", tags=["Regions"])

def get_storage_service():
    return LocalDiskStorageService()

@router.get("/{videogame_id}", response_model=GetRegionsResponse, status_code=200, dependencies=[Depends(require_player)])
def get_regions_by_videogame_id(videogame_id: int):
    uow = uow_factory()
    query_regions_use_case = QueryRegions(uow)
    return query_regions_use_case.get_by_game_id(videogame_id)

@router.post("", status_code=200, response_model=RegionObjectResponse, dependencies=[Depends(require_admin)])
def create_game_region (
        videogame_id: int = Form(..., description="ID of the videogame"),
        name: str = Form(..., description="Name of the region")):
    uow = uow_factory()
    storage = get_storage_service()
    use_case = CreateRegion(storage_service=storage, uow=uow)

    return use_case.execute(
        game_id=videogame_id,
        name=name
    )

@router.put("/{region_id}", response_model=RegionObjectResponse, dependencies=[Depends(require_admin)])
def update_game_region (
        region_id: int,
        name:str
):
    uow = uow_factory()
    storage = get_storage_service()
    use_case = UpdateRegion(storage_service=storage, uow=uow)

    return use_case.execute(
        region_id=region_id,
        name=name
    )

@router.delete("/{region_id}", status_code=200, response_model=DeleteRegionResponse,dependencies=[Depends(require_player)])
def delete_game_region(region_id: int):
    uow = uow_factory()
    storage_service = get_storage_service()
    use_case = DeleteRegion(storage_service=storage_service, uow=uow)
    return use_case.execute(region_id=region_id)