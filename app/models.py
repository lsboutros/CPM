from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, field_validator


def _now() -> datetime:
    return datetime.now(UTC)


class AssetType(StrEnum):
    SYSTEM = "system"
    APPLICATION = "application"
    DATA_STORE = "data_store"
    NETWORK = "network"
    HARDWARE = "hardware"
    OTHER = "other"


class Criticality(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ControlType(StrEnum):
    PREVENTIVE = "preventive"
    DETECTIVE = "detective"
    CORRECTIVE = "corrective"


class VulnerabilityStatus(StrEnum):
    OPEN = "open"
    MITIGATED = "mitigated"
    ACCEPTED = "accepted"
    CLOSED = "closed"


class _Timestamped(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)


# ---------- Asset ----------

class AssetCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    type: AssetType = AssetType.OTHER
    owner: str | None = None
    criticality: Criticality = Criticality.MEDIUM
    description: str | None = None


class AssetUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    type: AssetType | None = None
    owner: str | None = None
    criticality: Criticality | None = None
    description: str | None = None


class Asset(_Timestamped, AssetCreate):
    pass


# ---------- Risk ----------

class RiskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    asset_id: UUID
    likelihood: int = Field(ge=1, le=5, description="1 = rare, 5 = almost certain")
    impact: int = Field(ge=1, le=5, description="1 = negligible, 5 = catastrophic")
    description: str | None = None

    @property
    def score(self) -> int:
        return self.likelihood * self.impact


class RiskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    asset_id: UUID | None = None
    likelihood: int | None = Field(default=None, ge=1, le=5)
    impact: int | None = Field(default=None, ge=1, le=5)
    description: str | None = None


class Risk(_Timestamped, RiskCreate):
    pass


# ---------- Control ----------

class ControlCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    type: ControlType
    mitigates_risk_ids: list[UUID] = Field(default_factory=list)
    description: str | None = None

    @field_validator("mitigates_risk_ids")
    @classmethod
    def _unique_risks(cls, v: list[UUID]) -> list[UUID]:
        if len(set(v)) != len(v):
            raise ValueError("mitigates_risk_ids must be unique")
        return v


class ControlUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    type: ControlType | None = None
    mitigates_risk_ids: list[UUID] | None = None
    description: str | None = None


class Control(_Timestamped, ControlCreate):
    pass


# ---------- Vulnerability ----------

class VulnerabilityCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    asset_id: UUID
    cve: str | None = Field(default=None, pattern=r"^CVE-\d{4}-\d{4,}$")
    cvss: float | None = Field(default=None, ge=0.0, le=10.0)
    status: VulnerabilityStatus = VulnerabilityStatus.OPEN
    description: str | None = None


class VulnerabilityUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    asset_id: UUID | None = None
    cve: str | None = Field(default=None, pattern=r"^CVE-\d{4}-\d{4,}$")
    cvss: float | None = Field(default=None, ge=0.0, le=10.0)
    status: VulnerabilityStatus | None = None
    description: str | None = None


class Vulnerability(_Timestamped, VulnerabilityCreate):
    pass
