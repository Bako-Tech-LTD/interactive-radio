import { useCallback, useMemo, useState } from "react";
import { useConversation } from "@elevenlabs/react-native";
import { useNewsCollection } from "./useNewsCollection";
import { useRadioContext } from "@/contexts/RadioContext";

const AGENT_ID = process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID ?? "";

export function useRadioAgent() {
  const { collect } = useNewsCollection();
  const { dispatch } = useRadioContext();
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Define client tools - these are passed to useConversation
  const clientTools = useMemo(
    () => ({
      collect_news: async (parameters: unknown) => {
        const { topics } = parameters as { topics: string[] };
        console.log("🎯 collect_news tool called with topics:", topics);
        dispatch({ type: "SET_STATE", payload: "collecting" });

        try {
          const news = await collect(topics);

          // Track covered topics
          for (const topic of topics) {
            const items = news[topic] ?? [];
            const coveredTopic = {
              name: topic,
              itemCount: items.length,
              coveredAt: new Date(),
              sources: [...new Set(items.map((item: any) => item.source_name))],
            };
            console.log("📝 Adding covered topic:", coveredTopic);
            dispatch({
              type: "ADD_COVERED_TOPIC",
              payload: coveredTopic,
            });
          }

          dispatch({ type: "SET_STATE", payload: "briefing" });

          const totalItems = Object.values(news).flat().length;

          if (totalItems === 0) {
            return `No news articles found for ${topics.join(", ")}. Let the listener know and suggest trying different topics or enabling more sources in Settings.`;
          }

          // Return the news data as a string for the agent to use
          return JSON.stringify(news);
        } catch (error) {
          dispatch({ type: "SET_STATE", payload: "asking_topics" });

          const message =
            error instanceof Error ? error.message : "Unknown collection error";

          return `Failed to collect news: ${message}. Apologize to the listener and suggest they try again or check their settings.`;
        }
      },
    }),
    [collect, dispatch]
  );

  // Pass clientTools to useConversation with debug callbacks
  const conversation = useConversation({ 
    clientTools,
    onConnect: () => {
      console.log("✅ ElevenLabs connected");
    },
    onDisconnect: () => {
      console.log("❌ ElevenLabs disconnected");
      setIsSpeaking(false);
      stop()
    },
    onMessage: (message) => {
      console.log("📨 Message from agent:", message);
      
      // Set speaking state when agent sends a message
      if (message.role === "agent") {
        setIsSpeaking(true);
      }
    },
    onModeChange: ({ mode }) => {
      console.log("🔄 Mode changed to:", mode);
      // Set speaking state based on mode
      // Mode can be "speaking", "listening", or "thinking"
      setIsSpeaking(true);
    },
    onError: (error) => {
      console.log("🚨 ElevenLabs error:", error);
      setIsSpeaking(false);
    },
  });

  const start = useCallback(async () => {
    if (!AGENT_ID) {
      dispatch({
        type: "SET_ERROR",
        payload:
          "ElevenLabs Agent ID is not configured. Set EXPO_PUBLIC_ELEVENLABS_AGENT_ID in your environment.",
      });
      return;
    }

    dispatch({ type: "SET_STATE", payload: "starting" });

    try {
      await conversation.startSession({
        agentId: AGENT_ID,
      });

      dispatch({ type: "SET_STATE", payload: "asking_topics" });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to connect. Check your internet connection and try again.",
      });
    }
  }, [conversation, dispatch]);

  const stop = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch {
      // Session might already be ended
    }
    dispatch({ type: "RESET" });
  }, [conversation, dispatch]);

  return {
    start,
    stop,
    status: conversation.status,
    isSpeaking,
  };
}
