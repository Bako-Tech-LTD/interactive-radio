import { StyleSheet, Switch } from "react-native";

import { Text, View } from "@/components/Themed";
import { useRadioContext, type SourceConfig } from "@/contexts/RadioContext";
import ScreenHeader from "@/components/ScreenHeader";

const SOURCE_INFO: Record<
  keyof SourceConfig,
  { label: string; description: string }
> = {
  rss: {
    label: "RSS Feeds",
    description: "BBC, Reuters, and other news feeds",
  },
  twitter: {
    label: "X (Twitter)",
    description: "Posts from X.com (requires cookies auth on backend)",
  },
  reddit: {
    label: "Reddit",
    description: "Posts from popular subreddits (requires API keys)",
  },
};

export default function SettingsScreen() {
  const { enabledSources, dispatch, state } = useRadioContext();
  const isActive = state !== "idle" && state !== "error";

  const toggleSource = (source: keyof SourceConfig) => {
    dispatch({ type: "TOGGLE_SOURCE", payload: source });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Settings" showBackButton={false} />
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>News Sources</Text>
      {isActive && (
        <Text style={styles.warningText}>
          Source changes will apply to the next collection request.
        </Text>
      )}

      {(Object.keys(SOURCE_INFO) as (keyof SourceConfig)[]).map((key) => (
        <View key={key} style={styles.settingRow}>
          <View style={styles.labelContainer}>
            <Text style={styles.settingLabel}>{SOURCE_INFO[key].label}</Text>
            <Text style={styles.settingDescription}>
              {SOURCE_INFO[key].description}
            </Text>
          </View>
          <Switch
            value={enabledSources[key]}
            onValueChange={() => toggleSource(key)}
            trackColor={{ true: "#6366f1" }}
          />
        </View>
      ))}

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.infoText}>
          Interactive Radio collects news from your enabled sources, then uses an
          AI agent to read summarized briefings aloud. Speak to the agent anytime
          to ask questions, dive deeper, or change topics.
        </Text>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  warningText: {
    fontSize: 12,
    color: "#f59e0b",
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(150,150,150,0.3)",
  },
  labelContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingDescription: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  infoSection: {
    marginTop: 32,
  },
  infoText: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
});
