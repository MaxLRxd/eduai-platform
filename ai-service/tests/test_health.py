import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))

from fastapi.testclient import TestClient

from src.main import app

client = TestClient(app)


def test_healthz() -> None:
    res = client.get("/api/healthz")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert res.json()["service"] == "eduai-ai-service"


def test_root() -> None:
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"