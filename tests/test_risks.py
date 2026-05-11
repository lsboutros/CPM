from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient


def _new_asset(client: TestClient) -> str:
    return client.post("/assets", json={"name": "Asset for risk"}).json()["id"]


def test_create_risk(client: TestClient) -> None:
    asset_id = _new_asset(client)
    r = client.post(
        "/risks",
        json={
            "title": "Data exfiltration",
            "asset_id": asset_id,
            "likelihood": 3,
            "impact": 5,
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["likelihood"] == 3
    assert body["impact"] == 5


def test_create_risk_unknown_asset(client: TestClient) -> None:
    r = client.post(
        "/risks",
        json={
            "title": "Orphan",
            "asset_id": str(uuid4()),
            "likelihood": 1,
            "impact": 1,
        },
    )
    assert r.status_code == 422


def test_score_validation(client: TestClient) -> None:
    asset_id = _new_asset(client)
    r = client.post(
        "/risks",
        json={"title": "Bad", "asset_id": asset_id, "likelihood": 0, "impact": 3},
    )
    assert r.status_code == 422
