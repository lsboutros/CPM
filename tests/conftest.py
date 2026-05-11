from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.storage import repos


@pytest.fixture(autouse=True)
def _reset_state() -> None:
    repos.assets.clear()
    repos.risks.clear()
    repos.controls.clear()
    repos.vulnerabilities.clear()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
