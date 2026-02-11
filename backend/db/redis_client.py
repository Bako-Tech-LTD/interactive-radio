import hashlib
import logging

import redis.asyncio as aioredis

from config import settings

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None


async def init_redis() -> aioredis.Redis | None:
    """Initialize Redis connection. Returns None if unavailable."""
    global _redis
    try:
        _redis = aioredis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=3,
        )
        # Test connection
        await _redis.ping()
        logger.info("Redis connected at %s", settings.redis_url)
        return _redis
    except Exception as e:
        logger.warning("Redis unavailable (%s) — caching disabled", e)
        _redis = None
        return None


async def close_redis():
    """Close Redis connection."""
    global _redis
    if _redis:
        await _redis.close()
        _redis = None


def get_redis() -> aioredis.Redis | None:
    """Get the current Redis client. Returns None if not connected."""
    return _redis


def cache_key(topics: list[str], sources: list[str]) -> str:
    """Generate a deterministic cache key for a collection request."""
    raw = f"collect:{','.join(sorted(topics))}:{','.join(sorted(sources))}"
    return f"ir:{hashlib.md5(raw.encode()).hexdigest()}"
