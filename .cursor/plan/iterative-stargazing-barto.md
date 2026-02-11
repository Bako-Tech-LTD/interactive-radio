Concept
A personalized AI news radio. The user tells the agent what topics they're interested in (by voice), the agent browses X.com, RSS, and Reddit to collect relevant posts, then reads a summarized news briefing aloud. The user can interrupt anytime by voice to:

Deep dive: "Tell me more about that" → agent elaborates
Read original: "Read me that post" → agent reads the source verbatim
Skip: "Next" → moves to next topic
Change topics: "What about sports?" → agent collects new content

The agent summarizes by default. It presents the news without editorializing. Only reads the original verbatim when the user asks.
Tech Stack

Mobile: Expo (React Native) with Expo Router, TypeScript, iOS + Android
Voice Agent: ElevenLabs Conversational AI (@elevenlabs/react-native)

Handles the entire voice pipeline: mic → STT → LLM → TTS → audio playback
WebRTC-based real-time audio streaming
Natural voice interrupts built-in


Backend: Python / FastAPI (news collection only)
Browser Automation: Playwright (headless browsing of X.com)
News Sources: X.com (Playwright), RSS feeds (feedparser), Reddit (asyncpraw)
Cache: Redis


Architecture
    ┌──────────────────────────────────────────────────────────────┐
    │                     ELEVENLABS AGENT                         │
    │              (Conversational AI Platform)                    │
    │                                                              │
    │  • Receives news context from our backend                    │
    │  • Has system prompt: "You are a news radio host..."        │
    │  • Speaks summarized briefings to the user                  │
    │  • Listens for voice interrupts (deep dive, skip, etc.)     │
    │  • Handles all audio I/O via WebRTC                         │
    │  • Uses ElevenLabs voices for TTS                           │
    │  • Uses built-in STT for user speech                        │
    └──────────────────┬──────────────────┬────────────────────────┘
                       │                  │
              context updates        voice stream
              (news data)           (WebRTC audio)
                       │                  │
    ┌──────────────────┴──────┐  ┌────────┴────────────────────────┐
    │    PYTHON BACKEND       │  │      EXPO MOBILE APP            │
    │    (FastAPI)             │  │                                  │
    │                          │  │  @elevenlabs/react-native SDK   │
    │  • Collects news from:  │  │  • useConversation() hook       │
    │    - X.com (Playwright) │  │  • Mic input → ElevenLabs       │
    │    - RSS (feedparser)   │  │  • Audio output ← ElevenLabs    │
    │    - Reddit (asyncpraw) │  │  • sendContextualUpdate()       │
    │                          │  │    to feed news data to agent   │
    │  • Groups by topic      │  │                                  │
    │  • Serves via REST API  │  │  UI: play/stop, visualizer,     │
    │    GET /api/collect      │  │      topic display, source info │
    │                          │  │                                  │
    └──────────────────────────┘  └─────────────────────────────────┘


    USER FLOW
    =========

    1. User taps Play
    2. App starts ElevenLabs conversation session
    3. Agent: "What would you like to hear about today?"
    4. User says: "AI and crypto"
    5. App calls backend: GET /api/collect?topics=AI,crypto
    6. Backend browses X.com, RSS, Reddit → returns collected posts
    7. App sends posts to agent via sendContextualUpdate()
    8. Agent reads summarized briefing aloud
    9. User interrupts: "Tell me more about that"
       → Agent elaborates (it has the full post data in context)
    10. User: "Read me the original post"
        → Agent reads source verbatim
    11. User: "What about sports?"
        → App calls backend to collect sports news
        → Sends new context to agent
        → Agent continues briefing with sports


    DATA FLOW
    =========

    [User says topics] → ElevenLabs STT → Agent understands topics
                                              │
    App calls backend ←───────────────────────┘
         │
    GET /api/collect?topics=AI,crypto
         │
    Backend:
    ├── X.com (Playwright) → search "AI", extract posts
    ├── RSS feeds → filter for "AI" keywords
    └── Reddit → search subreddits for "AI"
         │
    Returns JSON: { topics: { "AI": [...posts], "crypto": [...posts] } }
         │
    App receives posts
         │
    conversation.sendContextualUpdate(JSON.stringify(posts))
         │
    Agent has context → reads briefing → user interrupts by voice

Project Structure
interactive-radio/
├── .gitignore
├── .env.example
├── docker-compose.yml                 # Redis
│
├── backend/
│   ├── pyproject.toml
│   ├── .env
│   ├── main.py                        # FastAPI entry point
│   ├── config.py                      # pydantic-settings
│   │
│   ├── routers/
│   │   ├── collect.py                 # GET /api/collect?topics=AI,crypto
│   │   └── health.py                 # GET /api/health
│   │
│   ├── agent/
│   │   ├── collector.py               # Coordinate collection across sources
│   │   ├── browsers/
│   │   │   └── x_browser.py           # Playwright: browse/search X.com
│   │   └── fetchers/
│   │       ├── rss_fetcher.py         # feedparser + httpx
│   │       └── reddit_fetcher.py      # asyncpraw
│   │
│   ├── models/
│   │   └── feed_item.py               # Post/article pydantic model
│   │
│   ├── db/
│   │   └── redis_client.py            # Cache collected posts
│   │
│   └── utils/
│       └── topic_matcher.py           # Match feed items to user topics
│
├── mobile/
│   ├── package.json
│   ├── app.json
│   ├── tsconfig.json
│   │
│   ├── app/
│   │   ├── _layout.tsx                # Root layout + ElevenLabsProvider
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx            # Tab navigator
│   │   │   ├── index.tsx              # Main radio screen
│   │   │   ├── topics.tsx             # Briefing history
│   │   │   └── settings.tsx           # Sources, voice, agent config
│   │
│   ├── components/
│   │   ├── RadioPlayer.tsx            # Main player UI
│   │   ├── PlaybackControls.tsx       # Play/stop button
│   │   ├── NowPlaying.tsx             # Current topic + source
│   │   ├── AudioVisualizer.tsx        # Animated visualizer while agent speaks
│   │   ├── VoiceIndicator.tsx         # Shows when user is speaking
│   │   ├── CollectingStatus.tsx       # "Collecting news on AI, Crypto..."
│   │   ├── TopicTimeline.tsx          # Topics covered in briefing
│   │   └── SourceSelector.tsx         # Toggle sources
│   │
│   ├── hooks/
│   │   ├── useRadioAgent.ts           # Wraps useConversation + news collection
│   │   ├── useNewsCollection.ts       # Calls backend /api/collect
│   │   └── useRadioState.ts           # State machine
│   │
│   ├── contexts/
│   │   └── RadioContext.tsx            # Global radio state
│   │
│   ├── lib/
│   │   └── api.ts                     # REST client for backend
│   │
│   └── types/
│       └── radio.ts                   # Types for feed items, topics, etc.

Key Components
ElevenLabs Agent Configuration
The agent is configured on the ElevenLabs platform with:
System Prompt:
You are a news radio host. Your job is to read news briefings to the listener.

When you receive news data via context updates, summarize and present each topic
clearly and concisely. Use a professional, engaging tone like a radio news anchor.

Rules:
- Summarize each news item in 2-4 sentences by default
- When the listener asks "tell me more" or "go deeper", elaborate with full details
- When the listener asks "read me the post" or "read the original", read the
  source text exactly as provided in the context data
- When the listener says "next" or "skip", move to the next topic
- When the listener asks about a new topic (e.g., "what about sports?"), tell them
  you'll go collect news on that topic — the app will handle the actual collection
- Reference the source briefly: "From X...", "According to Reuters..."
- Group related items together
- At the start of a session, ask "What would you like to hear about today?"
- After finishing all topics: "That's your briefing. Want to hear about anything else?"
Client Tools (registered on ElevenLabs agent):
collect_news(topics: string[]):
  Description: "Collect news from sources for the given topics"
  → Triggers app to call backend, then send results back as context

This allows the agent to request news collection when the user asks about new topics.
Mobile: useRadioAgent Hook (hooks/useRadioAgent.ts)
The central hook that ties ElevenLabs conversation to news collection:
typescriptfunction useRadioAgent() {
  const conversation = useConversation();
  const { collectNews } = useNewsCollection();

  const start = async () => {
    await conversation.startSession({
      agentId: process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID,
      clientTools: {
        collect_news: async ({ topics }) => {
          // Agent asked for news → call backend → send context back
          const news = await collectNews(topics);
          conversation.sendContextualUpdate(JSON.stringify(news));
          return `Collected ${Object.keys(news).length} topics`;
        },
      },
    });
  };

  const stop = async () => {
    await conversation.endSession();
  };

  return {
    start,
    stop,
    status: conversation.status,         // connected, disconnected
    isSpeaking: conversation.isSpeaking,  // agent is speaking
  };
}
Mobile: useNewsCollection Hook (hooks/useNewsCollection.ts)
Calls the Python backend to collect news:
typescriptfunction useNewsCollection() {
  const collectNews = async (topics: string[]) => {
    const response = await fetch(
      `${API_URL}/api/collect?topics=${topics.join(",")}`
    );
    return response.json();
    // Returns: { "AI": [FeedItem, ...], "crypto": [FeedItem, ...] }
  };

  return { collectNews };
}
Backend: Collector (backend/agent/collector.py)
pythonclass NewsCollector:
    async def collect(self, topics: list[str]) -> dict[str, list[FeedItem]]:
        """Collect posts from all sources, grouped by topic."""
        results = {}
        for topic in topics:
            items = []
            fetched = await asyncio.gather(
                self.x_browser.search(topic),
                self.rss_fetcher.search(topic),
                self.reddit_fetcher.search(topic),
                return_exceptions=True,
            )
            for result in fetched:
                if isinstance(result, list):
                    items.extend(result)
            results[topic] = sorted(items, key=lambda x: x.published_at, reverse=True)
        return results
Backend: X.com Browser (backend/agent/browsers/x_browser.py)
pythonclass XBrowser:
    async def search(self, topic: str, count: int = 10) -> list[FeedItem]:
        """Search X.com for posts about a topic using Playwright."""
        await self.page.goto(f"https://x.com/search?q={quote(topic)}&f=live")
        await self.page.wait_for_selector('[data-testid="tweet"]')
        # Extract post text, author, engagement from DOM
        # Return as FeedItem list
Backend: REST Endpoint (backend/routers/collect.py)
python@router.get("/api/collect")
async def collect_news(topics: str = Query(...)):
    """Collect news for given topics from all sources."""
    topic_list = [t.strip() for t in topics.split(",")]
    collector = NewsCollector()
    results = await collector.collect(topic_list)
    return results
```

---

## Radio State Machine (`hooks/useRadioState.ts`)
```
idle → starting → asking_topics → collecting → briefing → idle
                                                  ↑
                                                  │ (user asks for new topic)
                                                  └─ collecting → briefing
```

Note: Voice interrupts (deep dive, skip, read original) are handled entirely by the ElevenLabs agent — no state change needed on the app side for those.

---

## UI Layout

**Main Radio Screen** (`app/(tabs)/index.tsx`):
- Large circular play/stop button
- Audio visualizer (animated while agent speaks)
- Source indicator: "Reading from X / Reuters / Reddit"
- Current topic display
- Voice indicator (shows when user is speaking)
- Collecting status: "Looking up AI, Crypto..." with loading animation

**Topics Screen** (`app/(tabs)/topics.tsx`):
- Today's briefing topics with brief summaries
- Tap to re-listen (triggers agent to re-read that section)

**Settings Screen** (`app/(tabs)/settings.tsx`):
- Toggle sources on/off (X, specific RSS feeds, Reddit subreddits)
- X.com authentication setup
- ElevenLabs voice selection
- Default topics (optional)

---

## Dependencies

### Backend (`pyproject.toml`)
```
fastapi
uvicorn[standard]
playwright                    # X.com browsing
httpx                         # Async HTTP
feedparser                    # RSS parsing
asyncpraw                     # Reddit API
redis[hiredis]                # Cache
pydantic-settings
python-dotenv
```

### Mobile (`package.json`)
```
expo
expo-router
@elevenlabs/react-native      # Conversational AI SDK
@livekit/react-native          # Required peer dep for ElevenLabs
@livekit/react-native-webrtc   # Required peer dep for ElevenLabs
livekit-client                 # Required peer dep for ElevenLabs
react-native-reanimated         # Animations
react-native-gesture-handler    # Gestures
lucide-react-native             # Icons
```

### Infrastructure
```
docker-compose.yml: Redis 7 Alpine
```

---

## Environment Variables

### Backend `.env`
```
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=InteractiveRadio/1.0
RSS_FEEDS=https://feeds.bbci.co.uk/news/rss.xml,https://feeds.reuters.com/reuters/topNews
REDIS_URL=redis://localhost:6379
X_COOKIES_PATH=./x_cookies.json
```

### Mobile `.env`
```
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_ELEVENLABS_AGENT_ID=your-agent-id-here

ElevenLabs Agent Setup
Before coding, set up the agent on the ElevenLabs platform:

Create a new Conversational AI agent at elevenlabs.io
Set the system prompt (news radio host persona, as described above)
Register the collect_news client tool
Choose a voice (e.g., "Rachel" or any preferred voice)
Configure LLM settings (model, temperature)
Get the Agent ID for the mobile app


Implementation Phases
Phase 1: ElevenLabs Agent Setup

Create agent on ElevenLabs platform
Configure system prompt for news radio host
Register collect_news client tool
Select voice
Test conversation via ElevenLabs playground

Phase 2: Project Scaffold

Create interactive-radio/ with backend/ and mobile/ subdirs
backend/: pyproject.toml, main.py (health endpoint), config.py
mobile/: Expo app with expo-router tabs, install ElevenLabs SDK + peer deps
docker-compose.yml with Redis
Verify both start

Phase 3: News Collection Backend

feed_item.py model
rss_fetcher.py: topic-filtered RSS fetching (test first, no API keys needed)
collector.py: coordinate across sources
collect.py router: GET /api/collect?topics=...
Redis caching
Test: curl /api/collect?topics=AI → get JSON of relevant posts

Phase 4: X.com Browser

Playwright setup + browser install
x_browser.py: topic search on X.com
Cookie-based auth
Integrate into collector
Test: collect("AI") includes X.com posts

Phase 5: Reddit

reddit_fetcher.py
Integrate into collector
Test: collect returns results from all 3 sources

Phase 6: Mobile — ElevenLabs Integration

Set up ElevenLabsProvider in _layout.tsx
Implement useRadioAgent.ts with useConversation
Wire collect_news client tool to backend
Implement useNewsCollection.ts
Test: start session → agent asks topics → speak → agent requests collection → app fetches → agent reads briefing

Phase 7: Mobile — UI

RadioPlayer, PlaybackControls, NowPlaying
AudioVisualizer (animate based on isSpeaking state)
VoiceIndicator
CollectingStatus
Radio state machine

Phase 8: Mobile — Topics & Settings

TopicTimeline screen
SourceSelector in settings
Voice selection

Phase 9: Polish

Error handling, reconnection
Loading states
Edge cases (no results for topic, network errors)
Lock screen awareness


Verification Plan

curl http://localhost:8000/api/health — backend running
curl http://localhost:8000/api/collect?topics=AI — returns collected posts
ElevenLabs playground: test agent conversation manually
Mobile: tap play → agent asks topics → say "AI" → see collecting → hear briefing
Voice interrupt: say "tell me more" → agent elaborates
Say "read me that post" → agent reads verbatim
Say "next" → agent skips to next topic
Say "what about sports?" → agent triggers collection → reads sports news
All 3 sources: verify posts from X, RSS, Reddit appear in briefing