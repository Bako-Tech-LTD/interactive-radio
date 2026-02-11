import { StyleSheet } from "react-native";
import { Mic } from "lucide-react-native";
import { Text, View } from "./Themed";
import { useColorScheme } from "./useColorScheme";

export function VoiceIndicator() {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === "dark" ? "#a5b4fc" : "#6366f1";

  return (
    <View style={styles.container}>
      <Mic size={16} color={iconColor} />
      <Text style={styles.text}>Speak to interrupt</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    opacity: 0.6,
    marginBottom: 16,
  },
  text: {
    fontSize: 12,
  },
});
