import { StyleSheet, ActivityIndicator } from "react-native";
import { Text, View } from "./Themed";

export function CollectingStatus() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#6366f1" />
      <Text style={styles.text}>Collecting news...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  text: {
    fontSize: 16,
    opacity: 0.7,
  },
});
