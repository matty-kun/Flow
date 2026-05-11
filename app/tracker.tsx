import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTracking } from "@/context/TrackingContext";
import TimerControls from "@/components/tracker/TimerControls";
import TimerRing, { CIRCUMFERENCE } from "@/components/tracker/TimerRing";
import TimerSettingsModal from "@/components/tracker/TimerSettingsModal";
import {
  cancelTimerCompletionNotification,
  dismissTimerOngoingNotification,
  dismissWaitingBannerNotification,
  scheduleTimerCompletionNotification,
  sendLocalNotification,
  setupTimerNotificationCategory,
  showTimerOngoingNotification,
  showWaitingBannerNotification,
  TIMER_CATEGORY_WAITING,
  TIMER_NEXT_ROUND_ACTION,
  TIMER_PAUSE_ACTION,
  TIMER_RESUME_ACTION,
  TIMER_STOP_ACTION,
} from "@/utils/notifications";
import { DEFAULT_POMODORO_SETTINGS, loadPomodoroSettings, savePomodoroSettings } from "@/utils/pomodoro";
import { clearTimerState, loadTimerState, saveTimerState } from "@/utils/timerState";
import { Audio } from "expo-av";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { impact, notification } from "@/utils/haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { formatLogDuration } from "@/utils/time";
import { Minimize2, Settings, Share2 } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { getContrastingColor, useAppTheme } from "@/context/ThemeContext";
import { AppState, Platform, Pressable, StyleSheet, Vibration, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrackerPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    pomodoro?: string;
    workSecs?: string;
    shortBreakSecs?: string;
    longBreakSecs?: string;
    rounds?: string;
    baseTitle?: string;
    category?: string;
    targetSecs?: string;
  }>();

  const isPomodoroMode = params.pomodoro === "true";
  const pInitialTargetSecs = parseInt(params.targetSecs || "0");
  const pWorkSecs = parseInt(params.workSecs || "1500");
  const pShortBreakSecs = parseInt(params.shortBreakSecs || "300");
  const pLongBreakSecs = parseInt(params.longBreakSecs || "900");
  const pTotalRounds = parseInt(params.rounds || "4");
  const pBaseTitle = params.baseTitle || "";
  const pCategory = params.category || "work";

  const { currentActivity, startTracker, stopTracker, setIsMinimized, categories } =
    useTracking();
  const lastActivity = useRef(currentActivity);
  if (currentActivity) lastActivity.current = currentActivity;
  const activity = lastActivity.current;

  const [isPaused, setIsPaused] = useState(false);
  const [accumulatedSecs, setAccumulatedSecs] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);
  const [pomodoroWaiting, setPomodoroWaiting] = useState(false);
  const [midRoundWaiting, setMidRoundWaiting] = useState(false);
  const [roundDisplay, setRoundDisplay] = useState(1);
  const [phaseDisplay, setPhaseDisplay] = useState<"work" | "break">("work");
  const [autoNextRound, setAutoNextRound] = useState(DEFAULT_POMODORO_SETTINGS.autoNextRound);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const completedAtMs = useRef<number>(0);

  const hasAlerted = useRef(false);
  const alarmSoundRef = useRef<Audio.Sound | null>(null);
  const pausedAtMs = useRef<number | null>(null);
  const totalPausedMs = useRef(0);
  const phaseStartMs = useRef<number>(Date.now());
  const pendingTargetSecs = useRef<number>(0);
  const pomodoroRound = useRef(1);
  const pomodoroPhase = useRef<"work" | "break">("work");
  const isCycling = useRef(false);
  const isMinimizingRef = useRef(false);
  const handleStopRef = useRef<() => void>(() => {});
  const togglePauseRef = useRef<() => void>(() => {});
  const handleNextRoundFromNotifRef = useRef<() => void>(() => {});

  const progressShared = useSharedValue(1);

  // ── Setup ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    loadPomodoroSettings().then((s) => setAutoNextRound(s.autoNextRound));
  }, []);

  useEffect(() => {
    setupTimerNotificationCategory();
  }, []);

  useEffect(() => {
    loadTimerState().then((saved) => {
      if (!saved) { persistState(); return; }
      pomodoroRound.current = saved.pomodoroRound;
      pomodoroPhase.current = saved.pomodoroPhase;
      setRoundDisplay(saved.pomodoroRound);
      setPhaseDisplay(saved.pomodoroPhase);
      totalPausedMs.current = saved.totalPausedMs;
      if (saved.isPaused) {
        pausedAtMs.current = saved.pausedAtMs;
        setIsPaused(true);
      }
    });
  }, []);

  // Notification action listener — expo-notifications (iOS) + notifee (Android)
  useEffect(() => {
    if (Platform.OS === "android") {
      // notifee foreground event handler
      const notifee = require("@notifee/react-native").default as typeof import("@notifee/react-native").default;
      const { EventType } = require("@notifee/react-native") as typeof import("@notifee/react-native");
      const unsub = notifee.onForegroundEvent(({ type, detail }) => {
        if (type !== EventType.ACTION_PRESS) return;
        const action = detail.pressAction?.id;
        if (action === TIMER_STOP_ACTION) handleStopRef.current();
        else if (action === TIMER_PAUSE_ACTION || action === TIMER_RESUME_ACTION) togglePauseRef.current();
        else if (action === TIMER_NEXT_ROUND_ACTION) handleNextRoundFromNotifRef.current();
      });
      return () => unsub();
    }
    const { addNotificationResponseReceivedListener } = require("expo-notifications") as typeof import("expo-notifications");
    const sub = addNotificationResponseReceivedListener((response) => {
      const action = response.actionIdentifier;
      if (action === TIMER_STOP_ACTION) handleStopRef.current();
      else if (action === TIMER_PAUSE_ACTION || action === TIMER_RESUME_ACTION) togglePauseRef.current();
      else if (action === TIMER_NEXT_ROUND_ACTION) handleNextRoundFromNotifRef.current();
    });
    return () => sub.remove();
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const fmtRemaining = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const persistState = (overrides: Partial<{
    isPaused: boolean; pausedAtMs: number | null;
    pomodoroRound: number; pomodoroPhase: "work" | "break"; totalPausedMs: number;
  }> = {}) => {
    saveTimerState({
      params: {
        pomodoro: params.pomodoro, workSecs: params.workSecs,
        shortBreakSecs: params.shortBreakSecs, longBreakSecs: params.longBreakSecs,
        rounds: params.rounds, baseTitle: params.baseTitle,
        category: params.category, targetSecs: params.targetSecs,
      },
      pomodoroRound: overrides.pomodoroRound ?? pomodoroRound.current,
      pomodoroPhase: overrides.pomodoroPhase ?? pomodoroPhase.current,
      totalPausedMs: overrides.totalPausedMs ?? totalPausedMs.current,
      isPaused: overrides.isPaused ?? false,
      pausedAtMs: overrides.pausedAtMs ?? null,
    });
  };

  const buildOngoingContent = (secs: number, paused: boolean) => {
    const phase = pomodoroPhase.current;
    const round = pomodoroRound.current;
    const timeStr = fmtRemaining(secs);
    const pausePrefix = paused ? "⏸ " : "";
    if (isPomodoroMode) {
      const phaseLabel = phase === "work" ? `Round ${round}/${pTotalRounds}` : "Break";
      return { title: `${pausePrefix}${pBaseTitle} · ${phaseLabel}`, body: timeStr };
    }
    return { title: `${pausePrefix}${activity?.title ?? ""}`, body: timeStr };
  };

  const stopAlarm = () => {
    alarmSoundRef.current?.stopAsync().then(() => alarmSoundRef.current?.unloadAsync());
    alarmSoundRef.current = null;
  };

  const playAlarm = async () => {
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false, staysActiveInBackground: true, shouldDuckAndroid: false, playThroughEarpieceAndroid: false });
      const { sound } = await Audio.Sound.createAsync(require("../assets/sounds/alarm-sound.mp3"), { isLooping: true });
      alarmSoundRef.current = sound;
      await sound.playAsync();
    } catch (e) { console.log("Could not play sound:", e); }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleMinimize = () => {
    impact(ImpactFeedbackStyle.Light);
    isMinimizingRef.current = true;
    router.replace("/(tabs)");
    setIsMinimized(true);
  };

  const handleStop = () => {
    notification(NotificationFeedbackType.Warning);
    Vibration.cancel();
    cancelTimerCompletionNotification();
    dismissTimerOngoingNotification();
    dismissWaitingBannerNotification();
    clearTimerState();
    stopAlarm();
    if (!isCompleted) stopTracker().catch(console.error);
    router.replace("/(tabs)");
  };

  const togglePause = () => {
    impact(ImpactFeedbackStyle.Medium);
    if (!isPaused) {
      pausedAtMs.current = Date.now();
      persistState({ isPaused: true, pausedAtMs: pausedAtMs.current });
    } else {
      if (pausedAtMs.current !== null) {
        totalPausedMs.current += Date.now() - pausedAtMs.current;
        pausedAtMs.current = null;
      }
      persistState({ isPaused: false, pausedAtMs: null, totalPausedMs: totalPausedMs.current });
    }
    setIsPaused((prev) => !prev);
  };

  useEffect(() => { handleStopRef.current = handleStop; });
  useEffect(() => { togglePauseRef.current = togglePause; });

  const handlePomodoroTransition = useCallback(async () => {
    if (isCycling.current) return;
    isCycling.current = true;
    cancelTimerCompletionNotification();
    dismissTimerOngoingNotification();

    const currentRound = pomodoroRound.current;
    const currentPhase = pomodoroPhase.current;
    const isLastRound = currentPhase === "work" && currentRound >= pTotalRounds;

    setPomodoroWaiting(false);
    phaseStartMs.current = Date.now();
    setAccumulatedSecs(0);
    totalPausedMs.current = 0;
    setIsPaused(false);

    await stopTracker();

    if (currentPhase === "work" && isLastRound) {
      clearTimerState();
      isCycling.current = false;
      router.replace("/(tabs)");
      return;
    }

    if (currentPhase === "work") {
      pomodoroPhase.current = "break";
      setPhaseDisplay("break");
      pendingTargetSecs.current = pShortBreakSecs;
      notification(NotificationFeedbackType.Success);
      persistState({ pomodoroPhase: "break", totalPausedMs: 0, isPaused: false, pausedAtMs: null });
      await startTracker(`${pBaseTitle} — Short Break`, pCategory, "Pomodoro break", pShortBreakSecs);
    } else {
      if (pomodoroRound.current >= pTotalRounds) {
        clearTimerState();
        notification(NotificationFeedbackType.Success);
        sendLocalNotification("Focus session complete! 🎉", `You finished all ${pTotalRounds} rounds. Amazing focus!`);
        isCycling.current = false;
        router.replace("/(tabs)");
        return;
      }
      const nextRound = pomodoroRound.current + 1;
      pomodoroRound.current = nextRound;
      setRoundDisplay(nextRound);
      pomodoroPhase.current = "work";
      setPhaseDisplay("work");
      notification(NotificationFeedbackType.Success);
      persistState({ pomodoroRound: nextRound, pomodoroPhase: "work", totalPausedMs: 0, isPaused: false, pausedAtMs: null });
      await startTracker(`${pBaseTitle} — Round ${nextRound}`, pCategory, "Pomodoro", pWorkSecs);
    }

    isCycling.current = false;
  }, [pBaseTitle, pCategory, pWorkSecs, pShortBreakSecs, pTotalRounds]);

  // ── Notification effects ───────────────────────────────────────────────────

  // Schedule completion + show ongoing on activity start
  useEffect(() => {
    if (!currentActivity) {
      cancelTimerCompletionNotification();
      dismissTimerOngoingNotification();
      return;
    }
    if (currentActivity.target_duration) {
      const nowMs = Date.now();
      const elapsedMs = Math.max(0, nowMs - currentActivity.start_time - totalPausedMs.current);
      const remaining = Math.max(0, currentActivity.target_duration - Math.floor(elapsedMs / 1000));
      const endMs = nowMs + remaining * 1000;
      const isFinalRound = pomodoroPhase.current === "work" && pomodoroRound.current >= pTotalRounds;
      if (!isPomodoroMode || isFinalRound) {
        const completionTitle = isPomodoroMode ? "Focus session complete! 🎉" : "Time's up! ⏱";
        const completionBody = isPomodoroMode
          ? `You completed all ${pTotalRounds} rounds. Great focus!`
          : `You completed "${currentActivity.title}". Great work!`;
        scheduleTimerCompletionNotification(endMs, completionTitle, completionBody);
      }
      const { title, body } = buildOngoingContent(remaining, false);
      showTimerOngoingNotification(title, body, false, undefined, endMs, true);
    } else {
      const effectiveStartMs = currentActivity.start_time + totalPausedMs.current;
      const { title, body } = buildOngoingContent(0, false);
      showTimerOngoingNotification(title, body, false, undefined, effectiveStartMs, false);
    }
    return () => {
      if (!isMinimizingRef.current) {
        cancelTimerCompletionNotification();
        dismissTimerOngoingNotification();
        dismissWaitingBannerNotification();
      }
      isMinimizingRef.current = false;
    };
  }, [currentActivity?.id]);

  // Pause/resume notification update
  useEffect(() => {
    if (!currentActivity) return;
    if (isPaused) {
      cancelTimerCompletionNotification();
      cancelTimerCompletionNotification();
      if (currentActivity.target_duration) {
        const elapsed = (Date.now() - currentActivity.start_time - totalPausedMs.current) / 1000;
        const remaining = Math.max(0, currentActivity.target_duration - elapsed);
        const { title, body } = buildOngoingContent(remaining, true);
        showTimerOngoingNotification(title, body, true);
      } else {
        const { title, body } = buildOngoingContent(accumulatedSecs, true);
        showTimerOngoingNotification(title, body, true);
      }
    } else {
      if (currentActivity.target_duration) {
        const elapsed = (Date.now() - currentActivity.start_time - totalPausedMs.current) / 1000;
        const remaining = Math.max(0, currentActivity.target_duration - elapsed);
        const endMs = Date.now() + remaining * 1000;
        const isFinalRound = pomodoroPhase.current === "work" && pomodoroRound.current >= pTotalRounds;
        if (!isPomodoroMode || isFinalRound) {
          const completionTitle = isPomodoroMode ? "Focus session complete! 🎉" : "Time's up! ⏱";
          const completionBody = isPomodoroMode
            ? `You completed all ${pTotalRounds} rounds. Great focus!`
            : `You completed "${currentActivity.title}". Great work!`;
          scheduleTimerCompletionNotification(endMs, completionTitle, completionBody);
        }
        const { title, body } = buildOngoingContent(remaining, false);
        showTimerOngoingNotification(title, body, false, undefined, endMs, true);
      } else {
        const effectiveStartMs = currentActivity.start_time + totalPausedMs.current;
        const { title, body } = buildOngoingContent(accumulatedSecs, false);
        showTimerOngoingNotification(title, body, false, undefined, effectiveStartMs, false);
      }
    }
  }, [isPaused]);

  // Per-second notification update (iOS body text only — Android uses native chronometer)
  useEffect(() => {
    if (Platform.OS === "android") return;
    if (isPaused || !currentActivity || hasAlerted.current) return;
    if (currentActivity.target_duration) {
      const remaining = Math.max(0, currentActivity.target_duration - accumulatedSecs);
      if (remaining <= 0) return;
      const endMs = currentActivity.start_time + currentActivity.target_duration * 1000 + totalPausedMs.current;
      const { title, body } = buildOngoingContent(remaining, false);
      showTimerOngoingNotification(title, body, false, undefined, endMs, true);
    } else {
      const effectiveStartMs = currentActivity.start_time + totalPausedMs.current;
      const { title, body } = buildOngoingContent(accumulatedSecs, false);
      showTimerOngoingNotification(title, body, false, undefined, effectiveStartMs, false);
    }
  }, [accumulatedSecs]);

  // ── Timer tick ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (currentActivity) {
      setAccumulatedSecs(Math.floor((Date.now() - currentActivity.start_time) / 1000));
      hasAlerted.current = false;
      setIsOvertime(false);
    }
  }, [currentActivity?.id]);

  const justMounted = useRef(true);
  useEffect(() => { const t = setTimeout(() => { justMounted.current = false; }, 2000); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (justMounted.current) return;
    if (!currentActivity && !isCycling.current && !isPomodoroMode && !isCompleted) router.replace("/(tabs)");
  }, [currentActivity]);

  useEffect(() => {
    if (isPaused) return;
    const sync = currentActivity
      ? () => { setAccumulatedSecs(Math.floor((Date.now() - currentActivity.start_time - totalPausedMs.current) / 1000)); }
      : isCycling.current
      ? () => setAccumulatedSecs(Math.floor((Date.now() - phaseStartMs.current) / 1000))
      : null;
    if (!sync) return;
    sync();
    const interval = setInterval(sync, 1000);
    const sub = AppState.addEventListener("change", async (state) => {
      if (state !== "active") return;
      sync();
      if (Platform.OS === "android") {
        const pending = await AsyncStorage.getItem("pending_notif_action");
        if (pending && pending !== "open_tracker") {
          await AsyncStorage.removeItem("pending_notif_action");
          if (pending === TIMER_STOP_ACTION) handleStopRef.current();
          else if (pending === TIMER_PAUSE_ACTION || pending === TIMER_RESUME_ACTION) togglePauseRef.current();
          else if (pending === TIMER_NEXT_ROUND_ACTION) handleNextRoundFromNotifRef.current();
        }
      }
    });
    return () => { clearInterval(interval); sub.remove(); };
  }, [currentActivity, isPaused]);

  // Alert when countdown hits zero
  useEffect(() => {
    const targetSecs = currentActivity?.target_duration;
    if (!targetSecs || hasAlerted.current || isPaused) return;
    if (accumulatedSecs < targetSecs) return;

    hasAlerted.current = true;

    if (isPomodoroMode) {
      const isLastWorkRound = pomodoroPhase.current === "work" && pomodoroRound.current >= pTotalRounds;

      if (isLastWorkRound) {
        cancelTimerCompletionNotification();
        dismissTimerOngoingNotification();
        notification(NotificationFeedbackType.Success);
        Vibration.vibrate([0, 500, 500], true);
        showTimerOngoingNotification(`${pBaseTitle} · All done! 🎉`, "Tap to finish", false, TIMER_CATEGORY_WAITING);
        showWaitingBannerNotification(`${pBaseTitle} · All done! 🎉`, "Tap Next Round to finish or Stop to end.");
        handleNextRoundFromNotifRef.current = () => {
          dismissWaitingBannerNotification();
          Vibration.cancel();
          stopAlarm();
          setPomodoroWaiting(false);
          clearTimerState();
          stopTracker().catch(() => {});
          router.replace("/(tabs)");
        };
        playAlarm();
        setPomodoroWaiting(true);
      } else if (autoNextRound) {
        handlePomodoroTransition();
      } else {
        cancelTimerCompletionNotification();
        dismissTimerOngoingNotification();
        notification(NotificationFeedbackType.Success);
        Vibration.vibrate([0, 500, 500], true);
        const waitingBody = pomodoroPhase.current === "work"
          ? `Round ${pomodoroRound.current}/${pTotalRounds} done — tap Next Round`
          : "Break over — tap Next Round";
        showTimerOngoingNotification(`${pBaseTitle} · ⏸`, waitingBody, false, TIMER_CATEGORY_WAITING);
        showWaitingBannerNotification(`${pBaseTitle} · ⏸`, waitingBody);
        handleNextRoundFromNotifRef.current = () => {
          dismissWaitingBannerNotification();
          Vibration.cancel();
          stopAlarm();
          setMidRoundWaiting(false);
          handlePomodoroTransition();
        };
        playAlarm();
        setMidRoundWaiting(true);
      }
      return;
    }

    // Non-pomodoro countdown complete — enter overtime (keep running, show negative)
    cancelTimerCompletionNotification();
    dismissTimerOngoingNotification();
    notification(NotificationFeedbackType.Success);
    Vibration.vibrate([0, 500, 500], true);
    playAlarm();
    setIsOvertime(true);
  }, [accumulatedSecs]);

  // ── Progress ring animation ────────────────────────────────────────────────

  useEffect(() => {
    if (isCompleted) {
      progressShared.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
      return;
    }
    if (isOvertime) {
      cancelAnimation(progressShared);
      progressShared.value = 0;
      return;
    }
    if (isPaused || !currentActivity) {
      cancelAnimation(progressShared);
      return;
    }
    const elapsed = (Date.now() - currentActivity.start_time - totalPausedMs.current) / 1000;
    if (currentActivity.target_duration) {
      const remaining = Math.max(0, currentActivity.target_duration - elapsed);
      progressShared.value = Math.max(0, 1 - elapsed / currentActivity.target_duration);
      progressShared.value = withTiming(0, { duration: remaining * 1000, easing: Easing.linear });
    } else {
      const secInMinute = elapsed % 60;
      progressShared.value = 1 - secInMinute / 60;
      progressShared.value = withTiming(0, { duration: (60 - secInMinute) * 1000, easing: Easing.linear });
    }
  }, [currentActivity?.id, currentActivity?.start_time, isPaused, isCompleted, isOvertime]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progressShared.value),
  }));

  // ── Derived display values ─────────────────────────────────────────────────
  const { colorScheme } = useColorScheme();
  const { accentColor } = useAppTheme();
  const isDark = colorScheme === "dark";
  const targetSecs = currentActivity
    ? (activity?.target_duration || 0)
    : isCycling.current ? pendingTargetSecs.current : (activity?.target_duration || pInitialTargetSecs || 0);
  const isCountdown = targetSecs > 0;
  const currentCategory = categories.find((c) => c.id === activity?.category);
  const displayTitle = isPomodoroMode ? pBaseTitle : (activity?.title ?? "");
  const ringColor = isPomodoroMode
    ? phaseDisplay === "break" ? "#14b8a6" : getContrastingColor(accentColor, isDark)
    : isOvertime ? "#ef4444" : getContrastingColor(accentColor, isDark);

  let displayTime = "";
  if (isCountdown) {
    const raw = targetSecs - accumulatedSecs;
    if (raw < 0) {
      const over = -raw;
      const h = Math.floor(over / 3600);
      const m = Math.floor((over % 3600) / 60);
      const s = over % 60;
      displayTime = h > 0
        ? `-${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
        : `-${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    } else {
      const h = Math.floor(raw / 3600);
      const m = Math.floor((raw % 3600) / 60);
      const s = raw % 60;
      displayTime = h > 0
        ? `${h}:${(m % 60).toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
        : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
  } else {
    const h = Math.floor(accumulatedSecs / 3600);
    const m = Math.floor((accumulatedSecs % 3600) / 60);
    const s = accumulatedSecs % 60;
    displayTime = h > 0
      ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
      : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  const bg = isDark ? "#121212" : "#fff";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, !isPomodoroMode && { justifyContent: "flex-end" }]}>
        {isPomodoroMode && (
          <Pressable onPress={() => setShowTimerSettings(true)} style={styles.headerBtn}>
            <Settings size={22} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
          </Pressable>
        )}
        <Pressable onPressIn={handleMinimize} style={styles.headerBtn}>
          <Minimize2 size={24} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
        </Pressable>
      </View>

      <TimerSettingsModal
        visible={showTimerSettings}
        isDark={isDark}
        autoNextRound={autoNextRound}
        ringColor={ringColor}
        onClose={() => setShowTimerSettings(false)}
        onAutoNextRoundChange={(val) => {
          setAutoNextRound(val);
          loadPomodoroSettings().then((s) => savePomodoroSettings({ ...s, autoNextRound: val }));
        }}
      />

      <View style={styles.content}>
        <TimerRing
          isDark={isDark}
          displayTime={displayTime}
          displayTitle={displayTitle}
          ringColor={ringColor}
          isPomodoroMode={isPomodoroMode}
          phaseDisplay={phaseDisplay}
          roundDisplay={roundDisplay}
          pTotalRounds={pTotalRounds}
          currentCategory={currentCategory}
          animatedProps={animatedProps}
        />

        <TimerControls
          isDark={isDark}
          ringColor={ringColor}
          isPomodoroMode={isPomodoroMode}
          isPaused={isPaused}
          isCompleted={isCompleted}
          pomodoroWaiting={pomodoroWaiting}
          midRoundWaiting={midRoundWaiting}
          onTogglePause={togglePause}
          onStop={handleStop}
          onNextRound={() => {
            impact(ImpactFeedbackStyle.Medium);
            stopAlarm();
            setMidRoundWaiting(false);
            handlePomodoroTransition();
          }}
          onFinish={() => {
            impact(ImpactFeedbackStyle.Medium);
            Vibration.cancel();
            stopAlarm();
            if (isPomodoroMode && pomodoroWaiting) {
              stopTracker().catch(() => {});
            }
            router.replace("/(tabs)");
          }}
          onShare={() => {
            impact(ImpactFeedbackStyle.Light);
            router.push({
              pathname: "/share-session",
              params: {
                title: isPomodoroMode ? pBaseTitle : (activity?.title ?? ""),
                duration: formatLogDuration(
                  activity?.start_time ?? Date.now() - accumulatedSecs * 1000,
                  completedAtMs.current || null,
                  null,
                ),
                dateLabel: new Date(activity?.start_time ?? Date.now()).toLocaleString(undefined, {
                  weekday: "short", month: "short", day: "numeric",
                  hour: "numeric", minute: "2-digit",
                }),
                category: currentCategory ? JSON.stringify(currentCategory) : undefined,
              },
            });
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerBtn: { padding: 10 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
});
