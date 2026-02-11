import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { View } from "./Themed";

interface AudioVisualizerProps {
  isSpeaking: boolean;
}

export function AudioVisualizer({ isSpeaking }: AudioVisualizerProps) {
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.2);

  useEffect(() => {
    if (isSpeaking) {
      scale1.value = withRepeat(
        withSequence(
          withTiming(1.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      scale2.value = withRepeat(
        withSequence(
          withTiming(1.6, {
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      opacity1.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 800 }),
          withTiming(0.2, { duration: 800 })
        ),
        -1,
        true
      );
      opacity2.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 1200 }),
          withTiming(0.1, { duration: 1200 })
        ),
        -1,
        true
      );
    } else {
      scale1.value = withTiming(1, { duration: 300 });
      scale2.value = withTiming(1, { duration: 300 });
      opacity1.value = withTiming(0.15, { duration: 300 });
      opacity2.value = withTiming(0.1, { duration: 300 });
    }
  }, [isSpeaking]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ring, styles.ring2, ring2Style]} />
      <Animated.View style={[styles.ring, styles.ring1, ring1Style]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "#6366f1",
  },
  ring1: {
    width: 140,
    height: 140,
  },
  ring2: {
    width: 180,
    height: 180,
  },
});
