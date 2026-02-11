import { StyleSheet, View } from "react-native";

import { RadioPlayer } from "@/components/RadioPlayer";
import { useColorScheme } from "@/components/useColorScheme";
import ScreenHeader from "@/components/ScreenHeader";

export default function RadioScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#fff" : "#ffffff" },
      ]}
    >
      <ScreenHeader title="News Briefing" showBackButton={false} />
      <RadioPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
