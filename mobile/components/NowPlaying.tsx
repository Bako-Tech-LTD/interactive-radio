import { StyleSheet } from "react-native";
import { Text, View } from "./Themed";

interface NowPlayingProps {
  topic: string | null;
}

export function NowPlaying({ topic }: NowPlayingProps) {
  if (!topic) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>NOW READING</Text>
      <Text style={styles.topic}>{topic}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    opacity: 0.5,
    marginBottom: 4,
  },
  topic: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});
