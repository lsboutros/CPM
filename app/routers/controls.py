from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from ..models import Control, ControlCreate, ControlUpdate
from ..storage import NotFoundError, repos

router = APIRouter(prefix="/controls", tags=["controls"])


def _check_risks_exist(risk_ids: list[UUID]) -> None:
    for rid in risk_ids:
        try:
            repos.risks.get(rid)
        except NotFoundError:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                f"risk {rid} does not exist",
            ) from None


@router.get("", response_model=list[Control])
def list_controls() -> list[Control]:
    return repos.controls.list()


@router.post("", response_model=Control, status_code=status.HTTP_201_CREATED)
def create_control(payload: ControlCreate) -> Control:
    _check_risks_exist(payload.mitigates_risk_ids)
    return repos.controls.add(Control(**payload.model_dump()))


@router.get("/{control_id}", response_model=Control)
def get_control(control_id: UUID) -> Control:
    try:
        return repos.controls.get(control_id)
    except NotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "control not found") from None


@router.patch("/{control_id}", response_model=Control)
def update_control(control_id: UUID, payload: ControlUpdate) -> Control:
    if payload.mitigates_risk_ids is not None:
        _check_risks_exist(payload.mitigates_risk_ids)
    try:
        return repos.controls.update(control_id, payload.model_dump(exclude_unset=True))
    except NotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "control not found") from None


@router.delete("/{control_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_control(control_id: UUID) -> None:
    try:
        repos.controls.delete(control_id)
    except NotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "control not found") from None
