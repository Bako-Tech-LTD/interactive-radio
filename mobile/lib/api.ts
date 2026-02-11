const API_URL = __DEV__ ? "http://localhost:8000" : process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

const REQUEST_TIMEOUT_MS = 30_000;

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public detail?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new ApiError(
        "Request timed out. The server may be busy collecting news.",
        408
      );
    }
    throw new ApiError(
      "Cannot reach the server. Check your connection and ensure the backend is running.",
      0
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function collectNews(
  topics: string[],
  sources?: string[]
): Promise<Record<string, any[]>> {
  const params = new URLSearchParams({
    topics: topics.join(","),
  });

  if (sources && sources.length > 0) {
    params.set("sources", sources.join(","));
  }

  // Use a longer timeout for collection since it involves fetching from multiple sources
  const response = await fetchWithTimeout(
    `${API_URL}/api/collect?${params.toString()}`,
    60_000
  );

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const body = await response.json();
      detail = body.detail;
    } catch {
      // Response body wasn't JSON
    }

    throw new ApiError(
      detail || `Failed to collect news (${response.status})`,
      response.status,
      detail
    );
  }

  return response.json();
}

export interface HealthStatus {
  status: string;
  services: {
    redis: boolean;
    rss: boolean;
    reddit: boolean;
    twitter: boolean;
  };
}

export async function healthCheck(): Promise<HealthStatus | null> {
  try {
    const response = await fetchWithTimeout(`${API_URL}/api/health`, 5_000);
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}
