import React, { useEffect, useState } from "react";
import { Modal, Text, View, TouchableOpacity, Animated, Easing } from "react-native";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTracking, CustomGoal } from "@/context/TrackingContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useColorScheme } from "nativewind";
import { impact } from "@/utils/haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import { Check, Flame, AlertCircle, Zap, ShieldAlert, Sparkles, TrendingUp } from "lucide-react-native";

export interface AuditRecord {
  weekStart: string;
  goalId: string;
  goalName: string;
  targetMins: number;
  loggedMins: number;
  reached: boolean;
  reason?: string;
  timestamp: number;
}

export const AUDIT_STORAGE_KEY = "klowk_audit_records_v1";

export default function WeeklyAuditModal() {
  const { activities, customGoals } = useTracking();
  const { accentColor } = useAppTheme();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [visible, setVisible] = useState(false);
  const [currentAuditBatch, setCurrentAuditBatch] = useState<{
    goals: { goal: CustomGoal; loggedMins: number; reached: boolean }[];
    weekStartStr: string;
    isAllSmashed: boolean;
  } | null>(null);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    const checkAudit = async () => {

      if (!customGoals || customGoals.length === 0) return;

      const now = new Date();
      const currentDay = now.getDay();
      const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const currentMonday = new Date(now);
      currentMonday.setDate(now.getDate() + daysToMonday);
      currentMonday.setHours(0, 0, 0, 0);

      const prevMonday = new Date(currentMonday);
      prevMonday.setDate(currentMonday.getDate() - 7);
      const prevSundayEnd = new Date(currentMonday);
      prevSundayEnd.setMilliseconds(-1);

      const weekStartStr = prevMonday.toISOString().split("T")[0];

      try {
        const stored = await AsyncStorage.getItem(AUDIT_STORAGE_KEY);
        const audits: AuditRecord[] = stored ? JSON.parse(stored) : [];

        // Find ALL unaudited goals from previous week that existed before or during that week
        const unaudited = customGoals.filter(
          (goal) =>
            goal.startDate <= prevSundayEnd.getTime() &&
            !audits.some((a) => a.weekStart === weekStartStr && a.goalId === goal.id)
        );

        if (unaudited.length === 0) return;

        const batch = unaudited.map((goal) => {
          const goalLogs = activities.filter(
            (a) =>
              a.category === goal.categoryId &&
              a.start_time >= prevMonday.getTime() &&
              a.start_time <= prevSundayEnd.getTime()
          );
          const loggedMins = Math.floor(
            goalLogs.reduce((s, a) => s + (a.duration || 0), 0) / 60
          );
          return { goal, loggedMins, reached: loggedMins >= goal.targetMins };
        });

        const isAllSmashed = batch.every((b) => b.reached);

        setCurrentAuditBatch({
          goals: batch,
          weekStartStr,
          isAllSmashed,
        });
        setVisible(true);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
        ]).start();
      } catch (err) {
        console.error("Error checking audit:", err);
      }
    };

    checkAudit();
  }, [customGoals, activities]);

  const handleCompleteAudit = async (reason?: string) => {
    impact(ImpactFeedbackStyle.Medium);
    if (!currentAuditBatch) return;

    try {
      const stored = await AsyncStorage.getItem(AUDIT_STORAGE_KEY);
      const audits: AuditRecord[] = stored ? JSON.parse(stored) : [];

      const newRecords: AuditRecord[] = currentAuditBatch.goals.map((item) => ({
        weekStart: currentAuditBatch.weekStartStr,
        goalId: item.goal.id,
        goalName: item.goal.name,
        targetMins: item.goal.targetMins,
        loggedMins: item.loggedMins,
        reached: item.reached,
        reason: item.reached ? undefined : reason,
        timestamp: Date.now(),
      }));

      await AsyncStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([...audits, ...newRecords]));
    } catch (e) {
      console.error("Failed to save audit record", e);
    }

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      setCurrentAuditBatch(null);
    });
  };

  const CHIPS = [
    { label: "Burnout / Low Energy", icon: Zap, color: "#f59e0b" },
    { label: "Unexpected Distractions", icon: AlertCircle, color: "#ef4444" },
    { label: "Blocked by Code / Tech", icon: ShieldAlert, color: "#3b82f6" },
    { label: "Overambitious Target", icon: TrendingUp, color: "#8b5cf6" },
  ];

  if (!visible || !currentAuditBatch || currentAuditBatch.goals.length === 0) return null;

  const { goals, isAllSmashed } = currentAuditBatch;
  const goalNames = goals.map((b) => b.goal.name).join(", ");
  const totalHrs = (goals.reduce((sum, b) => sum + b.loggedMins, 0) / 60).toFixed(1);
  const missedBatch = goals.filter((b) => !b.reached);
  const missedNames = missedBatch.map((b) => b.goal.name).join(", ");

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => handleCompleteAudit()}>
      <View className="flex-1 items-center justify-center px-6">
        <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.75)", opacity: fadeAnim }} />

        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
          className="w-full bg-white dark:bg-zinc-900 rounded-[40px] p-8 shadow-2xl border border-gray-100 dark:border-zinc-800 items-center"
        >
          {isAllSmashed ? (
            <>
              <View className="w-32 h-32 mb-6 items-center justify-center">
                <Image
                  source={require("../../assets/images/klowk bell.png")}
                  style={{ width: 140, height: 140 }}
                  contentFit="contain"
                />
              </View>
              <View className="bg-emerald-50 dark:bg-emerald-950/40 px-4 py-1.5 rounded-full mb-4 border border-emerald-200 dark:border-emerald-800 flex-row items-center">
                <Sparkles size={14} color="#10b981" />
                <Text className="text-emerald-600 dark:text-emerald-400 font-bold text-xs ml-1.5 uppercase tracking-wider">
                  Target Smashed!
                </Text>
              </View>
              <Text className="text-2xl font-black text-center text-klowk-black dark:text-white leading-9 mb-3">
                Target smashed! You put {totalHrs} hours into {goalNames}. Deep work velocity is high. 🚀
              </Text>
              <Text className="text-gray-400 dark:text-zinc-500 text-xs font-semibold text-center mb-8 px-4">
                Your consistency is driving incredible momentum. Keep protecting your flow window.
              </Text>

              <TouchableOpacity
                onPress={() => handleCompleteAudit()}
                style={{ backgroundColor: accentColor }}
                className="w-full py-5 rounded-3xl items-center justify-center shadow-lg"
              >
                <Text className="text-white font-black text-sm uppercase tracking-widest">
                  Keep Building Momentum
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View className="w-32 h-32 mb-6 items-center justify-center">
                <Image
                  source={require("../../assets/images/sad flow.png")}
                  style={{ width: 140, height: 140 }}
                  contentFit="contain"
                />
              </View>
              <View className="bg-amber-50 dark:bg-amber-950/40 px-4 py-1.5 rounded-full mb-4 border border-amber-200 dark:border-amber-800 flex-row items-center">
                <AlertCircle size={14} color="#f59e0b" />
                <Text className="text-amber-600 dark:text-amber-400 font-bold text-xs ml-1.5 uppercase tracking-wider">
                  Weekly Audit
                </Text>
              </View>
              <Text className="text-2xl font-black text-center text-klowk-black dark:text-white leading-9 mb-3">
                You fell short of your weekly targets for {missedNames} this week. What slowed you down?
              </Text>
              <Text className="text-gray-400 dark:text-zinc-500 text-xs font-semibold text-center mb-6">
                Tap one chip below to log your insights. No typing required.
              </Text>

              {/* Quick-Tap Chips */}
              <View className="w-full gap-3 mb-6">
                {CHIPS.map((chip, idx) => {
                  const Icon = chip.icon;
                  return (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => handleCompleteAudit(chip.label)}
                      className="w-full bg-gray-50 dark:bg-zinc-800/80 p-4 rounded-2xl flex-row items-center border border-gray-100 dark:border-zinc-800 active:scale-[0.98]"
                    >
                      <View style={{ backgroundColor: chip.color + "1A" }} className="w-10 h-10 rounded-xl items-center justify-center mr-4">
                        <Icon size={18} color={chip.color} />
                      </View>
                      <Text className="flex-1 text-klowk-black dark:text-white font-bold text-sm">
                        {chip.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
