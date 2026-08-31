import os
from typing import Any

import httpx


class ConvexUnavailable(Exception):
    """Raised when the server cannot safely reach the configured Convex deployment."""


async def call_convex(function_type: str, path: str, args: dict[str, Any]) -> Any:
    site_url = os.environ.get("CONVEX_SITE_URL") or os.environ.get("CONVEX_URL")
    token = os.environ.get("CONVEX_APP_TOKEN")
    if not site_url or not token:
        raise ConvexUnavailable("Convex is not configured")

    endpoint = f"{site_url.rstrip('/')}/api/{function_type}"
    payload = {"path": path, "args": {"token": token, **args}}
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(endpoint, json=payload)
            response.raise_for_status()
            body = response.json()
            if "value" not in body:
                raise ConvexUnavailable("Convex returned an invalid response")
            return body["value"]
    except (httpx.HTTPError, ValueError, KeyError) as exc:
        raise ConvexUnavailable("Convex is temporarily unavailable") from exc