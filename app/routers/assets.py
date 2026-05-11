from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from ..models import Asset, AssetCreate, AssetUpdate
from ..storage import NotFoundError, repos

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("", response_model=list[Asset])
def list_assets() -> list[Asset]:
    return repos.assets.list()


@router.post("", response_model=Asset, status_code=status.HTTP_201_CREATED)
def create_asset(payload: AssetCreate) -> Asset:
    return repos.assets.add(Asset(**payload.model_dump()))


@router.get("/{asset_id}", response_model=Asset)
def get_asset(asset_id: UUID) -> Asset:
    try:
        return repos.assets.get(asset_id)
    except NotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "asset not found") from None


@router.patch("/{asset_id}", response_model=Asset)
def update_asset(asset_id: UUID, payload: AssetUpdate) -> Asset:
    try:
        return repos.assets.update(asset_id, payload.model_dump(exclude_unset=True))
    except NotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "asset not found") from None


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(asset_id: UUID) -> None:
    try:
        repos.assets.delete(asset_id)
    except NotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "asset not found") from None
