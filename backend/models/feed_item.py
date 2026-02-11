from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class NewsSource(str, Enum):
    TWITTER = "twitter"
    RSS = "rss"
    REDDIT = "reddit"


class FeedItem(BaseModel):
    title: str
    content: str
    url: str | None = None
    source: NewsSource
    source_name: str  # e.g. "BBC News", "r/worldnews", "@elonmusk"
    author: str | None = None
    published_at: datetime
    engagement: int = 0  # likes, upvotes, retweets, etc.
