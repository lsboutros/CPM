from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from ..models import Vulnerability, VulnerabilityCreate, VulnerabilityUpdate
from ..storage import NotFoundError, repos

router = APIRouter(prefix="/vulnerabilities", tags=["vulnerabilities"])


def _check_asset_exists(asset_id: UUID) -> None:
    try:
        repos.assets.get(asset_id)
    except NotFoundError:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"asset {asset_id} does not exist",
        ) from None


@router.get("", response_model=list[Vulnerability])
def list_vulnerabilities() -> list[Vulnerability]:
    return repos.vulnerabilities.list()


@router.post("", response_model=Vulnerability, status_code=status.HTTP_201_CREATED)
def create_vulnerability(payload: VulnerabilityCreate) -> Vulnerability:
    _check_asset_exists(payload.asset_id)
    return repos.vulnerabilities.add(Vulnerability(**payload.model_dump()))


@router.get("/{vuln_id}", response_model=Vulnerability)
def get_vulnerability(vuln_id: UUID) -> Vulnerability:
    try:
        return repos.vulnerabilities.get(vuln_id)
    except NotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "vulnerability not found") from None


@router.patch("/{vuln_id}", response_model=Vulnerability)
def update_vulnerability(vuln_id: UUID, payload: VulnerabilityUpdate) -> Vulnerability:
    if payload.asset_id is not None:
        _check_asset_exists(payload.asset_id)
    try:
        return repos.vulnerabilities.update(vuln_id, payload.model_dump(exclude_unset=True))
    except NotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "vulnerability not found") from None


@router.delete("/{vuln_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vulnerability(vuln_id: UUID) -> None:
    try:
        repos.vulnerabilities.delete(vuln_id)
    except NotFoundError:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "vulnerability not found") from None
