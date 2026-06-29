"""GET /health 엔드포인트 테스트"""


def test_health_returns_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_is_accessible_without_auth(client):
    response = client.get("/health")
    assert response.status_code == 200
