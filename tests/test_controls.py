from __future__ import annotations

from fastapi.testclient import TestClient


def _seed(client: TestClient) -> tuple[str, str]:
    aid = client.post("/assets", json={"name": "VPN"}).json()["id"]
    rid = client.post(
        "/risks",
        json={
            "title": "Credential stuffing",
            "asset_id": aid,
            "likelihood": 4,
            "impact": 4,
        },
    ).json()["id"]
    return aid, rid


def test_create_control_with_risk(client: TestClient) -> None:
    _, rid = _seed(client)
    r = client.post(
        "/controls",
        json={"name": "MFA", "type": "preventive", "mitigates_risk_ids": [rid]},
    )
    assert r.status_code == 201
    assert r.json()["mitigates_risk_ids"] == [rid]


def test_control_rejects_duplicate_risk_ids(client: TestClient) -> None:
    _, rid = _seed(client)
    r = client.post(
        "/controls",
        json={
            "name": "MFA",
            "type": "preventive",
            "mitigates_risk_ids": [rid, rid],
        },
    )
    assert r.status_code == 422


def test_control_rejects_unknown_risk(client: TestClient) -> None:
    r = client.post(
        "/controls",
        json={
            "name": "Audit logs",
            "type": "detective",
            "mitigates_risk_ids": ["00000000-0000-0000-0000-000000000000"],
        },
    )
    assert r.status_code == 422
