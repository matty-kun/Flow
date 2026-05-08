import ActionSheet from "@/components/ui/ActionSheet";
import LogCard from "@/components/log/LogCard";
import { useLanguage } from "@/context/LanguageContext";
import { Activity, Category, CustomGoal, useTracking } from "@/context/TrackingContext";
import { DisplayActivity } from "@/utils/pomodoroMerge";
import { formatLogDuration } from "@/utils/time";
import { router } from "expo-router";
import { Copy, Edit2, Share2, Trash2 } from "lucide-react-native";
import { View as MotiView } from "moti";
import { useColorScheme } from "nativewind";
import React, { useRef, useState } from "react";
import { Text, View } from "react-native";

interface Props {
  recentLogs: DisplayActivity[];
  categories: Category[];
  customGoals: CustomGoal[];
  deleteActivity: (id: number) => void;
  duplicateActivity: (id: number) => void;
}

export default function RecentLogs({ recentLogs, categories, customGoals, deleteActivity, duplicateActivity }: Props) {
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const [selectedActionLogId, setSelectedActionLogId] = useState<number | null>(null);
  const [selectedPomodoroIds, setSelectedPomodoroIds] = useState<number[] | null>(null);
  const selectedActivityRef = useRef<Activity | null>(null);
  const { activities } = useTracking();

  return (
    <>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", delay: 800 }}
        style={{ paddingHorizontal: 24, marginBottom: 16 }}
      >
        <Text style={{ fontSize: 10, fontWeight: "900", color: "#FBBF24", textTransform: "uppercase", letterSpacing: 2 }}>
          {t("logs")}
        </Text>
      </MotiView>

      <View className="px-6 mb-28">
        {recentLogs.map((log: DisplayActivity) => {
          const cat = categories.find((c) => c.id === log.category);
          const isPomodoro = !!log.pomodoroIds;
          const matchedGoal = customGoals.find(
            (g) =>
              (log.title === g.name || log.title.startsWith(g.name + " —")) &&
              log.category === g.categoryId,
          );
          return (
            <LogCard
              key={isPomodoro ? `pomo-${log.pomodoroIds!.join("-")}` : log.id}
              log={log}
              categoryColor={cat?.color || "#6b7280"}
              categoryLabel={cat?.label || t("personal")}
              categoryIconName={cat?.iconName || "tag"}
              pomodoroRounds={log.pomodoroRounds}
              goalName={matchedGoal?.name}
              onPressMore={() => {
                if (isPomodoro) {
                  setSelectedPomodoroIds(log.pomodoroIds!);
                } else {
                  const full = activities.find((a: Activity) => a.id === log.id) ?? log as unknown as Activity;
                  selectedActivityRef.current = full;
                  setSelectedActionLogId(log.id);
                }
              }}
            />
          );
        })}
      </View>

      <ActionSheet
        visible={selectedActionLogId !== null}
        onClose={() => setSelectedActionLogId(null)}
        title="Log Actions"
        actions={[
          {
            label: "Share session",
            icon: <Share2 size={20} color={isDark ? "#e5e7eb" : "#121212"} />,
            onPress: () => {
              const log = selectedActivityRef.current;
              if (log) {
                const cat = categories.find((c: Category) => c.id === log.category);
                router.push({
                  pathname: "/share-session",
                  params: {
                    title: log.title,
                    duration: formatLogDuration(log.start_time, log.end_time, log.duration),
                    dateLabel: new Date(log.start_time).toLocaleString(undefined, {
                      weekday: "short", month: "short", day: "numeric",
                      hour: "numeric", minute: "2-digit",
                    }),
                    category: cat ? JSON.stringify(cat) : undefined,
                  },
                });
                setSelectedActionLogId(null);
              }
            },
          },
          {
            label: "Edit details",
            icon: <Edit2 size={20} color={isDark ? "#e5e7eb" : "#121212"} />,
            onPress: () => {
              if (selectedActionLogId) {
                router.push({ pathname: "/logmanual", params: { editId: selectedActionLogId } });
                setSelectedActionLogId(null);
              }
            },
          },
          {
            label: "Duplicate activity",
            icon: <Copy size={20} color={isDark ? "#9ca3af" : "#4b5563"} />,
            onPress: () => selectedActionLogId && duplicateActivity(selectedActionLogId),
          },
          {
            label: "Delete forever",
            icon: <Trash2 size={20} color="#ef4444" />,
            destructive: true,
            onPress: () => selectedActionLogId && deleteActivity(selectedActionLogId),
          },
        ]}
      />

      <ActionSheet
        visible={selectedPomodoroIds !== null}
        onClose={() => setSelectedPomodoroIds(null)}
        title="Session Actions"
        actions={[
          {
            label: "Delete session",
            icon: <Trash2 size={20} color="#ef4444" />,
            destructive: true,
            onPress: () => {
              if (selectedPomodoroIds) {
                selectedPomodoroIds.forEach((id) => deleteActivity(id));
                setSelectedPomodoroIds(null);
              }
            },
          },
        ]}
      />

    </>
  );
}
