import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";

import { RadioProvider } from "@/contexts/RadioContext";
import { ElevenLabsProvider } from "@elevenlabs/react-native";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  // Background audio configuration
  useEffect(() => {
    const configureAudio = async () => {
      try {
        const { Audio, InterruptionModeIOS, InterruptionModeAndroid } = await import("expo-av");
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
        console.log("Background audio enabled");
      } catch (e) {
        console.log("Background audio not available - rebuild required");
      }
    };
    configureAudio();
  }, []);

  return (
    <ElevenLabsProvider>
      <ThemeProvider value={DefaultTheme}>
        <RadioProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </RadioProvider>
      </ThemeProvider>
    </ElevenLabsProvider>
  );
}
