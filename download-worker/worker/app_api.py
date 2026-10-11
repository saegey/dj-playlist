"""The worker's shared app connection (Essentia uses its own HTTP calls)."""

import os
from functools import lru_cache

from groovenet_client import GroovenetClient


@lru_cache(maxsize=1)
def _client(base_url: str) -> GroovenetClient:
    return GroovenetClient(base_url, timeout=30, client_name="worker")


def get_groovenet_client() -> GroovenetClient:
    return _client(os.getenv("APP_URL", "http://app:3000"))
