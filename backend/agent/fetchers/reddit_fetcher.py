import logging
from datetime import datetime, timedelta, timezone

import asyncpraw

from config import settings
from models.feed_item import FeedItem, NewsSource

logger = logging.getLogger(__name__)

# Default subreddits to search when looking for news
DEFAULT_SUBREDDITS = [
    "worldnews",
    "news",
    "technology",
    "science",
    "business",
    "politics",
]

# Map max_feed_age_days to Reddit's time_filter options
def _get_reddit_time_filter(max_days: int) -> str:
    """Convert max age in days to Reddit's time_filter parameter."""
    if max_days <= 1:
        return "day"
    elif max_days <= 7:
        return "week"
    elif max_days <= 30:
        return "month"
    elif max_days <= 365:
        return "year"
    return "all"


class RedditFetcher:
    """Search Reddit for posts matching topics using asyncpraw."""

    def __init__(self):
        self.subreddits = DEFAULT_SUBREDDITS

    def _is_within_age_limit(self, published: datetime) -> bool:
        """Check if the published date is within the configured age limit."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=settings.max_feed_age_days)
        return published >= cutoff

    async def search(self, topic: str) -> list[FeedItem]:
        """Search Reddit for posts about a topic."""
        if not settings.reddit_client_id or not settings.reddit_client_secret:
            logger.warning("Reddit API credentials not configured — skipping")
            return []

        items: list[FeedItem] = []
        time_filter = _get_reddit_time_filter(settings.max_feed_age_days)

        try:
            reddit = asyncpraw.Reddit(
                client_id=settings.reddit_client_id,
                client_secret=settings.reddit_client_secret,
                user_agent=settings.reddit_user_agent,
            )

            try:
                for sub_name in self.subreddits:
                    try:
                        subreddit = await reddit.subreddit(sub_name)
                        async for submission in subreddit.search(
                            topic, sort="relevance", time_filter=time_filter, limit=10
                        ):
                            # Filter low engagement posts
                            if submission.score < 10:
                                continue

                            published = datetime.fromtimestamp(
                                submission.created_utc, tz=timezone.utc
                            )

                            # Double-check age limit (Reddit's time_filter is coarse)
                            if not self._is_within_age_limit(published):
                                continue

                            content = submission.selftext or submission.title
                            # For link posts, include the URL in the content
                            if submission.is_self is False and submission.url:
                                content = f"{content}\n\nLink: {submission.url}"

                            items.append(
                                FeedItem(
                                    title=submission.title,
                                    content=content,
                                    url=f"https://reddit.com{submission.permalink}",
                                    source=NewsSource.REDDIT,
                                    source_name=f"r/{sub_name}",
                                    author=(
                                        str(submission.author)
                                        if submission.author
                                        else None
                                    ),
                                    published_at=published,
                                    engagement=submission.score,
                                )
                            )
                    except Exception as e:
                        logger.warning("Failed to search r/%s: %s", sub_name, e)
                        continue
            finally:
                await reddit.close()

        except Exception as e:
            logger.error("Reddit API error: %s", e)

        # Sort by engagement and limit
        items.sort(key=lambda x: x.engagement, reverse=True)
        return items[: settings.max_items_per_source]
