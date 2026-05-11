import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect, useRef } from "react";
import { LogBox } from "react-native";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT,
      description TEXT,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      duration INTEGER,
      target_duration INTEGER,
      created_at INTEGER NOT NULL
    );
  `);

  // Migration: Add description column if it doesn't exist (for existing users)
  try {
    await db.execAsync("ALTER TABLE activities ADD COLUMN description TEXT;");
    console.log("Migration: Added description column");
  } catch (error) {}

  try {
    await db.execAsync(
      "ALTER TABLE activities ADD COLUMN target_duration INTEGER;",
    );
    console.log("Migration: Added target_duration column");
  } catch (error) {}
}

import ShakeUndoListener from "@/components/app/ShakeUndoListener";
import FloatingTimer from "@/components/log/FloatingTimer";
import { LanguageProvider } from "@/context/LanguageContext";
import { OnboardingProvider, useOnboarding } from "@/context/OnboardingContext";
import { SummaryVisibleProvider } from "@/context/SummaryVisibleContext";
import { TrackingProvider, useTracking } from "@/context/TrackingContext";
import { loadHapticsPreference } from "@/utils/haptics";
import {
    setupTimerNotificationCategory,
    showTimerOngoingNotificationPaused,
    showTimerOngoingNotificationResumed,
    TIMER_NEXT_ROUND_ACTION,
    TIMER_PAUSE_ACTION,
    TIMER_RESUME_ACTION,
    TIMER_STOP_ACTION,
} from "@/utils/notifications";
import { loadShakeUndoPreference } from "@/utils/shakeUndoPrefs";
import { loadTimerState } from "@/utils/timerState";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";

// Register notifee background event handler (Android only).
// This runs when the app is killed or in background and the user taps a notification action.
if (Platform.OS === "android") {
  try {
    const notifee = require("@notifee/react-native")
      .default as typeof import("@notifee/react-native").default;
    const { EventType } =
      require("@notifee/react-native") as typeof import("@notifee/react-native");
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        // Plain tap on notification — navigate to tracker when app foregrounds
        await AsyncStorage.setItem("pending_notif_action", "open_tracker");
        return;
      }
      if (type !== EventType.ACTION_PRESS) return;
      const actionId = detail.pressAction?.id;
      if (actionId === TIMER_PAUSE_ACTION) {
        await AsyncStorage.setItem("pending_notif_action", actionId);
        await showTimerOngoingNotificationPaused();
      } else if (actionId === TIMER_RESUME_ACTION) {
        await AsyncStorage.setItem("pending_notif_action", actionId);
        await showTimerOngoingNotificationResumed();
      } else if (
        actionId === TIMER_STOP_ACTION ||
        actionId === TIMER_NEXT_ROUND_ACTION
      ) {
        await AsyncStorage.setItem("pending_notif_action", actionId);
      }
    });
  } catch {}
}

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
LogBox.ignoreLogs([
  "SafeAreaView has been deprecated and will be removed in a future release. Please use 'react-native-safe-area-context' instead.",
]);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      loadHapticsPreference();
      void loadShakeUndoPreference();
      setupTimerNotificationCategory();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SQLiteProvider databaseName="klowk.db" onInit={migrateDbIfNeeded}>
        <LanguageProvider>
          <TrackingProvider>
            <OnboardingProvider>
              <SummaryVisibleProvider>
                <RootLayoutNav />
              </SummaryVisibleProvider>
            </OnboardingProvider>
          </TrackingProvider>
        </LanguageProvider>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

const COLOR_SCHEME_KEY = "klowk_color_scheme";

function RootLayoutNav() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { isOnboarded } = useOnboarding();
  const { currentActivity, isMinimized } = useTracking();
  const router = useRouter();
  const hasRestoredSession = useRef(false);

  // Restore saved color scheme on launch
  useEffect(() => {
    AsyncStorage.getItem(COLOR_SCHEME_KEY).then((saved) => {
      if (saved === "dark" || saved === "light") setColorScheme(saved);
    });
  }, []);

  // When Android notification is tapped while app is backgrounded, open tracker
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const checkPendingNav = async () => {
      const action = await AsyncStorage.getItem("pending_notif_action");
      if (action === "open_tracker") {
        await AsyncStorage.removeItem("pending_notif_action");
        router.push("/tracker" as any);
      }
    };
    checkPendingNav();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkPendingNav();
    });
    return () => sub.remove();
  }, []);

  // If the app was killed while a timer was running, restore to tracker.
  // Guard: only fires once, and not when the user simply minimized (isMinimized=true already
  // means they intentionally left the tracker open as a floating bubble).
  useEffect(() => {
    if (hasRestoredSession.current || !currentActivity || isMinimized) return;
    hasRestoredSession.current = true;
    loadTimerState().then((state) => {
      if (!state) return;
      const p = state.params;
      const query = Object.entries(p)
        .filter(([, v]) => v !== undefined)
        .map(
          ([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`,
        )
        .join("&");
      router.replace(`/tracker?${query}` as any);
    });
  }, [currentActivity, isMinimized]);

  useEffect(() => {
    if (!isOnboarded) {
      router.replace("/onboarding/handshake");
    }
  }, [isOnboarded]);

  const AppDarkTheme = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: "#121212", card: "#121212" },
  };
  const AppLightTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: "#FFFFFF", card: "#FFFFFF" },
  };

  const bg = colorScheme === "dark" ? "#121212" : "#FFFFFF";

  return (
    <ThemeProvider
      value={colorScheme === "dark" ? AppDarkTheme : AppLightTheme}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: bg },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ contentStyle: { backgroundColor: bg } }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
            contentStyle: { backgroundColor: bg },
          }}
        />
        <Stack.Screen
          name="logmanual"
          options={{
            presentation: "modal",
            contentStyle: { backgroundColor: bg },
          }}
        />
        <Stack.Screen
          name="live"
          options={{
            presentation: "modal",
            contentStyle: { backgroundColor: bg },
          }}
        />
        <Stack.Screen
          name="tracker"
          options={{
            presentation: "fullScreenModal",
            animation: "none",
            contentStyle: { backgroundColor: bg },
          }}
        />
        <Stack.Screen
          name="chat"
          options={{ contentStyle: { backgroundColor: bg } }}
        />
        <Stack.Screen
          name="chat-help"
          options={{ contentStyle: { backgroundColor: bg } }}
        />
        <Stack.Screen
          name="settings"
          options={{ contentStyle: { backgroundColor: bg } }}
        />
        <Stack.Screen
          name="help"
          options={{ contentStyle: { backgroundColor: bg } }}
        />
        <Stack.Screen
          name="about"
          options={{ contentStyle: { backgroundColor: bg } }}
        />
        <Stack.Screen
          name="privacy"
          options={{ contentStyle: { backgroundColor: bg } }}
        />
        <Stack.Screen
          name="history"
          options={{ contentStyle: { backgroundColor: bg } }}
        />
        <Stack.Screen
          name="categories"
          options={{ contentStyle: { backgroundColor: bg } }}
        />
        <Stack.Screen
          name="camera-picker"
          options={{
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
            contentStyle: { backgroundColor: "#000" },
          }}
        />
        <Stack.Screen
          name="share-session"
          options={{ contentStyle: { backgroundColor: bg } }}
        />
      </Stack>
      {isOnboarded && <FloatingTimer />}
      {isOnboarded && <ShakeUndoListener />}
    </ThemeProvider>
  );
}
