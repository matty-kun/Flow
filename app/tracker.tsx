import TimerControls from "@/components/tracker/TimerControls";
import { CategoryIcon } from "@/components/category/CategoryIcon";
import { useFocusMode } from "@/context/FocusModeContext";
import { getContrastingColor, useAppTheme } from "@/context/ThemeContext";
import { useTracking } from "@/context/TrackingContext";
import { impact } from "@/utils/haptics";
import {
  dismissTimerOngoingNotification,
  setupTimerNotificationCategory,
  showTimerOngoingNotification,
  TIMER_PAUSE_ACTION,
  TIMER_RESUME_ACTION,
  TIMER_STOP_ACTION,
} from "@/utils/notifications";
import { clearTimerState, loadTimerState, saveTimerState } from "@/utils/timerState";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ImpactFeedbackStyle } from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ChevronDown, Save } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
import { AppState, Image, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NewCategorySheet from "@/components/sheets/NewCategorySheet";
import AddGoalModal from "@/components/sheets/AddGoalModal";
import { LinearGradient } from "expo-linear-gradient";

export default function TrackerPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    baseTitle?: string;
    category?: string;
  }>();

  const { currentActivity, activities, startTracker, stopTracker, setIsMinimized, categories, addManualActivity, deleteActivity: dbDelete, getTotalFocusTimeToday, customGoals } = useTracking();
  const { isFaceUp, setIsSensorEnabled } = useFocusMode();
  const lastActivity = useRef(currentActivity);
  if (currentActivity) lastActivity.current = currentActivity;
  const activity = lastActivity.current;

  const [isPaused, setIsPaused] = useState(false);
  const [accumulatedSecs, setAccumulatedSecs] = useState(0);
  const [totalPausedMs, setTotalPausedMs] = useState(0);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  // Summary Form State - Clear defaults so user picks at end
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionGoalIds, setSessionGoalIds] = useState<string[]>([]);
  const [sessionNotes, setSessionNotes] = useState("");
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showNewCategorySheet, setShowNewCategorySheet] = useState(false);
  const [showNewGoalSheet, setShowNewGoalSheet] = useState(false);

  useEffect(() => {
    if (activity && !sessionTitle) {
      setSessionTitle(activity.title === "Focus Session" ? "" : activity.title);
    }
  }, [activity?.id]);

  const pausedAtMs = useRef<number | null>(null);
  const isMinimizingRef = useRef(false);
  const handleStopRef = useRef<() => void>(() => {});
  const togglePauseRef = useRef<() => void>(() => {});

  // Auto-start is now handled by FocusModeContext ritual
  /*
  const hasStarted = useRef(false);
  useEffect(() => {
    if (!currentActivity && !hasStarted.current) {
      hasStarted.current = true;
      startTracker("Focus Session", "work").catch(console.error);
    }
  }, [currentActivity]);
  */

  // ── Setup ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    setupTimerNotificationCategory();
  }, []);

  useEffect(() => {
    loadTimerState().then((saved) => {
      if (!saved) { persistState(0); return; }
      setTotalPausedMs(saved.totalPausedMs);
      if (saved.isPaused) {
        pausedAtMs.current = saved.pausedAtMs;
        setIsPaused(true);
      }
    });
  }, []);

  // Notification action listener
  useEffect(() => {
    if (Platform.OS === "android") {
      const notifee = require("@notifee/react-native").default as typeof import("@notifee/react-native").default;
      const { EventType } = require("@notifee/react-native") as typeof import("@notifee/react-native");
      const unsub = notifee.onForegroundEvent(({ type, detail }) => {
        if (type !== EventType.ACTION_PRESS) return;
        const action = detail.pressAction?.id;
        if (action === TIMER_STOP_ACTION) handleStopRef.current();
        else if (action === TIMER_PAUSE_ACTION || action === TIMER_RESUME_ACTION) togglePauseRef.current();
      });
      return () => unsub();
    }
    const { addNotificationResponseReceivedListener } = require("expo-notifications") as typeof import("expo-notifications");
    const sub = addNotificationResponseReceivedListener((response) => {
      const action = response.actionIdentifier;
      if (action === TIMER_STOP_ACTION) handleStopRef.current();
      else if (action === TIMER_PAUSE_ACTION || action === TIMER_RESUME_ACTION) togglePauseRef.current();
    });
    return () => sub.remove();
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const persistState = (newTotalPaused?: number, overrides: Partial<{
    isPaused: boolean; pausedAtMs: number | null;
  }> = {}) => {
    saveTimerState({
      params: {
        baseTitle: params.baseTitle,
        category: params.category,
      },
      pomodoroRound: 1,
      pomodoroPhase: "work",
      totalPausedMs: newTotalPaused ?? totalPausedMs,
      isPaused: overrides.isPaused ?? isPaused,
      pausedAtMs: overrides.pausedAtMs ?? pausedAtMs.current,
    });
  };

  const buildOngoingContent = (secs: number, paused: boolean) => {
    const pausePrefix = paused ? "⏸ " : "";
    return { title: `${pausePrefix}${activity?.title ?? "Flowing"}`, body: formatTime(secs) };
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleStop = async (isDiscard: boolean = false) => {
    impact(ImpactFeedbackStyle.Medium);
    dismissTimerOngoingNotification();
    clearTimerState();
    
    try {
      if (isDiscard && currentActivity) {
        await dbDelete(currentActivity.id);
      } else {
        if (sessionGoalIds.length > 0) {
          // Split session into multiple logs, one per goal
          for (let i = 0; i < sessionGoalIds.length; i++) {
            const goal = customGoals.find(g => g.id === sessionGoalIds[i]);
            if (!goal) continue;
            
            const finalTitle = sessionTitle.trim() ? `${goal.name} — ${sessionTitle.trim()}` : goal.name;
            const categoryId = goal.categoryId;

            if (i === 0) {
              // Update and stop the ongoing tracker for the first goal
              await stopTracker({
                title: finalTitle,
                category: categoryId,
                description: sessionNotes.trim() || undefined,
              });
            } else {
              // Create a manual log for additional goals
              await addManualActivity(
                finalTitle,
                categoryId,
                accumulatedSecs,
                sessionNotes.trim() || undefined,
                new Date()
              );
            }
          }
        } else {
          // Fallback if no goals are selected
          await stopTracker({
            title: sessionTitle.trim() || "Focus Session",
            category: activity?.category || "focus",
            description: sessionNotes.trim() || undefined,
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
    
    router.replace("/(tabs)");
  };

  const togglePause = () => {
    impact(ImpactFeedbackStyle.Medium);
    if (!isPaused) {
      pausedAtMs.current = Date.now();
      setIsPaused(true);
      persistState(totalPausedMs, { isPaused: true, pausedAtMs: pausedAtMs.current });
    } else {
      if (pausedAtMs.current !== null) {
        const addedPause = Date.now() - pausedAtMs.current;
        const newTotal = totalPausedMs + addedPause;
        setTotalPausedMs(newTotal);
        pausedAtMs.current = null;
        setIsPaused(false);
        persistState(newTotal, { isPaused: false, pausedAtMs: null });
      } else {
        setIsPaused(false);
        persistState(totalPausedMs, { isPaused: false, pausedAtMs: null });
      }
    }
  };

  useEffect(() => { handleStopRef.current = handleStop; });
  useEffect(() => { togglePauseRef.current = togglePause; });

  // ── Notification effects ───────────────────────────────────────────────────

  useEffect(() => {
    if (!currentActivity) {
      dismissTimerOngoingNotification();
      return;
    }
    const { title, body } = buildOngoingContent(accumulatedSecs, isPaused);
    const effectiveStartMs = currentActivity.start_time + (totalPausedMs || 0);
    showTimerOngoingNotification(title, body, isPaused, undefined, effectiveStartMs, false);

    return () => {
      if (!isMinimizingRef.current) {
        dismissTimerOngoingNotification();
      }
      isMinimizingRef.current = false;
    };
  }, [currentActivity?.id, isPaused]);

  // ── Timer tick ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (currentActivity) {
      setAccumulatedSecs(Math.floor((Date.now() - currentActivity.start_time - totalPausedMs) / 1000));
    }
  }, [currentActivity?.id, isPaused, totalPausedMs]);

  useEffect(() => {
    if (isPaused || !currentActivity) return;
    const sync = () => {
      setAccumulatedSecs(Math.floor((Date.now() - currentActivity.start_time - totalPausedMs) / 1000));
    };
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
        }
      }
    });
    return () => { clearInterval(interval); sub.remove(); };
  }, [currentActivity, isPaused, totalPausedMs]);

  // ── Sensor Sync ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentActivity) return;
    
    if (isFaceUp && !isPaused) {
      togglePause(); // Auto-pause when flipped up
    } else if (!isFaceUp && isPaused) {
      togglePause(); // Auto-resume when flipped down
    }
  }, [isFaceUp]);

  // ── Derived display values ─────────────────────────────────────────────────
  const { colorScheme } = useColorScheme();
  const { accentColor } = useAppTheme();
  const isDark = colorScheme === "dark";
  const displayTitle = activity?.title ?? "Session";
  const ringColor = getContrastingColor(accentColor, isDark);
  const displayTime = formatTime(accumulatedSecs);
  const bg = isDark ? "#121212" : "#fff";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.content}>
        <View style={styles.mascotContainer}>
          <Image 
            source={getTotalFocusTimeToday() > 240 
              ? require("@/assets/images/sleepy flow.png")
              : require("@/assets/images/focus flow.png")
            }
            style={styles.mascotImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.timerContainer}>
          <Text style={[styles.categoryText, { color: ringColor, opacity: 0.6 }]}>
            {categories.find(c => c.id === activity?.category)?.label?.toUpperCase() ?? "FOCUS"}
          </Text>
          <Text style={[styles.timeText, { color: isDark ? "#fff" : "#121212" }]}>
            {displayTime}
          </Text>
          <Text style={[styles.titleText, { color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }]}>
            {displayTitle}
          </Text>
        </View>

        <TimerControls
          isDark={isDark}
          ringColor={ringColor}
          isPaused={isPaused}
          onTogglePause={togglePause}
          onStop={() => setShowSummaryModal(true)}
          // Legacy props
          isPomodoroMode={false}
          isCompleted={false}
          pomodoroWaiting={false}
          midRoundWaiting={false}
          onNextRound={() => {}}
          onFinish={() => setShowSummaryModal(true)}
        />
      </View>

      {/* Face-Up Warning Overlay */}
      {isFaceUp && currentActivity && !showSummaryModal && isPaused && (
        <View style={StyleSheet.absoluteFill} className="bg-black/80 items-center justify-center px-10 z-[100]">
          <Image 
            source={require("../assets/images/phone flow.png")}
            style={{ width: 120, height: 120, marginBottom: 20 }}
            resizeMode="contain"
          />
          <Text className="text-white text-2xl font-black text-center mb-2">ARE YOU DONE?</Text>
          <Text className="text-gray-400 text-center mb-8 font-bold">Flip the phone back down to continue focusing, or tap below to finish.</Text>
          
          <TouchableOpacity 
            onPress={() => { impact(ImpactFeedbackStyle.Medium); setShowSummaryModal(true); }}
            style={{ 
              backgroundColor: accentColor === "#FFFFFF" ? "transparent" : accentColor,
              overflow: 'hidden'
            }}
            className="w-full h-[96px] rounded-full items-center justify-center mb-4"
          >
            {accentColor === "#FFFFFF" ? (
              <LinearGradient
                colors={["#FFFFFF", "#CBD5E1"]}
                style={StyleSheet.absoluteFill}
                className="items-center justify-center"
              >
                <Text className="text-klowk-black font-black uppercase tracking-[2px]">YES, I'M DONE</Text>
              </LinearGradient>
            ) : (
              <Text className="text-white font-black uppercase tracking-[2px]">YES, I'M DONE</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Summary Modal */}
      <Modal
        visible={showSummaryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSummaryModal(false)}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={() => setShowSummaryModal(false)}
          className="flex-1 bg-black/60 justify-end"
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={(e) => e.stopPropagation()} 
            className="bg-white dark:bg-[#1A1A1A] rounded-t-[40px] p-8 pb-12"
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
            </View>
            
            <Text className="text-2xl font-black text-klowk-black dark:text-white mb-6">Session Summary</Text>
            
            <View className="space-y-6">
              <View>
                <Text className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-2">TITLE</Text>
                <TextInput
                  value={sessionTitle}
                  onChangeText={setSessionTitle}
                  placeholder="What were you doing?"
                  placeholderTextColor="#666"
                  className="bg-gray-100 dark:bg-black/40 p-5 rounded-2xl text-klowk-black dark:text-white font-bold"
                />
              </View>


              <View className="mt-2">
                <Text className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-3 ml-1">TARGET GOAL</Text>
                <TouchableOpacity 
                  onPress={() => setShowGoalPicker(true)}
                  className="bg-gray-100 dark:bg-black/40 p-4 rounded-[24px] flex-row items-center justify-between border border-gray-200 dark:border-zinc-800"
                  style={sessionGoalIds.length > 0 ? { borderColor: accentColor + "40", backgroundColor: accentColor + "10" } : {}}
                >
                  <View className="flex-row items-center">
                    <View 
                      style={{ backgroundColor: sessionGoalIds.length > 0 ? accentColor + "20" : "rgba(128,128,128,0.1)" }}
                      className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                    >
                      <View style={{ transform: [{ rotate: "45deg" }] }}>
                        <CategoryIcon 
                          name="target" 
                          size={24} 
                          color={sessionGoalIds.length > 0 ? accentColor : "#666"} 
                        />
                      </View>
                    </View>
                    <View className="flex-1 pr-4">
                      <Text 
                        style={{ color: sessionGoalIds.length > 0 ? accentColor : (isDark ? "#fff" : "#000") }}
                        className="text-lg font-black"
                        numberOfLines={1}
                      >
                        {sessionGoalIds.length === 0 
                          ? "No Goal Selected" 
                          : sessionGoalIds.length === 1 
                            ? customGoals.find(g => g.id === sessionGoalIds[0])?.name 
                            : `${sessionGoalIds.length} Goals Selected`}
                      </Text>
                      {sessionGoalIds.length > 0 && (
                        <Text className="text-gray-400 text-xs font-bold mt-0.5" numberOfLines={1}>
                          {sessionGoalIds.map(id => customGoals.find(g => g.id === id)?.name).join(", ")}
                        </Text>
                      )}
                    </View>
                  </View>
                  <ChevronDown size={20} color={sessionGoalIds.length > 0 ? accentColor : "#666"} />
                </TouchableOpacity>
                
                {/* Goal Bottom Sheet */}
                <Modal
                  visible={showGoalPicker}
                  animationType="slide"
                  transparent={true}
                  onRequestClose={() => setShowGoalPicker(false)}
                >
                  <TouchableOpacity 
                    activeOpacity={1} 
                    onPress={() => setShowGoalPicker(false)}
                    className="flex-1 bg-black/60 justify-end"
                  >
                    <View className="bg-white dark:bg-[#1A1A1A] rounded-t-[40px] p-8 pb-12 max-h-[80%]">
                      <View className="items-center mb-6">
                        <View className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                      </View>
                      
                      <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-black text-klowk-black dark:text-white">Select Goals</Text>
                        <View className="flex-row gap-2">
                          <TouchableOpacity 
                            onPress={() => setShowNewGoalSheet(true)}
                            style={{ backgroundColor: accentColor + "15" }}
                            className="px-4 py-2 rounded-full flex-row items-center border border-accent/20"
                          >
                            <Text style={{ color: accentColor }} className="font-black text-xs uppercase tracking-tighter">+ New</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => setShowGoalPicker(false)}
                            style={{ backgroundColor: accentColor }}
                            className="px-6 py-2 rounded-full flex-row items-center"
                          >
                            <Text className="text-white font-black text-xs uppercase tracking-tighter">Done</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      <ScrollView showsVerticalScrollIndicator={false}>
                        <View className="gap-2">
                          <TouchableOpacity
                            onPress={() => setSessionGoalIds([])}
                            style={{ 
                              backgroundColor: sessionGoalIds.length === 0 ? accentColor + "20" : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"),
                              borderColor: sessionGoalIds.length === 0 ? accentColor : "transparent",
                              borderWidth: 1
                            }}
                            className="p-5 rounded-[22px] flex-row items-center justify-between"
                          >
                            <Text style={{ color: sessionGoalIds.length === 0 ? accentColor : (isDark ? "#fff" : "#000") }} className="font-black text-base">No Goals</Text>
                          </TouchableOpacity>

                          {customGoals.map(goal => {
                            const isSelected = sessionGoalIds.includes(goal.id);
                            return (
                              <TouchableOpacity
                                key={goal.id}
                                onPress={() => { 
                                  setSessionGoalIds(prev => 
                                    isSelected ? prev.filter(id => id !== goal.id) : [...prev, goal.id]
                                  );
                                  if (!sessionTitle.trim() && !isSelected) setSessionTitle(goal.name);
                                }}
                                style={{ 
                                  backgroundColor: isSelected ? accentColor + "20" : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"),
                                  borderColor: isSelected ? accentColor : "transparent",
                                  borderWidth: 1
                                }}
                                className="p-5 rounded-[22px] flex-row items-center justify-between"
                              >
                                <View>
                                  <Text style={{ color: isSelected ? accentColor : (isDark ? "#fff" : "#000") }} className="font-black text-base">{goal.name}</Text>
                                  <Text className="text-gray-400 text-xs font-bold mt-1">
                                    {Math.floor(goal.targetMins / 60)}h {goal.targetMins % 60}m target
                                  </Text>
                                </View>
                                {isSelected && (
                                  <View style={{ backgroundColor: accentColor }} className="w-6 h-6 rounded-full items-center justify-center">
                                    <View className="w-3 h-3 border-b-2 border-r-2 border-white rotate-45 mb-1" />
                                  </View>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  </TouchableOpacity>
                </Modal>
              </View>

              <View>
                <Text className="text-gray-400 font-bold uppercase text-[10px] tracking-widest mb-2">NOTES</Text>
                <TextInput
                  value={sessionNotes}
                  onChangeText={setSessionNotes}
                  placeholder="Add details..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                  className="bg-gray-100 dark:bg-black/40 p-5 rounded-2xl text-klowk-black dark:text-white font-bold"
                />
              </View>
            </View>

            <View className="flex-row mt-10 gap-3">
              <TouchableOpacity 
                onPress={() => {
                  handleStop(true);
                }}
                className="flex-1 bg-gray-100 dark:bg-white/5 p-6 rounded-3xl items-center justify-center"
              >
                <Text className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">Discard</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                disabled={!sessionTitle.trim() && sessionGoalIds.length === 0}
                onPress={async () => {
                  impact(ImpactFeedbackStyle.Heavy);
                  handleStop(false);
                }}
                style={{ 
                  backgroundColor: (!sessionTitle.trim() && sessionGoalIds.length === 0) 
                    ? (isDark ? "#2A2A2A" : "#F3F4F6") 
                    : (accentColor === "#FFFFFF" ? "transparent" : accentColor),
                  overflow: 'hidden'
                }}
                className="flex-[2] h-[80px] rounded-3xl items-center justify-center"
              >
                {(!sessionTitle.trim() && sessionGoalIds.length === 0) ? (
                  <View className="flex-row items-center justify-center">
                    <Save size={18} color="#666" />
                    <Text className="text-[#666] font-black uppercase tracking-widest ml-2 text-sm">Save & Finish</Text>
                  </View>
                ) : accentColor === "#FFFFFF" ? (
                  <LinearGradient
                    colors={["#FFFFFF", "#CBD5E1"]}
                    style={StyleSheet.absoluteFill}
                    className="flex-row items-center justify-center"
                  >
                    <Save size={18} color="#121212" />
                    <Text className="text-klowk-black font-black uppercase tracking-widest ml-2 text-sm">Save & Finish</Text>
                  </LinearGradient>
                ) : (
                  <View className="flex-row items-center justify-center">
                    <Save size={18} color="white" />
                    <Text className="text-white font-black uppercase tracking-widest ml-2 text-sm">Save & Finish</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <NewCategorySheet 
        visible={showNewCategorySheet}
        onClose={() => setShowNewCategorySheet(false)}
        onCreated={() => {
          setShowGoalPicker(false);
        }}
      />
      <AddGoalModal 
        visible={showNewGoalSheet}
        onClose={() => setShowNewGoalSheet(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  timeText: {
    fontSize: 84,
    fontWeight: "300",
    fontVariant: ["tabular-nums"],
    letterSpacing: -2,
    marginVertical: 10,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 3,
  },
  mascotContainer: {
    marginBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  mascotImage: {
    width: 180,
    height: 180,
  },
});
