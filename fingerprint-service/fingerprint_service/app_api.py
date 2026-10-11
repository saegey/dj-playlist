"""Reuse one app Session across callbacks and reference-index pages."""

from functools import lru_cache

from groovenet_client import GroovenetClient


@lru_cache(maxsize=1)
def get_groovenet_client(base_url: str, timeout: float) -> GroovenetClient:
    # The app recognises "worker" as pipeline traffic; other names count as web.
    return GroovenetClient(base_url, timeout=timeout, client_name="worker")
