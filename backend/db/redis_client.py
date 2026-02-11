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
        # Heroku Redis uses self-signed certificates, so we need to disable SSL verification
        redis_url = settings.redis_url
        ssl_cert_reqs = None
        
        if redis_url.startswith("rediss://"):
            # Use SSL but don't verify certificates for Heroku Redis
            import ssl
            ssl_cert_reqs = ssl.CERT_NONE
        
        _redis = aioredis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=3,
            ssl_cert_reqs=ssl_cert_reqs,
        )
        # Test connection
        await _redis.ping()
        logger.info("Redis connected at %s", redis_url.split('@')[0] + '@***')
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
