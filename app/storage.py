from __future__ import annotations

from datetime import UTC, datetime
from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class NotFoundError(KeyError):
    """Raised when a requested entity does not exist."""


class InMemoryRepository(Generic[T]):
    """A tiny in-memory CRUD store keyed by UUID.

    Swap this for a real database layer when persistence is needed; the routers
    only depend on the four methods below.
    """

    def __init__(self) -> None:
        self._items: dict[UUID, T] = {}

    def list(self) -> list[T]:
        return list(self._items.values())

    def get(self, item_id: UUID) -> T:
        try:
            return self._items[item_id]
        except KeyError as exc:
            raise NotFoundError(item_id) from exc

    def add(self, item: T) -> T:
        self._items[item.id] = item  # type: ignore[attr-defined]
        return item

    def update(self, item_id: UUID, patch: dict) -> T:
        existing = self.get(item_id)
        data = existing.model_dump()
        data.update({k: v for k, v in patch.items() if v is not None})
        data["updated_at"] = datetime.now(UTC)
        new = type(existing).model_validate(data)
        self._items[item_id] = new
        return new

    def delete(self, item_id: UUID) -> None:
        if item_id not in self._items:
            raise NotFoundError(item_id)
        del self._items[item_id]

    def clear(self) -> None:
        self._items.clear()


class Repositories:
    """Container holding one repository per resource."""

    def __init__(self) -> None:
        from .models import Asset, Control, Risk, Vulnerability

        self.assets: InMemoryRepository[Asset] = InMemoryRepository()
        self.risks: InMemoryRepository[Risk] = InMemoryRepository()
        self.controls: InMemoryRepository[Control] = InMemoryRepository()
        self.vulnerabilities: InMemoryRepository[Vulnerability] = InMemoryRepository()


repos = Repositories()
