import httpx


def test_public_api_health_and_unavailable_ipo_contract():
    with httpx.Client(base_url="http://localhost:8001/api", timeout=30.0) as client:
        health = client.get("/health")
        assert health.status_code == 200
        assert health.json() == {"status": "ok"}

        ipos = client.get("/ipos")
        assert ipos.status_code == 200
        payload = ipos.json()
        assert payload["success"] is False
        assert payload["available"] is False
        assert payload["data"] == {"mainboard": [], "sme": []}
        assert "Convex" in payload["message"]
