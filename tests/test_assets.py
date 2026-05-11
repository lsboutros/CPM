from __future__ import annotations

from fastapi.testclient import TestClient


def test_create_and_get_asset(client: TestClient) -> None:
    r = client.post("/assets", json={"name": "Prod DB", "type": "data_store"})
    assert r.status_code == 201
    asset = r.json()
    assert asset["name"] == "Prod DB"

    r = client.get(f"/assets/{asset['id']}")
    assert r.status_code == 200
    assert r.json()["id"] == asset["id"]


def test_list_assets_empty(client: TestClient) -> None:
    r = client.get("/assets")
    assert r.status_code == 200
    assert r.json() == []


def test_patch_asset(client: TestClient) -> None:
    aid = client.post("/assets", json={"name": "Web app"}).json()["id"]
    r = client.patch(f"/assets/{aid}", json={"criticality": "high"})
    assert r.status_code == 200
    assert r.json()["criticality"] == "high"


def test_delete_asset(client: TestClient) -> None:
    aid = client.post("/assets", json={"name": "Laptop fleet"}).json()["id"]
    assert client.delete(f"/assets/{aid}").status_code == 204
    assert client.get(f"/assets/{aid}").status_code == 404


def test_invalid_asset_name(client: TestClient) -> None:
    assert client.post("/assets", json={"name": ""}).status_code == 422
