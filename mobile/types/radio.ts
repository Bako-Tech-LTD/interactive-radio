export type RadioState =
  | "idle"
  | "starting"
  | "asking_topics"
  | "collecting"
  | "briefing"
  | "error";

export interface FeedItem {
  title: string;
  content: string;
  url: string | null;
  source: "twitter" | "rss" | "reddit";
  source_name: string;
  author: string | null;
  published_at: string;
  engagement: number;
}

export interface TopicData {
  name: string;
  items: FeedItem[];
  coveredAt?: Date;
}

export interface CoveredTopic {
  name: string;
  itemCount: number;
  coveredAt: Date;
  sources: string[];
}
