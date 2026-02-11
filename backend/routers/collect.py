import json
import logging

from fastapi import APIRouter, Query, HTTPException

from agent.collector import NewsCollector
from db.redis_client import get_redis, cache_key

router = APIRouter()
logger = logging.getLogger(__name__)

VALID_SOURCES = {"rss", "twitter", "reddit"}
MAX_TOPICS = 10
MAX_TOPIC_LENGTH = 100


@router.get("/api/collect")
async def collect_news(
    topics: str = Query(..., description="Comma-separated topics"),
    sources: str = Query(
        "rss,twitter,reddit",
        description="Comma-separated enabled sources: rss, twitter, reddit",
    ),
):
    """Collect news for given topics from enabled sources.

    Supports caching — returns cached results if available and fresh.
    """
    # Validate and parse topics
    topic_list = [t.strip() for t in topics.split(",") if t.strip()]
    if not topic_list:
        raise HTTPException(status_code=400, detail="At least one topic is required")

    if len(topic_list) > MAX_TOPICS:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_TOPICS} topics allowed, got {len(topic_list)}",
        )

    for topic in topic_list:
        if len(topic) > MAX_TOPIC_LENGTH:
            raise HTTPException(
                status_code=400,
                detail=f"Topic '{topic[:20]}...' exceeds {MAX_TOPIC_LENGTH} character limit",
            )

    # Validate and parse sources
    source_list = [s.strip() for s in sources.split(",") if s.strip()]
    invalid_sources = set(source_list) - VALID_SOURCES
    if invalid_sources:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sources: {', '.join(invalid_sources)}. Valid: {', '.join(VALID_SOURCES)}",
        )

    if not source_list:
        raise HTTPException(status_code=400, detail="At least one source must be enabled")

    # Check cache first
    redis = get_redis()
    if redis:
        key = cache_key(topic_list, source_list)
        try:
            cached = await redis.get(key)
            if cached:
                logger.info("Cache hit for topics=%s sources=%s", topic_list, source_list)
                return json.loads(cached)
        except Exception as e:
            logger.warning("Redis cache read failed: %s", e)

    # Collect from sources
    collector = NewsCollector(enabled_sources=source_list)
    try:
        results = await collector.collect(topic_list)
    except Exception as e:
        logger.error("Collection failed: %s", e)
        raise HTTPException(
            status_code=502,
            detail="Failed to collect news from sources. Please try again.",
        )
    finally:
        await collector.close()

    # Cache the results
    if redis:
        key = cache_key(topic_list, source_list)
        try:
            await redis.set(key, json.dumps(results), ex=300)  # 5 min TTL
        except Exception as e:
            logger.warning("Redis cache write failed: %s", e)

    return results
