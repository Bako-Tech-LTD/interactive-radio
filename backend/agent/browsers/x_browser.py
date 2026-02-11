import json
import logging
import os
from datetime import datetime, timedelta, timezone
from urllib.parse import quote

from playwright.async_api import async_playwright, Browser, Page

from config import settings
from models.feed_item import FeedItem, NewsSource

logger = logging.getLogger(__name__)


class XBrowser:
    """Browse and search X.com for posts using Playwright headless browser."""

    def __init__(self):
        self._browser: Browser | None = None
        self._page: Page | None = None

    def _is_within_age_limit(self, published: datetime) -> bool:
        """Check if the published date is within the configured age limit."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=settings.max_feed_age_days)
        return published >= cutoff

    def _normalize_cookies(self, cookies: list[dict]) -> list[dict]:
        """Normalize cookies for Playwright compatibility."""
        # Valid sameSite values for Playwright
        valid_same_site = {"Strict", "Lax", "None"}
        same_site_map = {
            "strict": "Strict",
            "lax": "Lax",
            "none": "None",
            "no_restriction": "None",
            "unspecified": "Lax",
        }

        normalized = []
        for cookie in cookies:
            c = cookie.copy()
            
            # Normalize sameSite value
            if "sameSite" in c:
                same_site = c["sameSite"]
                if same_site not in valid_same_site:
                    # Try to map common variations
                    c["sameSite"] = same_site_map.get(
                        str(same_site).lower(), "Lax"
                    )
            
            # Remove fields that Playwright doesn't accept
            c.pop("hostOnly", None)
            c.pop("session", None)
            c.pop("storeId", None)
            c.pop("id", None)
            
            normalized.append(c)
        
        return normalized

    async def _ensure_browser(self):
        """Launch browser and load cookies if not already running."""
        if self._browser is not None and self._page is not None:
            return

        pw = await async_playwright().start()
        
        # Heroku-compatible Playwright configuration
        launch_options = {
            "headless": True,
            "args": [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
            ]
        }
        
        # Use Heroku buildpack executable path if available
        chromium_path = os.getenv("CHROMIUM_EXECUTABLE_PATH")
        if chromium_path:
            launch_options["executable_path"] = chromium_path
            logger.info("Using Chromium from Heroku buildpack: %s", chromium_path)
        
        self._browser = await pw.chromium.launch(**launch_options)

        context = await self._browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900},
        )

        # Load auth cookies if available
        try:
            with open(settings.x_cookies_path, "r") as f:
                cookies = json.load(f)
                # Normalize cookies for Playwright compatibility
                normalized_cookies = self._normalize_cookies(cookies)
                await context.add_cookies(normalized_cookies)
                logger.info("Loaded X.com cookies from %s", settings.x_cookies_path)
        except FileNotFoundError:
            logger.warning(
                "No X.com cookies found at %s — will browse as logged out",
                settings.x_cookies_path,
            )
        except json.JSONDecodeError:
            logger.error("Invalid JSON in X.com cookies file")

        self._page = await context.new_page()

    async def search(self, topic: str) -> list[FeedItem]:
        """Search X.com for posts matching a topic."""
        try:
            await self._ensure_browser()
            assert self._page is not None

            search_url = (
                f"https://x.com/search?q={quote(topic)}&src=typed_query&f=live"
            )
            await self._page.goto(
                search_url, wait_until="domcontentloaded", timeout=15000
            )

            # Wait for tweets to load
            try:
                await self._page.wait_for_selector(
                    '[data-testid="tweet"]', timeout=10000
                )
            except Exception:
                logger.warning("No tweets found for topic: %s", topic)
                return []

            # Extract posts from the page
            posts = await self._extract_posts(topic)
            return posts[: settings.max_items_per_source]

        except Exception as e:
            logger.error("X.com search failed for '%s': %s", topic, e)
            return []

    async def _extract_posts(self, topic: str) -> list[FeedItem]:
        """Extract post data from currently loaded X.com page."""
        assert self._page is not None

        # Scroll once to load more content
        await self._page.evaluate("window.scrollBy(0, 800)")
        await self._page.wait_for_timeout(1500)

        tweet_elements = await self._page.query_selector_all(
            '[data-testid="tweet"]'
        )
        items: list[FeedItem] = []

        for tweet_el in tweet_elements[:20]:  # Check more, filter by age
            try:
                item = await self._parse_tweet(tweet_el)
                if item and self._is_within_age_limit(item.published_at):
                    items.append(item)
            except Exception:
                continue

        return items

    async def _parse_tweet(self, tweet_el) -> FeedItem | None:
        """Parse a single tweet element into a FeedItem."""
        # Get tweet text
        text_el = await tweet_el.query_selector('[data-testid="tweetText"]')
        if not text_el:
            return None
        text = await text_el.inner_text()

        if not text.strip():
            return None

        # Get author handle
        author = "Unknown"
        user_links = await tweet_el.query_selector_all('a[role="link"]')
        for link in user_links:
            href = await link.get_attribute("href")
            if href and href.startswith("/") and not href.startswith("/search"):
                author = href.strip("/")
                break

        # Get timestamp
        time_el = await tweet_el.query_selector("time")
        published_at = datetime.now(timezone.utc)
        if time_el:
            datetime_attr = await time_el.get_attribute("datetime")
            if datetime_attr:
                try:
                    published_at = datetime.fromisoformat(
                        datetime_attr.replace("Z", "+00:00")
                    )
                except ValueError:
                    pass

        # Get engagement (approximate from aria-labels)
        engagement = 0
        for test_id in ["like", "retweet", "reply"]:
            btn = await tweet_el.query_selector(f'[data-testid="{test_id}"]')
            if btn:
                aria = await btn.get_attribute("aria-label")
                if aria:
                    parts = aria.split()
                    if parts:
                        try:
                            num_str = parts[0].replace(",", "")
                            engagement += int(num_str)
                        except ValueError:
                            pass

        # Get tweet URL
        url = None
        link_els = await tweet_el.query_selector_all('a[href*="/status/"]')
        for link_el in link_els:
            href = await link_el.get_attribute("href")
            if href and "/status/" in href:
                url = f"https://x.com{href}" if href.startswith("/") else href
                break

        return FeedItem(
            title=f"@{author}: {text[:80]}{'...' if len(text) > 80 else ''}",
            content=text,
            url=url,
            source=NewsSource.TWITTER,
            source_name=f"@{author}",
            author=author,
            published_at=published_at,
            engagement=engagement,
        )

    async def close(self):
        """Close the browser."""
        if self._browser:
            await self._browser.close()
            self._browser = None
            self._page = None
