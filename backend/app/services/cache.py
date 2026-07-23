import json
from functools import lru_cache
from typing import Any, Optional

import redis

from app.core.config import get_settings

settings = get_settings()


@lru_cache
def get_redis_client() -> redis.Redis:
    return redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)


def _cache_key(file_hash: str) -> str:
    return f"smartdoc:analysis:{file_hash}"


def get_cached_analysis(file_hash: str) -> Optional[dict[str, Any]]:
    client = get_redis_client()
    raw = client.get(_cache_key(file_hash))
    if raw is None:
        return None
    return json.loads(raw)


def set_cached_analysis(file_hash: str, data: dict[str, Any]) -> None:
    client = get_redis_client()
    client.set(_cache_key(file_hash), json.dumps(data), ex=settings.CACHE_TTL_SECONDS)


def ping() -> bool:
    try:
        return bool(get_redis_client().ping())
    except redis.RedisError:
        return False
