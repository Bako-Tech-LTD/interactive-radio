from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    frontend_url: str = "http://localhost:8081"

    # Reddit
    reddit_client_id: str = ""
    reddit_client_secret: str = ""
    reddit_user_agent: str = "InteractiveRadio/1.0"

    # RSS Feeds (comma-separated URLs)
    rss_feeds: str = (
        "https://feeds.bbci.co.uk/news/rss.xml,"
        "https://feeds.reuters.com/reuters/topNews"
    )

    # Redis
    redis_url: str = "redis://localhost:6379"

    # X.com
    x_cookies_path: str = "./x_cookies.json"

    # Collection
    max_items_per_source: int = 10
    cache_ttl_seconds: int = 3600  # 1 hour
    max_feed_age_days: int = 3  # Only include news from the last N days

    model_config = {"env_file": ".env"}


settings = Settings()
