import { useState, useEffect, useCallback, useRef } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import { WifiOff, RefreshCw } from "lucide-react-native";

import { Text, View } from "./Themed";
import { useRadioAgent } from "@/hooks/useRadioAgent";
import { useRadioContext } from "@/contexts/RadioContext";
import { healthCheck, HealthStatus } from "@/lib/api";
import { SpeechAnimation } from "./SpeechAnimation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ORB_SIZE = Math.max(SCREEN_WIDTH * 0.7, 450);

export function RadioPlayer() {
  const { start, stop, isSpeaking } = useRadioAgent();
  const { state, currentTopic, error, dispatch } = useRadioContext();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const isActive = state !== "idle" && state !== "error";


  // Check backend connectivity
  const checkBackendHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      const health = await healthCheck();
      setBackendOnline(health !== null);
      setHealthStatus(health);
      if (health !== null) {
        setRetryCount(0);
      }
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(() => {
      if (!isActive) checkBackendHealth();
    }, 30_000);
    return () => clearInterval(interval);
  }, [isActive, checkBackendHealth]);

  // Pulse animation
  useEffect(() => {
    if (!isActive) {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
      return;
    }

    const duration = isSpeaking ? 1000 : 1800;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [isActive, isSpeaking, pulseAnim]);


  // Rotation animation
  useEffect(() => {
    if (!isActive) {
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 30000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    animation.start();
    return () => animation.stop();
  }, [isActive, rotateAnim]);

  const handlePress = async () => {
    if (isActive) {
      await stop();
      setRetryCount(0);
    } else {
      if (state === "error") {
        dispatch({ type: "RESET" });
        setRetryCount((prev) => prev + 1);
      }
      await start();
    }
  };

  const handleRetryConnection = async () => {
    await checkBackendHealth();
  };

  const getStatusText = () => {
    switch (state) {
      case "collecting":
        return "Collecting news...";
      case "briefing":
        return currentTopic ? `Briefing: ${currentTopic}` : "Briefing...";
      case "asking_topics":
        return "Tap to stop";
      case "starting":
        return "Connecting...";
      case "error":
        return error || "Error occurred";
      case "idle":
      default:
        if (backendOnline === false) {
          return "Backend offline";
        }
        return "Tap to start";
    }
  };

  // Interpolations
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, isSpeaking ? 1.12 : 1.06],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const showError = state === "error" || backendOnline === false;
  const showRetry = backendOnline === false && !isActive;

  return (
    <View style={styles.container}>
      {/* Top status */}
      <View style={styles.topSection}>
        {/* <Text style={[styles.statusText, showError && styles.errorText]}>
          {getStatusText()}
        </Text> */}
        {/* {state === "asking_topics" && (
          <View style={styles.listeningBadge}>
            <Mic size={14} color="#6366f1" />
            <Text style={styles.listeningText}>Listening</Text>
          </View>
        )} */}
      </View>

      {/* Orb container */}
      <View style={styles.orbContainer}>
        {/* Lottie speech animation - always visible, animates when speaking */}
        <TouchableOpacity
          onPress={!isActive ? handlePress : undefined}
          activeOpacity={0.9}
          disabled={state === "starting" || isActive}
          style={styles.animationTouchable}
        >
          <SpeechAnimation isPlaying={isSpeaking} size={ORB_SIZE} isVisible={true} />
          
          {/* Text overlay */}
          <View style={styles.textOverlay}>
            <Text style={styles.orbText}>{getStatusText()}</Text>
          </View>
        </TouchableOpacity>

        {/* Stop button outside the circle */}
        {/* {isActive && (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <Text style={styles.stopButtonText}>Tap to stop</Text>
          </TouchableOpacity>
        )} */}
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {showRetry && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetryConnection}
            disabled={isCheckingHealth}
          >
            {isCheckingHealth ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <>
                <RefreshCw size={16} color="#6366f1" />
                <Text style={styles.retryText}>Retry connection</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {showError && !showRetry && (
          <View style={styles.errorBadge}>
            <WifiOff size={14} color="#ef4444" />
            <Text style={styles.errorBadgeText}>Connection issue</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 80,
    paddingHorizontal: 24,
    width: "100%",
  },
  topSection: {
    alignItems: "center",
    gap: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: "600",
    opacity: 0.9,
    textAlign: "center",
  },
  errorText: {
    color: "#ef4444",
  },
  listeningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    borderRadius: 16,
  },
  listeningText: {
    fontSize: 13,
    color: "#6366f1",
    fontWeight: "600",
  },
  orbContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: ORB_SIZE + 120,
    height: ORB_SIZE + 120,
  },
  animationTouchable: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  textOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 24,
  },
  orbText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  loadingOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  stopButton: {
    position: "absolute",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  stopButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  bottomSection: {
    alignItems: "center",
    minHeight: 50,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#6366f1",
    backgroundColor: "rgba(99, 102, 241, 0.08)",
  },
  retryText: {
    fontSize: 14,
    color: "#6366f1",
    fontWeight: "600",
  },
  errorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 16,
  },
  errorBadgeText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "500",
  },
});
