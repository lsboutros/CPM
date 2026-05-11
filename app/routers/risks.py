from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from ..models import Risk, RiskCreate, RiskUpdate
from ..storage import NotFoundError, repos

router = APIRouter(prefix="/risks", tags=["risks"])


def _check_asset_exists(asset_id: UUID) -> None:
    try:
        repos.assets.get(asset_id)
    except NotFoundError:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"asset {asset_id} does not exist",
        ) from None


@router.get("", response_model=list[Risk])
def list_risks() -> list[Risk]:
    return repos.risks.list()


@router.post("", response_model=Risk, status_code=status.HTTP_201_CREATED)
def create_risk(payload: RiskCreate) -> Risk:
    _check_asset_exists(payload.asset_id)
    return repos.risks.add(Risk(**payload.model_dump()))


@router.get("/{risk_id}", response_model=Risk)
def get_risk(risk_id: UUID) -> Risk:
    try:
        return repos.risks.get(risk_id)
    except NotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "risk not found") from None


@router.patch("/{risk_id}", response_model=Risk)
def update_risk(risk_id: UUID, payload: RiskUpdate) -> Risk:
    if payload.asset_id is not None:
        _check_asset_exists(payload.asset_id)
    try:
        return repos.risks.update(risk_id, payload.model_dump(exclude_unset=True))
    except NotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "risk not found") from None


@router.delete("/{risk_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_risk(risk_id: UUID) -> None:
    try:
        repos.risks.delete(risk_id)
    except NotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "risk not found") from None
