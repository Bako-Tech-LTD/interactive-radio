import asyncio
import logging

from agent.browsers.x_browser import XBrowser
from agent.fetchers.reddit_fetcher import RedditFetcher
from agent.fetchers.rss_fetcher import RSSFetcher
from models.feed_item import FeedItem

logger = logging.getLogger(__name__)


class NewsCollector:
    """Coordinates news collection across all sources for given topics."""

    def __init__(self, enabled_sources: list[str] | None = None):
        self.enabled_sources = enabled_sources or ["rss", "twitter", "reddit"]
        self.rss_fetcher = RSSFetcher()
        self.x_browser = XBrowser()
        self.reddit_fetcher = RedditFetcher()

    async def collect(
        self, topics: list[str]
    ) -> dict[str, list[dict]]:
        """Collect posts from all enabled sources, grouped by topic."""
        results: dict[str, list[dict]] = {}

        for topic in topics:
            items: list[FeedItem] = []

            # Build list of fetch tasks based on enabled sources
            tasks = []
            if "rss" in self.enabled_sources:
                tasks.append(self.rss_fetcher.search(topic))
            if "twitter" in self.enabled_sources:
                tasks.append(self.x_browser.search(topic))
            if "reddit" in self.enabled_sources:
                tasks.append(self.reddit_fetcher.search(topic))

            if not tasks:
                logger.warning("No sources enabled for collection")
                results[topic] = []
                continue

            fetched = await asyncio.gather(*tasks, return_exceptions=True)

            for result in fetched:
                if isinstance(result, list):
                    items.extend(result)
                elif isinstance(result, Exception):
                    logger.warning("Source fetch failed: %s", result)

            # Sort by most recent first
            items.sort(key=lambda x: x.published_at, reverse=True)

            results[topic] = [item.model_dump(mode="json") for item in items]

        return results

    async def close(self):
        """Clean up resources."""
        await self.x_browser.close()
