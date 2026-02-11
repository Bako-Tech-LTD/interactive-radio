import { useState, useCallback } from "react";
import { collectNews, ApiError } from "@/lib/api";
import { useRadioContext } from "@/contexts/RadioContext";

export function useNewsCollection() {
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectionError, setCollectionError] = useState<string | null>(null);
  const { enabledSources } = useRadioContext();

  const collect = useCallback(
    async (topics: string[]): Promise<Record<string, any[]>> => {
      setIsCollecting(true);
      setCollectionError(null);

      try {
        // Build list of enabled source names
        const sources = Object.entries(enabledSources)
          .filter(([, enabled]) => enabled)
          .map(([name]) => name);

        if (sources.length === 0) {
          throw new Error(
            "No news sources enabled. Enable at least one source in Settings."
          );
        }

        const results = await collectNews(topics, sources);

        // Check if we got any results at all
        const totalItems = Object.values(results).flat().length;
        if (totalItems === 0) {
          // Return empty results — the agent will handle the "no results" case
          console.warn(
            `No news found for topics: ${topics.join(", ")} from sources: ${sources.join(", ")}`
          );
        }

        return results;
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "An unexpected error occurred while collecting news.";

        setCollectionError(message);
        // Re-throw so the caller (useRadioAgent) can handle it
        throw error;
      } finally {
        setIsCollecting(false);
      }
    },
    [enabledSources]
  );

  return { collect, isCollecting, collectionError };
}
