import os
import logging

from fastapi import APIRouter

from config import settings
from db.redis_client import get_redis

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/api/health")
async def health_check():
    """Health check with service status details."""
    redis = get_redis()
    redis_ok = False
    if redis:
        try:
            await redis.ping()
            redis_ok = True
        except Exception:
            pass

    return {
        "status": "ok",
        "services": {
            "redis": redis_ok,
            "rss": bool(settings.rss_feeds.strip()),
            "reddit": bool(settings.reddit_client_id and settings.reddit_client_secret),
            "twitter": bool(settings.x_cookies_json or os.path.exists(settings.x_cookies_path)),
        },
    }
