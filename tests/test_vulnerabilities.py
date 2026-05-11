from __future__ import annotations

from fastapi.testclient import TestClient


def _new_asset(client: TestClient) -> str:
    return client.post("/assets", json={"name": "Web server"}).json()["id"]


def test_create_vulnerability(client: TestClient) -> None:
    asset_id = _new_asset(client)
    r = client.post(
        "/vulnerabilities",
        json={
            "title": "OpenSSL flaw",
            "asset_id": asset_id,
            "cve": "CVE-2024-1234",
            "cvss": 7.5,
        },
    )
    assert r.status_code == 201
    body = r.json()
    assert body["status"] == "open"
    assert body["cvss"] == 7.5


def test_invalid_cve_format(client: TestClient) -> None:
    asset_id = _new_asset(client)
    r = client.post(
        "/vulnerabilities",
        json={"title": "X", "asset_id": asset_id, "cve": "not-a-cve"},
    )
    assert r.status_code == 422


def test_status_transition(client: TestClient) -> None:
    asset_id = _new_asset(client)
    vid = client.post(
        "/vulnerabilities",
        json={"title": "X", "asset_id": asset_id},
    ).json()["id"]
    r = client.patch(f"/vulnerabilities/{vid}", json={"status": "mitigated"})
    assert r.status_code == 200
    assert r.json()["status"] == "mitigated"
