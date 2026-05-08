import { CategoryIcon } from "@/components/category/CategoryIcon";
import ActionSheet from "@/components/ui/ActionSheet";
import { useLanguage } from "@/context/LanguageContext";
import { Activity, Category } from "@/context/TrackingContext";
import { impact } from "@/utils/haptics";
import { formatDate, formatLogDuration, formatTimestamp } from "@/utils/time";
import { ImpactFeedbackStyle } from "expo-haptics";
import { router } from "expo-router";
import { ArrowLeft, Copy, Edit2, MoreHorizontal, Trash2 } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const POMO_SUFFIX = / [—-] (Round \d+|Short Break|Long Break)$/;

type Props = {
  categoryId: string | null;
  categories: Category[];
  activities: Activity[];
  onClose: () => void;
  onDeleteActivity: (id: number) => void;
  onDuplicateActivity: (id: number) => void;
};

export default function CategoryDetailSheet({
  categoryId,
  categories,
  activities,
  onClose,
  onDeleteActivity,
  onDuplicateActivity,
}: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { t } = useLanguage();
  const slideAnim = useRef(new Animated.Value(width)).current;
  const [selectedActionLogId, setSelectedActionLogId] = useState<number | null>(null);
  const [selectedPomodoroIds, setSelectedPomodoroIds] = useState<number[] | null>(null);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: categoryId ? 0 : width,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, [categoryId]);

  const catData = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categoryId, categories],
  );

  const catLogs = useMemo(
    () => (categoryId ? activities.filter((a) => a.category === categoryId) : []),
    [categoryId, activities],
  );

  const displayLogs = useMemo(() => {
    type DisplayLog = Activity & { isPomodoro?: boolean; roundCount?: number; pomodoroIds?: number[] };
    const result: DisplayLog[] = [];
    const groups = new Map<string, Activity[]>();

    for (const a of catLogs) {
      if (POMO_SUFFIX.test(a.title)) {
        const base = a.title.replace(POMO_SUFFIX, "");
        const day = new Date(a.start_time).toDateString();
        const key = `${base}__${day}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(a);
      } else {
        result.push(a);
      }
    }

    for (const [key, phases] of groups) {
      const base = key.split("__")[0];
      const totalDuration = phases.reduce((s, a) => s + (a.duration || 0), 0);
      const earliest = phases.reduce(
        (min, a) => (a.start_time < min ? a.start_time : min),
        phases[0].start_time,
      );
      const roundCount = phases.filter((a) => / [—-] Round \d+$/.test(a.title)).length;
      result.push({
        ...phases[0],
        title: base,
        duration: totalDuration,
        start_time: earliest,
        isPomodoro: true,
        roundCount,
        pomodoroIds: phases.map((p) => p.id),
      });
    }

    return result.sort((a, b) => b.start_time - a.start_time);
  }, [catLogs]);

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <>
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isDark ? "#121212" : "#fff",
          zIndex: 100,
          transform: [{ translateX: slideAnim }],
        }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 24,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? "#27272a" : "#f3f4f6",
            }}
          >
            <Pressable
              onPress={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isDark ? "#18181b" : "#f9fafb",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeft size={20} color={isDark ? "#fff" : "#121212"} />
            </Pressable>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "900",
                color: isDark ? "#fff" : "#121212",
              }}
            >
              {catData?.label ?? ""}
            </Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={{ alignItems: "center", paddingVertical: 32, paddingHorizontal: 24 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 28,
                  backgroundColor: `${catData?.color}18`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                }}
              >
                <CategoryIcon
                  name={catData?.iconName || "tag"}
                  size={36}
                  color={catData?.color || "#FBBF24"}
                  customImageUri={catData?.customImageUri}
                />
              </View>
              <Text
                style={{
                  fontSize: 28,
                  fontWeight: "900",
                  color: isDark ? "#fff" : "#121212",
                  marginBottom: 4,
                }}
              >
                {capitalize(
                  t((catData?.label || "").toLowerCase() as any) || catData?.label || "",
                )}
              </Text>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: isDark ? "#71717a" : "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: 3,
                }}
              >
                {displayLogs.length} {displayLogs.length === 1 ? "session" : "sessions"} total
              </Text>
            </View>

            <View style={{ paddingHorizontal: 24 }}>
              {displayLogs.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 48 }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 22,
                      backgroundColor: isDark ? "#18181b" : "#f9fafb",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <CategoryIcon
                      name={catData?.iconName || "tag"}
                      size={28}
                      color={isDark ? "#3f3f46" : "#d1d5db"}
                    />
                  </View>
                  <Text style={{ color: isDark ? "#52525b" : "#d1d5db", fontWeight: "700", fontSize: 14 }}>
                    No sessions yet
                  </Text>
                  <Text style={{ color: isDark ? "#3f3f46" : "#e5e7eb", fontWeight: "600", fontSize: 12, marginTop: 4 }}>
                    Log a session to see it here
                  </Text>
                </View>
              ) : (
                displayLogs.map((log: any) => (
                  <View
                    key={log.isPomodoro ? `pomo-${log.pomodoroIds.join("-")}` : log.id}
                    style={{
                      backgroundColor: isDark ? "#18181b" : "#fff",
                      padding: 20,
                      borderRadius: 28,
                      marginBottom: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderWidth: 1,
                      borderColor: isDark ? "#27272a" : "#f3f4f6",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.04,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "700",
                          color: isDark ? "#fff" : "#121212",
                          marginBottom: 6,
                        }}
                      >
                        {log.title}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: "700",
                            color: isDark ? "#52525b" : "#9ca3af",
                            textTransform: "uppercase",
                          }}
                        >
                          {formatDate(log.start_time)} • {formatTimestamp(log.start_time)}
                        </Text>
                        {log.isPomodoro && (
                          <View
                            style={{
                              backgroundColor: "#FBBF2420",
                              borderRadius: 20,
                              paddingHorizontal: 7,
                              paddingVertical: 2,
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ fontSize: 9 }}>🍅</Text>
                            <Text
                              style={{
                                color: "#FBBF24",
                                fontSize: 9,
                                fontWeight: "900",
                                marginLeft: 3,
                                textTransform: "uppercase",
                              }}
                            >
                              {log.roundCount} {log.roundCount === 1 ? "round" : "rounds"}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "900",
                          color: isDark ? "#fff" : "#121212",
                        }}
                      >
                        {formatLogDuration(log.start_time, log.end_time ?? null, log.duration ?? null)}
                      </Text>
                      <Pressable
                        onPress={() => {
                          impact(ImpactFeedbackStyle.Light);
                          if (log.isPomodoro) {
                            setSelectedPomodoroIds(log.pomodoroIds);
                          } else {
                            setSelectedActionLogId(log.id);
                          }
                        }}
                        hitSlop={10}
                        style={{ padding: 4, marginTop: 4 }}
                      >
                        <MoreHorizontal size={15} color="#9ca3af" />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
            <View style={{ height: 100 }} />
          </ScrollView>
        </SafeAreaView>
      </Animated.View>

      <ActionSheet
        visible={selectedActionLogId !== null}
        onClose={() => setSelectedActionLogId(null)}
        title="Log Actions"
        actions={[
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
            onPress: () => {
              if (selectedActionLogId) {
                onDuplicateActivity(selectedActionLogId);
                setSelectedActionLogId(null);
              }
            },
          },
          {
            label: "Delete forever",
            icon: <Trash2 size={20} color="#ef4444" />,
            destructive: true,
            onPress: () => {
              if (selectedActionLogId) {
                onDeleteActivity(selectedActionLogId);
                setSelectedActionLogId(null);
              }
            },
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
                selectedPomodoroIds.forEach((id) => onDeleteActivity(id));
                setSelectedPomodoroIds(null);
              }
            },
          },
        ]}
      />
    </>
  );
}
