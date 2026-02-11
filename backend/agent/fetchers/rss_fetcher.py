import logging
from datetime import datetime, timedelta, timezone

import feedparser
import httpx

from config import settings
from models.feed_item import FeedItem, NewsSource
from utils.topic_matcher import match_topic

logger = logging.getLogger(__name__)


class RSSFetcher:
    """Fetch and filter RSS feed entries by topic."""

    def __init__(self):
        self.feed_urls = [
            url.strip()
            for url in settings.rss_feeds.split(",")
            if url.strip()
        ]

    def _is_within_age_limit(self, published: datetime) -> bool:
        """Check if the published date is within the configured age limit."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=settings.max_feed_age_days)
        return published >= cutoff

    async def search(self, topic: str) -> list[FeedItem]:
        """Fetch RSS feeds and filter entries matching the topic."""
        items: list[FeedItem] = []

        async with httpx.AsyncClient(timeout=15.0) as client:
            for feed_url in self.feed_urls:
                try:
                    response = await client.get(feed_url)
                    response.raise_for_status()
                    feed = feedparser.parse(response.text)

                    feed_title = feed.feed.get("title", feed_url)

                    for entry in feed.entries[:50]:  # Check more entries, filter by relevance
                        title = entry.get("title", "")
                        summary = entry.get("summary", "")
                        combined = f"{title} {summary}"

                        # Use topic matcher with keyword expansion
                        result = match_topic(combined, topic)
                        if not result.matched:
                            continue

                        published = self._parse_date(entry)

                        # Skip items older than the configured age limit
                        if not self._is_within_age_limit(published):
                            continue

                        items.append(
                            FeedItem(
                                title=title,
                                content=summary,
                                url=entry.get("link"),
                                source=NewsSource.RSS,
                                source_name=feed_title,
                                author=entry.get("author"),
                                published_at=published,
                                engagement=int(result.score * 100),  # Use relevance as engagement proxy
                            )
                        )
                except Exception as e:
                    logger.warning("Failed to fetch RSS feed %s: %s", feed_url, e)
                    continue

        # Sort by relevance-based engagement and limit
        items.sort(key=lambda x: x.engagement, reverse=True)
        return items[: settings.max_items_per_source]

    def _parse_date(self, entry) -> datetime:
        """Parse published date from feed entry."""
        if hasattr(entry, "published_parsed") and entry.published_parsed:
            from time import mktime

            return datetime.fromtimestamp(
                mktime(entry.published_parsed), tz=timezone.utc
            )
        return datetime.now(timezone.utc)
