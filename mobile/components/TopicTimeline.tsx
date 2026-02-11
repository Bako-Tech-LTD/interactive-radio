import { StyleSheet, FlatList } from "react-native";
import { Text, View } from "./Themed";
import type { CoveredTopic } from "@/types/radio";

interface TopicTimelineProps {
  topics: CoveredTopic[];
}

export function TopicTimeline({ topics }: TopicTimelineProps) {
  return (
    <FlatList
      data={topics}
      keyExtractor={(item, index) => `${item.name}-${index}`}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <View style={styles.dot} />
          <View style={styles.content}>
            <Text style={styles.time}>
              {item.coveredAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            <Text style={styles.topic}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.itemCount} items from {item.sources.join(", ")}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 12,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#6366f1",
    marginTop: 6,
  },
  content: {
    flex: 1,
  },
  time: {
    fontSize: 12,
    opacity: 0.5,
  },
  topic: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },
  meta: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
});
