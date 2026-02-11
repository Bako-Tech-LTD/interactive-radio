"""Utility for matching news content to user-specified topics.

Provides fuzzy keyword matching that goes beyond simple substring search.
Supports multi-word topics and basic relevance scoring.
"""

import re
from dataclasses import dataclass


@dataclass
class MatchResult:
    """Result of matching a piece of text against a topic."""
    matched: bool
    score: float  # 0.0 to 1.0 relevance score


# Common synonyms / related terms for popular news topics
TOPIC_EXPANSIONS: dict[str, list[str]] = {
    "ai": ["artificial intelligence", "machine learning", "deep learning", "chatgpt", "openai", "llm", "gpt"],
    "crypto": ["cryptocurrency", "bitcoin", "ethereum", "blockchain", "web3", "defi", "nft"],
    "climate": ["climate change", "global warming", "carbon emissions", "renewable energy", "greenhouse"],
    "tech": ["technology", "silicon valley", "startup", "software", "hardware"],
    "finance": ["financial", "stock market", "wall street", "economy", "economic", "banking", "federal reserve"],
    "politics": ["political", "election", "congress", "senate", "parliament", "legislation"],
    "sports": ["football", "basketball", "soccer", "tennis", "olympics", "nfl", "nba", "premier league"],
    "health": ["healthcare", "medical", "vaccine", "pandemic", "mental health", "disease"],
    "space": ["nasa", "spacex", "astronomy", "satellite", "mars", "rocket", "orbit"],
}


def _normalize(text: str) -> str:
    """Lowercase and remove extra whitespace."""
    return re.sub(r"\s+", " ", text.lower().strip())


def _get_topic_keywords(topic: str) -> list[str]:
    """Get the topic keyword and any expanded synonyms."""
    normalized = _normalize(topic)
    keywords = [normalized]

    # Check if any expansion key matches
    for key, expansions in TOPIC_EXPANSIONS.items():
        if key == normalized or normalized in expansions:
            keywords.extend(expansions)
            if key not in keywords:
                keywords.append(key)
            break

    return list(set(keywords))


def match_topic(text: str, topic: str) -> MatchResult:
    """Check if text is relevant to the given topic.

    Uses keyword expansion and basic scoring.

    Args:
        text: The text content to check (title + summary/content).
        topic: The user's topic of interest.

    Returns:
        MatchResult with matched=True if relevant and a relevance score.
    """
    normalized_text = _normalize(text)
    keywords = _get_topic_keywords(topic)

    if not normalized_text:
        return MatchResult(matched=False, score=0.0)

    # Count keyword matches
    match_count = 0
    total_keywords = len(keywords)

    for keyword in keywords:
        if keyword in normalized_text:
            match_count += 1

    if match_count == 0:
        return MatchResult(matched=False, score=0.0)

    # Score based on proportion of keywords matched
    score = min(1.0, match_count / max(1, total_keywords / 2))

    # Boost score if exact topic appears in title position (first 100 chars)
    if _normalize(topic) in normalized_text[:100]:
        score = min(1.0, score + 0.3)

    return MatchResult(matched=True, score=round(score, 2))


def filter_by_topic(
    items: list[dict],
    topic: str,
    min_score: float = 0.0,
    text_fields: tuple[str, ...] = ("title", "content"),
) -> list[dict]:
    """Filter a list of item dicts, keeping only those matching the topic.

    Args:
        items: List of dicts with text fields.
        topic: Topic to match against.
        min_score: Minimum relevance score (0.0 to 1.0).
        text_fields: Which dict keys to check for topic relevance.

    Returns:
        Filtered list sorted by relevance score (highest first).
    """
    scored: list[tuple[float, dict]] = []

    for item in items:
        combined_text = " ".join(str(item.get(f, "")) for f in text_fields)
        result = match_topic(combined_text, topic)
        if result.matched and result.score >= min_score:
            scored.append((result.score, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item for _, item in scored]
