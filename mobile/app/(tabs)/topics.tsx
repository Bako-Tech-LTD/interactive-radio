import { StyleSheet, FlatList } from "react-native";

import { Text, View } from "@/components/Themed";
import { useRadioContext } from "@/contexts/RadioContext";
import { TopicTimeline } from "@/components/TopicTimeline";
import ScreenHeader from "@/components/ScreenHeader";

export default function TopicsScreen() {
  const { coveredTopics } = useRadioContext();
  
  console.log("📋 Topics screen - coveredTopics:", coveredTopics.length, coveredTopics);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Topics" showBackButton={false} />
      {coveredTopics.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No topics covered yet.</Text>
          <Text style={styles.emptySubtext}>
            Start the radio to begin your briefing.
          </Text>
        </View>
      ) : (
        <TopicTimeline topics={coveredTopics} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: "center",
  },
});
