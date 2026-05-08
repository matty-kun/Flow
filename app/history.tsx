import { CategoryIcon } from "@/components/category/CategoryIcon";
import ActionSheet from "@/components/ui/ActionSheet";
import ActivityHeatmap from "@/components/analytics/ActivityHeatmap";
import { useLanguage } from "@/context/LanguageContext";
import { Activity, Category, useTracking } from "@/context/TrackingContext";
import { DisplayActivity, pomodoroBaseTitle } from "@/utils/pomodoroMerge";
import { impact } from "@/utils/haptics";
import { formatLogDuration, formatTimestamp } from "@/utils/time";
import { ImpactFeedbackStyle } from "expo-haptics";
import { router } from "expo-router";
import {
    ArrowLeft,
    Check,
    Copy,
    Edit2,
    MoreHorizontal,
    Search,
    Share2,
    SlidersHorizontal,
    Trash2,
    X,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useRef, useState } from "react";
import {
    Animated,
    Easing,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default React.memo(function LogsScreen() {
  const { activities, deleteActivity, duplicateActivity, categories } =
    useTracking();
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  const [search, setSearch] = useState("");
  const [selectedActionLogId, setSelectedActionLogId] = useState<number | null>(null);
  const selectedActivityRef = React.useRef<Activity | null>(null);
  const [selectedPomodoroIds, setSelectedPomodoroIds] = useState<number[] | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [heatmapMonth, setHeatmapMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const filterAnim = useRef(new Animated.Value(0)).current;

  const openFilter = () => {
    setShowFilter(true);
    impact(ImpactFeedbackStyle.Light);
    Animated.spring(filterAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  };

  const closeFilter = () => {
    Animated.timing(filterAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => setShowFilter(false));
  };

  const toggleCategory = (id: string) => {
    impact(ImpactFeedbackStyle.Light);
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const clearFilters = () => {
    impact(ImpactFeedbackStyle.Light);
    setSelectedCategories([]);
  };

  const activeFilterCount = selectedCategories.length;

  function prevMonth() {
    setHeatmapMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
    setSelectedDay(null);
  }
  function nextMonth() {
    setHeatmapMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
    setSelectedDay(null);
  }
  function handleSelectDay(day: string | null) {
    setSelectedDay(day);
  }

  // Filter activities by search + category + selected heatmap day (memoized)
  const filtered = React.useMemo(() => {
    return activities.filter((a: Activity) => {
      const displayTitle = pomodoroBaseTitle(a.title) ?? a.title;
      const matchesSearch = search.trim()
        ? (() => {
            const q = search.toLowerCase();
            const cat = categories.find((c) => c.id === a.category);
            return (
              displayTitle.toLowerCase().includes(q) ||
              (cat?.label || "").toLowerCase().includes(q)
            );
          })()
        : true;
      const matchesCat =
        selectedCategories.length === 0 ||
        selectedCategories.includes(a.category || "");
      const matchesDay = selectedDay
        ? (() => {
            const d = new Date(a.created_at);
            const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            return ymd === selectedDay;
          })()
        : true;
      return matchesSearch && matchesCat && matchesDay;
    });
  }, [search, activities, selectedCategories, categories, selectedDay]);

  // Group by date, then merge Pomodoro phases into one entry (memoized)
  const grouped = React.useMemo(() => {
    const byDate: Record<string, Activity[]> = {};
    for (const a of filtered) {
      const date = new Date(a.created_at).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(a);
    }

    const result: Record<string, DisplayActivity[]> = {};
    for (const [date, logs] of Object.entries(byDate)) {
      const pomGroups: Record<string, Activity[]> = {};
      const regular: DisplayActivity[] = [];

      for (const log of logs) {
        const base = pomodoroBaseTitle(log.title);
        if (base !== null) {
          const key = `${base}||${log.category}`;
          if (!pomGroups[key]) pomGroups[key] = [];
          pomGroups[key].push(log);
        } else {
          regular.push(log);
        }
      }

      const merged: DisplayActivity[] = [...regular];
      for (const [key, phases] of Object.entries(pomGroups)) {
        const base = key.split("||")[0];
        const totalDuration = phases.reduce((s, p) => s + (p.duration || 0), 0);
        const earliest = phases.reduce(
          (min, p) => (p.start_time < min ? p.start_time : min),
          phases[0].start_time,
        );
        const roundCount = phases.filter((p) => /\s[—-]\sRound \d+$/.test(p.title)).length;
        merged.push({
          ...phases[0],
          title: base,
          duration: totalDuration,
          start_time: earliest,
          pomodoroIds: phases.map((p) => p.id),
          pomodoroRounds: roundCount,
        });
      }

      merged.sort((a, b) => b.start_time - a.start_time);
      result[date] = merged;
    }
    return result;
  }, [filtered]);

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-klowk-black"
      edges={["top"]}
    >
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6 mt-8">
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isDark ? "#27272a" : "#f3f4f6",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowLeft size={20} color={isDark ? "#fff" : "#121212"} />
            </Pressable>
            <Text className="text-4xl font-black text-klowk-black dark:text-white">
              {t("history")}
            </Text>
          </View>
          <Pressable
            onPress={openFilter}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor:
                activeFilterCount > 0
                  ? "#FBBF24"
                  : isDark
                    ? "#27272a"
                    : "#f3f4f6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SlidersHorizontal
              size={18}
              color={
                activeFilterCount > 0 ? "#fff" : isDark ? "#9ca3af" : "#6b7280"
              }
            />
            {activeFilterCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1.5,
                  borderColor: "#FBBF24",
                }}
              >
                <Text
                  style={{ fontSize: 8, fontWeight: "900", color: "#FBBF24" }}
                >
                  {activeFilterCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-50 dark:bg-zinc-900 rounded-2xl px-4 py-3 mb-8 border border-gray-100 dark:border-zinc-800">
          <Search size={16} color="#9ca3af" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t("search_logs")}
            placeholderTextColor="#9ca3af"
            className="flex-1 ml-3 text-[13px] font-semibold text-klowk-black dark:text-white"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")} activeOpacity={0.7}>
              <X size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Heatmap */}
        <ActivityHeatmap
          activities={activities}
          month={heatmapMonth}
          selectedDay={selectedDay}
          onSelectDay={handleSelectDay}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
        />

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <View className="flex-row flex-wrap gap-2 mb-6">
            {selectedCategories.map((id) => {
              const cat = categories.find((c: Category) => c.id === id);
              if (!cat) return null;
              return (
                <Pressable
                  key={id}
                  onPress={() => toggleCategory(id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: `${cat.color}20`,
                    borderWidth: 1,
                    borderColor: cat.color,
                  }}
                >
                  <CategoryIcon
                    name={cat.iconName}
                    size={11}
                    color={cat.color}
                  />
                  <Text
                    style={{
                      marginLeft: 6,
                      fontSize: 11,
                      fontWeight: "700",
                      color: cat.color,
                    }}
                  >
                    {t(cat.id as any) || cat.label}
                  </Text>
                  <X size={10} color={cat.color} style={{ marginLeft: 4 }} />
                </Pressable>
              );
            })}
          </View>
        )}

        {Object.entries(grouped).length === 0 &&
        (search.trim() || activeFilterCount > 0) ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <Text style={{ color: "#d1d5db", fontWeight: "700", fontSize: 14 }}>
              {search.trim()
                ? `${t("no_logs")} "${search}"`
                : "No logs match the selected filters."}
            </Text>
          </View>
        ) : null}

        {Object.entries(grouped).map(([date, logs]) => (
          <View key={date} className="mb-8">
            <View className="flex-row items-center mb-6">
              <Text className="text-gray-400 dark:text-gray-500 font-bold text-[11px] uppercase tracking-[3px]">
                {date}
              </Text>
              <View className="h-[2px] flex-1 bg-gray-50 dark:bg-zinc-900 ml-4 rounded-full" />
            </View>

            {(logs as DisplayActivity[]).map((log) => {
              const category = categories.find((c) => c.id === log.category);
              const catColor = category?.color || "#6b7280";
              const isPomodoro = !!log.pomodoroIds;

              return (
                <View
                  key={isPomodoro ? `pomo-${log.pomodoroIds!.join("-")}` : log.id}
                  className="mb-4 bg-white dark:bg-zinc-900 p-5 rounded-[28px] border border-gray-50 dark:border-zinc-800 shadow-sm flex-row items-center"
                >
                  <View
                    style={{ backgroundColor: `${catColor}10` }}
                    className="w-12 h-12 rounded-[16px] items-center justify-center mr-4"
                  >
                    <CategoryIcon
                      name={category?.iconName || "tag"}
                      size={20}
                      color={catColor}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-klowk-black dark:text-white font-bold text-base mb-1">
                      {log.title || t("untitled_session")}
                    </Text>
                    <View className="flex-row items-center flex-wrap" style={{ gap: 4 }}>
                      <Text
                        style={{ color: catColor }}
                        className="text-[10px] font-black uppercase"
                      >
                        {category?.label || t("personal")}
                      </Text>
                      {isPomodoro && log.pomodoroRounds != null && (
                        <View style={{ backgroundColor: "#FBBF2420", borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, flexDirection: "row", alignItems: "center" }}>
                          <Text style={{ fontSize: 9 }}>🍅</Text>
                          <Text style={{ color: "#FBBF24", fontSize: 9, fontWeight: "900", marginLeft: 3, textTransform: "uppercase" }}>
                            {log.pomodoroRounds} {log.pomodoroRounds === 1 ? "round" : "rounds"}
                          </Text>
                        </View>
                      )}
                      <Text className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">
                        {formatTimestamp(log.start_time)}
                      </Text>
                    </View>
                  </View>
                  <View className="items-end ml-4">
                    <Text className="text-klowk-black dark:text-white font-black text-lg mb-1">
                      {formatLogDuration(
                        log.start_time,
                        log.end_time,
                        log.duration,
                      )}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (isPomodoro) {
                          setSelectedPomodoroIds(log.pomodoroIds!);
                        } else {
                          selectedActivityRef.current = log;
                          setSelectedActionLogId(log.id);
                        }
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      className="p-1"
                    >
                      <MoreHorizontal size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Filter Sheet */}
      {showFilter && (
        <>
          <Pressable
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
            }}
            onPress={closeFilter}
          />
          <Animated.View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: isDark ? "#1c1c1e" : "#fff",
              borderTopLeftRadius: 36,
              borderTopRightRadius: 36,
              padding: 28,
              paddingBottom: 48,
              transform: [
                {
                  translateY: filterAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [400, 0],
                  }),
                },
              ],
            }}
          >
            {/* Sheet handle */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? "#3f3f46" : "#e5e7eb",
                alignSelf: "center",
                marginBottom: 24,
              }}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "900",
                  color: isDark ? "#fff" : "#121212",
                }}
              >
                Filter
              </Text>
              {activeFilterCount > 0 && (
                <Pressable onPress={clearFilters}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: "#FBBF24",
                    }}
                  >
                    Clear all
                  </Text>
                </Pressable>
              )}
            </View>

            <Text
              style={{
                fontSize: 10,
                fontWeight: "900",
                color: isDark ? "#71717a" : "#9ca3af",
                textTransform: "uppercase",
                letterSpacing: 2,
                marginBottom: 14,
              }}
            >
              {t("category_label")}
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {categories.map((cat: Category) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => toggleCategory(cat.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 16,
                      backgroundColor: isSelected
                        ? `${cat.color}18`
                        : isDark
                          ? "#27272a"
                          : "#f9fafb",
                      borderWidth: 1.5,
                      borderColor: isSelected ? cat.color : "transparent",
                    }}
                  >
                    <CategoryIcon
                      name={cat.iconName}
                      size={13}
                      color={
                        isSelected ? cat.color : isDark ? "#71717a" : "#9ca3af"
                      }
                    />
                    <Text
                      style={{
                        marginLeft: 8,
                        fontSize: 13,
                        fontWeight: "700",
                        color: isSelected
                          ? cat.color
                          : isDark
                            ? "#a1a1aa"
                            : "#6b7280",
                      }}
                    >
                      {t(cat.id as any) || cat.label}
                    </Text>
                    {isSelected && (
                      <View
                        style={{
                          marginLeft: 8,
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: cat.color,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check size={10} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={closeFilter}
              style={{
                marginTop: 28,
                paddingVertical: 16,
                borderRadius: 20,
                backgroundColor: isDark ? "#fff" : "#121212",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontWeight: "900",
                  fontSize: 14,
                  color: isDark ? "#121212" : "#fff",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Done
              </Text>
            </Pressable>
          </Animated.View>
        </>
      )}

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
    </SafeAreaView>
  );
});
