import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

function getNotifee() {
  // Lazy require — notifee throws on Expo Go
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("@notifee/react-native").default as typeof import("@notifee/react-native").default;
}

const INACTIVITY_REMINDER_KEY = "inactivity_reminder_enabled";
const INACTIVITY_REMINDER_HOUR_KEY = "inactivity_reminder_hour";
const INACTIVITY_REMINDER_MINUTE_KEY = "inactivity_reminder_minute";
const INACTIVITY_REMINDER_ID = "inactivity-reminder";

// expo-notifications remote push is not supported in Expo Go (SDK 53+).
// Lazy-require the module inside functions to avoid the module-level warning.
const isExpoGo = Constants.appOwnership === "expo";

function getNotifications() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("expo-notifications") as typeof import("expo-notifications");
}

// Set up foreground notification handling (only in dev builds)
if (!isExpoGo) {
  getNotifications().setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerForPushNotificationsAsync() {
  if (isExpoGo) return;

  const Notifications = getNotifications();

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Flow Alerts",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FBBF24",
    });
  }

  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return;

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: projectId || undefined,
      })
    ).data;
    return token;
  } catch (e) {
    console.log("Failed to get push token:", e);
  }
}

export async function scheduleInactivityReminder(hour = 21, minute = 0) {
  if (isExpoGo) return;
  const Notifications = getNotifications();

  await Notifications.cancelScheduledNotificationAsync(INACTIVITY_REMINDER_ID).catch(() => { });

  const trigger: any = {
    type: "daily",
    hour,
    minute,
    channelId: "default",
  };

  await Notifications.scheduleNotificationAsync({
    identifier: INACTIVITY_REMINDER_ID,
    content: {
      title: "You haven't logged anything today 📋",
      body: "Take a moment to track what you worked on — even one log counts.",
      sound: "default",
    },
    trigger,
  });

  await AsyncStorage.setItem(INACTIVITY_REMINDER_KEY, "true");
  await AsyncStorage.setItem(INACTIVITY_REMINDER_HOUR_KEY, String(hour));
  await AsyncStorage.setItem(INACTIVITY_REMINDER_MINUTE_KEY, String(minute));
}

export async function cancelInactivityReminder() {
  if (isExpoGo) return;
  const Notifications = getNotifications();
  await Notifications.cancelScheduledNotificationAsync(INACTIVITY_REMINDER_ID).catch(() => { });
  await AsyncStorage.setItem(INACTIVITY_REMINDER_KEY, "false");
}

/**
 * Call this whenever a log is completed for today.
 * Cancels today's inactivity notification and reschedules for tomorrow.
 */
export async function dismissInactivityReminderForToday() {
  if (isExpoGo) return;

  const [enabled, hourStr, minuteStr] = await Promise.all([
    AsyncStorage.getItem(INACTIVITY_REMINDER_KEY),
    AsyncStorage.getItem(INACTIVITY_REMINDER_HOUR_KEY),
    AsyncStorage.getItem(INACTIVITY_REMINDER_MINUTE_KEY),
  ]);

  if (enabled !== "true") return;

  // Reschedule — cancels and re-creates the daily trigger (effectively skips today
  // since the notification fires in the future and the daily trigger will next fire tomorrow)
  const hour = hourStr != null ? parseInt(hourStr) : 21;
  const minute = minuteStr != null ? parseInt(minuteStr) : 0;
  await scheduleInactivityReminder(hour, minute);
}

export async function getInactivityReminderSettings(): Promise<{
  enabled: boolean;
  hour: number;
  minute: number;
}> {
  const [enabled, hour, minute] = await Promise.all([
    AsyncStorage.getItem(INACTIVITY_REMINDER_KEY),
    AsyncStorage.getItem(INACTIVITY_REMINDER_HOUR_KEY),
    AsyncStorage.getItem(INACTIVITY_REMINDER_MINUTE_KEY),
  ]);
  return {
    enabled: enabled === "true",
    hour: hour != null ? parseInt(hour) : 21,
    minute: minute != null ? parseInt(minute) : 0,
  };
}

const TIMER_NOTIFICATION_ID = "timer-completion";

export async function scheduleTimerCompletionNotification(
  endTimeMs: number,
  title: string,
  body: string,
): Promise<void> {
  if (isExpoGo) return;
  const Notifications = getNotifications();
  await Notifications.cancelScheduledNotificationAsync(TIMER_NOTIFICATION_ID).catch(() => { });
  if (endTimeMs <= Date.now() + 2000) return;
  await Notifications.scheduleNotificationAsync({
    identifier: TIMER_NOTIFICATION_ID,
    content: { title, body, sound: "default" },
    trigger: {
      type: "date",
      date: new Date(endTimeMs),
      channelId: "default",
    } as any,
  });
}

export async function cancelTimerCompletionNotification(): Promise<void> {
  if (isExpoGo) return;
  const Notifications = getNotifications();
  await Notifications.cancelScheduledNotificationAsync(TIMER_NOTIFICATION_ID).catch(() => { });
}

const ONGOING_NOTIFICATION_ID = "timer-ongoing";
const ONGOING_NOTIFICATION_TITLE_KEY = "ongoing_notif_title";
const ONGOING_CHRONO_MS_KEY = "ongoing_chrono_ms";
const ONGOING_IS_COUNTDOWN_KEY = "ongoing_is_countdown";
const WAITING_BANNER_ID = "timer-waiting-banner";
export const TIMER_CATEGORY_RUNNING = "timer-running";
export const TIMER_CATEGORY_PAUSED = "timer-paused";
export const TIMER_CATEGORY_WAITING = "timer-waiting";
export const TIMER_STOP_ACTION = "stop";
export const TIMER_PAUSE_ACTION = "pause";
export const TIMER_RESUME_ACTION = "resume";
export const TIMER_NEXT_ROUND_ACTION = "next-round";

export async function setupTimerNotificationCategory(): Promise<void> {
  if (isExpoGo) return;

  if (Platform.OS === "android") {
    const notifee = getNotifee();
    await notifee.createChannel({ id: "timer", name: "Timer", importance: 4 /* HIGH */ });
    return;
  }

  const Notifications = getNotifications();
  await Promise.all([
    Notifications.setNotificationCategoryAsync(TIMER_CATEGORY_RUNNING, [
      {
        identifier: TIMER_PAUSE_ACTION,
        buttonTitle: "Pause",
        options: { opensAppToForeground: false },
      },
      {
        identifier: TIMER_STOP_ACTION,
        buttonTitle: "Stop",
        options: { opensAppToForeground: false, isDestructive: true },
      },
    ]),
    Notifications.setNotificationCategoryAsync(TIMER_CATEGORY_PAUSED, [
      {
        identifier: TIMER_RESUME_ACTION,
        buttonTitle: "Resume",
        options: { opensAppToForeground: false },
      },
      {
        identifier: TIMER_STOP_ACTION,
        buttonTitle: "Stop",
        options: { opensAppToForeground: false, isDestructive: true },
      },
    ]),
    Notifications.setNotificationCategoryAsync(TIMER_CATEGORY_WAITING, [
      {
        identifier: TIMER_NEXT_ROUND_ACTION,
        buttonTitle: "Next Round ▶",
        options: { opensAppToForeground: false },
      },
      {
        identifier: TIMER_STOP_ACTION,
        buttonTitle: "Stop",
        options: { opensAppToForeground: false, isDestructive: true },
      },
    ]),
  ]);
}

export async function showTimerOngoingNotification(
  title: string,
  body: string,
  paused = false,
  categoryOverride?: string,
  /**
   * Epoch ms used for the native chronometer (Android via notifee):
   * - countdown: pass the end time, set isCountdown=true
   * - count-up:  pass the effective start time (start_time + totalPausedMs)
   * The OS renders a live clock that ticks even after the app is killed.
   */
  chronoMs?: number,
  isCountdown = false,
): Promise<void> {
  if (isExpoGo) return;

  if (Platform.OS === "android") {
    const notifee = getNotifee();
    const isWaiting = categoryOverride === TIMER_CATEGORY_WAITING;
    const actions = isWaiting
      ? [
        { title: "Next Round ▶", pressAction: { id: TIMER_NEXT_ROUND_ACTION } },
        { title: "Stop", pressAction: { id: TIMER_STOP_ACTION } },
      ]
      : paused
        ? [
          { title: "Resume", pressAction: { id: TIMER_RESUME_ACTION } },
          { title: "Stop", pressAction: { id: TIMER_STOP_ACTION } },
        ]
        : [
          { title: "Pause", pressAction: { id: TIMER_PAUSE_ACTION } },
          { title: "Stop", pressAction: { id: TIMER_STOP_ACTION } },
        ];

    await AsyncStorage.setItem(ONGOING_NOTIFICATION_TITLE_KEY, title);
    if (chronoMs != null) {
      await AsyncStorage.setItem(ONGOING_CHRONO_MS_KEY, String(chronoMs));
      await AsyncStorage.setItem(ONGOING_IS_COUNTDOWN_KEY, isCountdown ? "1" : "0");
    }
    await notifee.displayNotification({
      id: ONGOING_NOTIFICATION_ID,
      title,
      body: undefined,
      android: {
        channelId: "timer",
        ongoing: true,
        onlyAlertOnce: true,
        showTimestamp: false,
        showChronometer: !paused && chronoMs != null,
        timestamp: chronoMs,
        chronometerDirection: isCountdown ? "down" : "up",
        actions,
        pressAction: { id: "default" },
      } as any,
    });
    return;
  }

  // iOS: expo-notifications
  const Notifications = getNotifications();
  const category = categoryOverride ?? (paused ? TIMER_CATEGORY_PAUSED : TIMER_CATEGORY_RUNNING);
  await Notifications.scheduleNotificationAsync({
    identifier: ONGOING_NOTIFICATION_ID,
    content: {
      title,
      body,
      sound: false,
      sticky: true,
      categoryIdentifier: category,
      data: { type: "timer-ongoing" },
    } as any,
    trigger: null,
  });
}

export async function showTimerOngoingNotificationPaused(): Promise<void> {
  if (isExpoGo || Platform.OS !== "android") return;
  const notifee = getNotifee();
  const title = (await AsyncStorage.getItem(ONGOING_NOTIFICATION_TITLE_KEY)) ?? "Timer";
  await notifee.displayNotification({
    id: ONGOING_NOTIFICATION_ID,
    title: `⏸ ${title}`,
    body: undefined,
    android: {
      channelId: "timer",
      ongoing: true,
      onlyAlertOnce: true,
      showTimestamp: false,
      showChronometer: false,
      actions: [
        { title: "Resume", pressAction: { id: TIMER_RESUME_ACTION } },
        { title: "Stop", pressAction: { id: TIMER_STOP_ACTION } },
      ],
      pressAction: { id: "default" },
    } as any,
  });
}

export async function showTimerOngoingNotificationResumed(): Promise<void> {
  if (isExpoGo || Platform.OS !== "android") return;
  const notifee = getNotifee();
  const title = (await AsyncStorage.getItem(ONGOING_NOTIFICATION_TITLE_KEY)) ?? "Timer";
  const chronoMsStr = await AsyncStorage.getItem(ONGOING_CHRONO_MS_KEY);
  const isCountdownStr = await AsyncStorage.getItem(ONGOING_IS_COUNTDOWN_KEY);
  const isCountdown = isCountdownStr === "1";
  // Adjust chrono: for countdown, the end time shifts by however long we were paused.
  // We don't know the exact pause duration in background, so we just use stored value as best effort.
  const chronoMs = chronoMsStr != null ? parseInt(chronoMsStr) : undefined;
  await notifee.displayNotification({
    id: ONGOING_NOTIFICATION_ID,
    title,
    body: undefined,
    android: {
      channelId: "timer",
      ongoing: true,
      onlyAlertOnce: true,
      showTimestamp: false,
      showChronometer: chronoMs != null,
      timestamp: chronoMs,
      chronometerDirection: isCountdown ? "down" : "up",
      actions: [
        { title: "Pause", pressAction: { id: TIMER_PAUSE_ACTION } },
        { title: "Stop", pressAction: { id: TIMER_STOP_ACTION } },
      ],
      pressAction: { id: "default" },
    } as any,
  });
}

export async function dismissTimerOngoingNotification(): Promise<void> {
  if (isExpoGo) return;

  if (Platform.OS === "android") {
    const notifee = getNotifee();
    await notifee.cancelNotification(ONGOING_NOTIFICATION_ID).catch(() => { });
    return;
  }

  const Notifications = getNotifications();
  await Notifications.dismissNotificationAsync(ONGOING_NOTIFICATION_ID).catch(() => { });
  await Notifications.cancelScheduledNotificationAsync(ONGOING_NOTIFICATION_ID).catch(() => { });
}

/**
 * Shows a banner-style (non-sticky) notification when a round/session finishes,
 * with Next Round and Stop action buttons. This pops over the screen even when minimized.
 */
export async function showWaitingBannerNotification(
  title: string,
  body: string,
): Promise<void> {
  if (isExpoGo) return;
  const Notifications = getNotifications();
  await Notifications.cancelScheduledNotificationAsync(WAITING_BANNER_ID).catch(() => { });
  await Notifications.scheduleNotificationAsync({
    identifier: WAITING_BANNER_ID,
    content: {
      title,
      body,
      sound: "default",
      categoryIdentifier: TIMER_CATEGORY_WAITING,
      data: { type: "timer-waiting" },
    },
    trigger: Platform.OS === "android"
      ? { type: "channel", channelId: "default" } as any
      : null,
  });
}

export async function dismissWaitingBannerNotification(): Promise<void> {
  if (isExpoGo) return;
  const Notifications = getNotifications();
  await Notifications.dismissNotificationAsync(WAITING_BANNER_ID).catch(() => { });
  await Notifications.cancelScheduledNotificationAsync(WAITING_BANNER_ID).catch(() => { });
}

export async function sendLocalNotification(
  title: string,
  body: string,
  data = {},
) {
  const Notifications = getNotifications();
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: "default",
    },
    trigger: Platform.OS === "android"
      ? { type: "channel", channelId: "default" } as Parameters<typeof Notifications.scheduleNotificationAsync>[0]["trigger"]
      : null,
  });
}
