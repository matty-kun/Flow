import { CategoryIcon } from "@/components/category/CategoryIcon";
import CategoryCardPicker from "@/components/category/CategoryCardPicker";
import DatePickerModal from "@/components/forms/DatePickerModal";
import EmptyState from "@/components/ui/EmptyState";
import GoalCard from "@/components/log/GoalCard";
import SectionHeader from "@/components/ui/SectionHeader";
import ActionSheet from "@/components/ui/ActionSheet";
import { useLanguage } from "@/context/LanguageContext";
import {
  Activity,
  Category,
  CustomGoal,
  useTracking,
} from "@/context/TrackingContext";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { impact, notification } from "@/utils/haptics";
import { sendLocalNotification } from "@/utils/notifications";
import WheelPicker from "@/components/forms/WheelPicker";
import {
  Calendar as CalendarIcon,
  Edit2,
  Plus,
  Target,
  Trash2,
  X
} from "lucide-react-native";
import { View as MotiView } from "moti";
import { useColorScheme } from "nativewind";
import { useLocalSearchParams } from "expo-router";
import { getContrastingColor, useAppTheme } from "@/context/ThemeContext";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AddGoalModal from "@/components/sheets/AddGoalModal";

function ConfettiOverlay({ visible }: { visible: boolean }) {
  const { accentColor } = useAppTheme();
  const CONFETTI_COLORS = [accentColor, "#34d399", "#60a5fa", "#f472b6", "#a78bfa", "#fb923c", "#f87171"];
  const { width, height } = Dimensions.get("window");
  const particles = useRef(
    Array.from({ length: 55 }, (_, i) => ({
      startX: Math.random() * width,
      drift: (Math.random() - 0.5) * 140,
      fallDist: 200 + Math.random() * 450,
      size: 5 + Math.random() * 9,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      isCircle: Math.random() > 0.5,
      rotation: Math.random() * 900 - 450,
      anim: new Animated.Value(0),
      delay: Math.random() * 600,
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;
    particles.forEach((p) => {
      p.anim.setValue(0);
      Animated.timing(p.anim, {
        toValue: 1,
        duration: 2600,
        delay: p.delay,
        useNativeDriver: true,
      }).start();
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            top: -20,
            left: p.startX,
            width: p.size,
            height: p.size,
            borderRadius: p.isCircle ? p.size / 2 : p.size / 4,
            backgroundColor: p.color,
            opacity: p.anim.interpolate({ inputRange: [0, 0.65, 1], outputRange: [1, 0.9, 0] }),
            transform: [
              { translateX: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.drift] }) },
              { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.fallDist] }) },
              { rotate: p.anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.rotation}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

const { width, height } = Dimensions.get("window");

export default function GoalsScreen() {
  const { colorScheme } = useColorScheme();
  const { accentColor } = useAppTheme();
  const isDark = colorScheme === "dark";
  const {
    activities,
    categories,
    customGoals,
    isGoalsLoaded,
    addCustomGoal,
    editCustomGoal,
    deleteCustomGoal,
  } = useTracking();
  const { t } = useLanguage();
  const { openModal } = useLocalSearchParams<{ openModal?: string }>();

  useEffect(() => {
    if (openModal === "1") openSheet();
  }, [openModal]);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedActionGoalId, setSelectedActionGoalId] = useState<string | null>(null);



  // Auto-select first category if available


  // Helpers
  const formatHrs = (mins: number) => (mins / 60).toFixed(1).replace(".0", "");

  const openSheet = (existingGoal?: CustomGoal) => {
    if (existingGoal) {
      setEditId(existingGoal.id);
    } else {
      setEditId(null);
    }
    setShowAddModal(true);
  };

  const closeSheet = () => {
    setShowAddModal(false);
    setEditId(null);
  };

  const handleSaveGoal = () => {
    // This is now handled inside AddGoalModal
    closeSheet();
  };

  const [showConfetti, setShowConfetti] = useState(false);
  const prevCompletedIds = useRef<Set<string>>(new Set());

const now = Date.now();

  const goalLoggedSecs = useMemo(() => {
    const map = new Map<string, number>();
    for (const goal of customGoals) {
      const secs = activities
        .filter((a: Activity) =>
          (a.title === goal.name || a.title.includes(`[${goal.name}]`) || (a.title.startsWith(goal.name + " —") && !a.title.endsWith(" — Short Break") && !a.title.endsWith(" — Long Break"))) &&
          a.category === goal.categoryId &&
          a.duration != null &&
          a.start_time >= goal.startDate &&
          a.start_time <= goal.endDate,
        )
        .reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
      map.set(goal.id, secs);
    }
    return map;
  }, [customGoals, activities]);

  const activeGoals = useMemo(
    () => customGoals.filter((g) => g.endDate >= now),
    [customGoals],
  );

  const recentlyActiveGoalIds = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const recentActivities = activities.filter((a: Activity) => a.start_time >= cutoff);
    const ids = new Set<string>();
    for (const goal of activeGoals) {
      const matched = recentActivities.some(
        (a: Activity) =>
          (a.title === goal.name || a.title.startsWith(goal.name + " —")) &&
          a.category === goal.categoryId,
      );
      if (matched) ids.add(goal.id);
    }
    return ids;
  }, [activities, activeGoals]);
  const pastGoals = useMemo(
    () => customGoals.filter((g) => g.endDate < now).sort((a, b) => b.endDate - a.endDate),
    [customGoals],
  );

  const { ongoingGoals, completedActiveGoals } = useMemo(() => {
    const ongoing: CustomGoal[] = [];
    const completed: CustomGoal[] = [];
    for (const goal of activeGoals) {
      const secs = goalLoggedSecs.get(goal.id) || 0;
      if (secs >= goal.targetMins * 60) completed.push(goal);
      else ongoing.push(goal);
    }
    return { ongoingGoals: ongoing, completedActiveGoals: completed };
  }, [activeGoals, goalLoggedSecs]);

  // Seed prevCompletedIds on mount so we only confetti for NEW completions
  useEffect(() => {
    prevCompletedIds.current = new Set(
      activeGoals
        .filter((g) => (goalLoggedSecs.get(g.id) || 0) >= g.targetMins * 60)
        .map((g) => g.id),
    );
  }, []);

  useEffect(() => {
    const completedNow = new Set<string>(
      activeGoals
        .filter((g) => (goalLoggedSecs.get(g.id) || 0) >= g.targetMins * 60)
        .map((g) => g.id),
    );

    const newlyDone = [...completedNow].filter((id) => !prevCompletedIds.current.has(id));
    if (newlyDone.length > 0) {
      const goalName = customGoals.find((g) => g.id === newlyDone[0])?.name ?? "Your goal";
      notification(NotificationFeedbackType.Success);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3200);
      sendLocalNotification("Goal Complete! 🎉", `You've achieved "${goalName}". Stellar work!`).catch(() => {});
    }

    prevCompletedIds.current = completedNow;
  }, [goalLoggedSecs]);


  // Render Empty State
  if (!isGoalsLoaded) return null;

  if (customGoals.length === 0) {
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-[#121212]"
        edges={["top"]}
      >
        <View className="flex-row items-center justify-between mb-6 mt-8 px-6">
          <Text className="text-4xl font-black text-[#121212] dark:text-white">
            {t("goals")}
          </Text>
        </View>

        <EmptyState
          icon={<Target size={48} color={getContrastingColor(accentColor, isDark)} strokeWidth={1.5} />}
          iconBg={accentColor + "1A"}
          title={t("no_goals_yet")}
          description={t("no_goals_desc")}
          action={{ label: t("create_new_goal"), onPress: openSheet }}
        />

        <ConfettiOverlay visible={showConfetti} />
        <AddGoalModal 
          visible={showAddModal} 
          onClose={closeSheet} 
        />
      </SafeAreaView>
    );
  }

  // Render Actual Goals UI
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-[#121212]" edges={["top"]}>
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between mb-6 mt-8">
          <Text className="text-4xl font-black text-[#121212] dark:text-white">
            Goals
          </Text>
          <Pressable
            onPress={() => {
              impact(ImpactFeedbackStyle.Light);
              openSheet();
            }}
            style={{ backgroundColor: accentColor + "1A" }}
            className="w-10 h-10 rounded-full items-center justify-center"
          >
            <Plus size={20} color={getContrastingColor(accentColor, isDark)} strokeWidth={3} />
          </Pressable>
        </View>

{/* Active Goals List */}
        {ongoingGoals.length > 0 && (
          <>
            <SectionHeader label="Your Goals" />
            <View className="gap-4">
              {ongoingGoals.map((goal, idx) => {
                const catData = categories.find((c: Category) => c.id === goal.categoryId);
                if (!catData) return null;
                const currentSecs = goalLoggedSecs.get(goal.id) || 0;
                
                // Find the last exit note for this goal
                const lastActivityWithNote = activities
                  .filter(a => (a.title === goal.name || a.title.includes(`[${goal.name}]`) || a.title.startsWith(goal.name + " —")) && a.category === goal.categoryId && a.description)
                  .sort((a, b) => b.start_time - a.start_time)[0];
                const lastNote = lastActivityWithNote?.description || undefined;

                return (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    catData={catData}
                    currentMins={Math.floor(currentSecs / 60)}
                    index={idx}
                    isRecentlyActive={recentlyActiveGoalIds.has(goal.id)}
                    onPressMore={() => setSelectedActionGoalId(goal.id)}
                    lastNote={lastNote}
                  />
                );
              })}
            </View>
          </>
        )}

        {/* Completed Active Goals */}
        {completedActiveGoals.length > 0 && (
          <View className="mt-8">
            <SectionHeader label="Completed" />
            <View className="gap-3">
              {completedActiveGoals.map((goal) => {
                const catData = categories.find((c: Category) => c.id === goal.categoryId);
                const loggedSecs = goalLoggedSecs.get(goal.id) || 0;
                const cappedMins = Math.min(Math.floor(loggedSecs / 60), goal.targetMins);
                const fmtMins = (m: number) => m < 60 ? `${m}m` : `${(m / 60).toFixed(1).replace(".0", "")}h`;
                return (
                  <MotiView
                    key={goal.id}
                    from={{ opacity: 0, translateY: 8 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    className="bg-emerald-50 dark:bg-emerald-950/40 rounded-[28px] p-5 border border-emerald-100 dark:border-emerald-900/50"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1 pr-3">
                        <View
                          style={{ backgroundColor: `${catData?.color || "#10b981"}20` }}
                          className="w-11 h-11 rounded-[14px] items-center justify-center mr-3"
                        >
                          <CategoryIcon name={catData?.iconName || "target"} size={22} color={catData?.color || "#10b981"} customImageUri={catData?.customImageUri} />
                        </View>
                        <View className="flex-1">
                          <Text className="font-black text-[#121212] dark:text-white text-base leading-tight" numberOfLines={1}>
                            {goal.name}
                          </Text>
                          <Text className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 uppercase tracking-wide">
                            {fmtMins(cappedMins)} logged · ✓ Complete
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => setSelectedActionGoalId(goal.id)}
                        className="w-8 h-8 items-center justify-center"
                        hitSlop={12}
                      >
                        <X size={16} color={isDark ? "#52525b" : "#9ca3af"} />
                      </Pressable>
                    </View>
                  </MotiView>
                );
              })}
            </View>
          </View>
        )}

        {/* Past Goals */}
        {pastGoals.length > 0 && (
          <View className="mt-8">
            <SectionHeader label="Past Goals" />
            <View className="gap-3">
              {pastGoals.map((goal) => {
                const catData = categories.find((c: Category) => c.id === goal.categoryId);
                const loggedSecs = goalLoggedSecs.get(goal.id) || 0;
                const loggedMins = Math.floor(loggedSecs / 60);
                const pct = Math.min(100, Math.round((loggedMins / goal.targetMins) * 100));
                const achieved = loggedMins >= goal.targetMins;
                const fmtMins = (m: number) => m < 60 ? `${m}m` : `${(m / 60).toFixed(1).replace(".0", "")}h`;
                const loggedHrs = fmtMins(loggedMins);
                const targetHrsVal = fmtMins(goal.targetMins);
                return (
                  <View
                    key={goal.id}
                    className="bg-gray-50 dark:bg-zinc-900 rounded-[24px] p-4 flex-row items-center border border-gray-100 dark:border-zinc-800"
                  >
                    <View
                      style={{ backgroundColor: `${catData?.color || "#999"}20` }}
                      className="w-10 h-10 rounded-[12px] items-center justify-center mr-3"
                    >
                      <Target size={18} color={catData?.color || "#999"} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-black text-klowk-black dark:text-white text-sm" numberOfLines={1}>
                        {goal.name}
                      </Text>
                      <Text className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 mt-0.5">
                        {loggedHrs} of {targetHrsVal}
                      </Text>
                    </View>
                    <View className={`px-2 py-1 rounded-full ${achieved ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
                      <Text className={`text-[10px] font-black ${achieved ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                        {achieved ? "✓ Done" : `${pct}%`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>

      <ConfettiOverlay visible={showConfetti} />

      <ActionSheet
        title="Goal Actions"
        visible={selectedActionGoalId !== null}
        onClose={() => setSelectedActionGoalId(null)}
        actions={[
          {
            label: "Edit goal",
            icon: <Edit2 size={20} color={isDark ? "#e5e7eb" : "#121212"} />,
            onPress: () => {
              if (selectedActionGoalId) {
                const goalToEdit = customGoals.find((g) => g.id === selectedActionGoalId);
                setSelectedActionGoalId(null);
                if (goalToEdit) setTimeout(() => openSheet(goalToEdit), 300);
              }
            },
          },
          {
            label: "Delete goal",
            icon: <Trash2 size={20} color="#ef4444" />,
            destructive: true,
            onPress: () => {
              if (selectedActionGoalId) {
                deleteCustomGoal(selectedActionGoalId);
                setSelectedActionGoalId(null);
                notification(NotificationFeedbackType.Success);
              }
            },
          },
        ]}
      />

      <AddGoalModal 
        visible={showAddModal} 
        onClose={closeSheet} 
        editingGoalId={editId}
      />
    </SafeAreaView>
  );
}
