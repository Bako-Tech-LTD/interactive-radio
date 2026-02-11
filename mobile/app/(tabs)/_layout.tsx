import React from "react";
import { Tabs } from "expo-router";
import { Radio, List, Settings } from "lucide-react-native";
import { TouchableOpacity, StyleSheet } from "react-native";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "#0f172a" : "#ffffff",
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colorScheme === "dark" ? "#333333" : "#e0e0e0",
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarHideOnKeyboard: true,
        tabBarButton: (props) => {
          const { children, style, onPress, onLongPress, testID, accessibilityRole } = props;
          return (
            <TouchableOpacity
              onPress={onPress ?? undefined}
              onLongPress={onLongPress ?? undefined}
              testID={testID ?? undefined}
              accessibilityRole={accessibilityRole}
              style={[style, styles.tabButton]}
              activeOpacity={0.7}
            >
              {children}
            </TouchableOpacity>
          );
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "News Briefing",
          tabBarIcon: ({ color, size }) => <Radio size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="topics"
        options={{
          title: "Topics",
          tabBarIcon: ({ color, size }) => <List size={24} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings size={24} color={color} />,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
