def test_health_check(client):
    """Verifies that the health check returns status 200 and indicates DB is connected."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert "timestamp" in data
