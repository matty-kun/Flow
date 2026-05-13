import { CategoryIcon } from "@/components/category/CategoryIcon";
import { useAppTheme } from "@/context/ThemeContext";
import { Activity, Category } from "@/context/TrackingContext";
import { mergePomoActivities } from "@/utils/pomodoroMerge";
import { formatLogDuration } from "@/utils/time";
import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Period = "today" | "week" | "month" | "year";

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

interface Props {
  activities: Activity[];
  categories: Category[];
  width?: number;
}

function getPeriodRange(period: Period): { start: Date; end: Date; dateLabel: string } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return {
      start, end,
      dateLabel: now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase(),
    };
  }
  if (period === "week") {
    const day = now.getDay();
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const s = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const e = end.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return { start, end, dateLabel: `${s} – ${e}`.toUpperCase() };
  }
  if (period === "month") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return {
      start, end,
      dateLabel: now.toLocaleDateString(undefined, { month: "long", year: "numeric" }).toUpperCase(),
    };
  }
  start.setMonth(0, 1);
  start.setHours(0, 0, 0, 0);
  end.setMonth(11, 31);
  end.setHours(23, 59, 59, 999);
  return { start, end, dateLabel: String(now.getFullYear()) };
}

function getHeadline(period: Period, totalSecs: number): { main: string; sub: string } {
  if (totalSecs === 0) {
    return {
      main: `No sessions.`,
      sub: "A fresh slate. Start tracking!",
    };
  }
  const formatted = formatLogDuration(0, null, totalSecs);
  return {
    main: `${formatted} tracked.`,
    sub: period === "today" ? "Keep the momentum going." : "Nice work — keep it up.",
  };
}

export default function SummaryPage({ activities, categories, width }: Props) {
  const { accentColor } = useAppTheme();
  const [period, setPeriod] = useState<Period>("today");

  // Determine if the background (accentColor) is dark to adjust text colors
  const isAccentDark = accentColor === "#18181b" || accentColor === "#6366f1" || accentColor === "#8b5cf6" || accentColor === "#f43f5e";
  
  const TEXT = isAccentDark ? "#FFFFFF" : "#121212";
  const TEXT_SUB = isAccentDark ? "rgba(255,255,255,0.7)" : "rgba(18,18,18,0.5)";
  const DIVIDER = isAccentDark ? "rgba(255,255,255,0.2)" : "rgba(18,18,18,0.12)";
  const PILL_INACTIVE_BG = isAccentDark ? "rgba(255,255,255,0.15)" : "rgba(18,18,18,0.1)";
  const PILL_ACTIVE_BG = isAccentDark ? "#FFFFFF" : "#121212";
  const PILL_INACTIVE_TEXT = isAccentDark ? "rgba(255,255,255,0.5)" : "rgba(18,18,18,0.6)";

  const { start, end, dateLabel } = useMemo(() => getPeriodRange(period), [period]);

  const filtered = useMemo(
    () => activities.filter((a) => a.start_time >= start.getTime() && a.start_time <= end.getTime()),
    [activities, start, end],
  );

  const totalSecs = useMemo(
    () => filtered.reduce((sum, a) => sum + (a.duration || 0), 0),
    [filtered],
  );

  const totalMins = Math.round(totalSecs / 60);

  const recentSessions = useMemo(() => mergePomoActivities(filtered), [filtered]);

  const topCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((a) => { if (a.category) map[a.category] = (map[a.category] || 0) + (a.duration || 0); });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0] ? categories.find((c) => c.id === sorted[0][0]) ?? null : null;
  }, [filtered, categories]);

  const longestSession = useMemo(() => {
    if (!filtered.length) return null;
    return filtered.reduce((best, a) => (a.duration || 0) > (best.duration || 0) ? a : best);
  }, [filtered]);

  const { main: headlineMain, sub: headlineSub } = getHeadline(period, totalSecs);

  return (
    <SafeAreaView style={{ flex: 1, width, backgroundColor: accentColor }} edges={["top", "bottom"]}>
      <View style={{ flex: 1 }}>
        {/* Date top-left */}
        <Text style={{ fontSize: 12, fontWeight: "800", color: TEXT, letterSpacing: 1.2, paddingHorizontal: 24, paddingTop: 16 }}>
          {dateLabel}
        </Text>

        {/* Mascot right, lower */}
        <View style={{ alignItems: "flex-end", paddingHorizontal: 24, marginTop: 4 }}>
          <Image
            source={require("@/assets/images/flow portrait.png")}
            style={{ width: 70, height: 70, borderRadius: 35, overflow: "hidden" }}
            resizeMode="contain"
          />
        </View>

        {/* Headline */}
        <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20 }}>
          <Text style={{ fontSize: 36, fontWeight: "900", color: TEXT, lineHeight: 42 }}>
            {headlineMain}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: "600", color: TEXT_SUB, marginTop: 6 }}>
            {headlineSub}
          </Text>
        </View>

        {/* Sessions section */}
        <View style={{ paddingHorizontal: 24, flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: TEXT, marginBottom: 8 }}>
            Sessions
          </Text>

          {recentSessions.length === 0 ? (
            <Text style={{ fontSize: 14, color: TEXT_SUB, fontWeight: "500" }}>Nothing logged here.</Text>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
            >
              {recentSessions.map((log, i) => {
                const cat = categories.find((c) => c.id === log.category);
                return (
                  <View key={i}>
                    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10 }}>
                      <View style={{
                        width: 32, height: 32, borderRadius: 10,
                        backgroundColor: "rgba(18,18,18,0.1)",
                        alignItems: "center", justifyContent: "center", marginRight: 12,
                      }}>
                        {cat && <CategoryIcon name={cat.iconName} size={14} color={TEXT} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: TEXT }} numberOfLines={1}>{log.title}</Text>
                        {cat && <Text style={{ fontSize: 11, color: TEXT_SUB, marginTop: 1 }}>{cat.label}</Text>}
                      </View>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: TEXT_SUB }}>
                        {formatLogDuration(0, null, log.duration || 0)}
                      </Text>
                    </View>
                    {i < recentSessions.length - 1 && (
                      <View style={{ height: 1, backgroundColor: "rgba(18,18,18,0.08)" }} />
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: "row", paddingHorizontal: 24, marginTop: 20, marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontWeight: "900", color: TEXT_SUB, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 2 }}>Total</Text>
            <Text style={{ fontSize: 18, fontWeight: "900", color: TEXT }}>{totalSecs > 0 ? formatLogDuration(0, null, totalSecs) : "—"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontWeight: "900", color: TEXT_SUB, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 2 }}>Top</Text>
            <Text style={{ fontSize: 18, fontWeight: "900", color: TEXT }} numberOfLines={1}>{topCategory ? topCategory.label : "—"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontWeight: "900", color: TEXT_SUB, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 2 }}>Longest</Text>
            <Text style={{ fontSize: 18, fontWeight: "900", color: TEXT }} numberOfLines={1}>{longestSession ? formatLogDuration(0, null, longestSession.duration || 0) : "—"}</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: DIVIDER, marginHorizontal: 24, marginBottom: 16 }} />

        {/* Period toggle — single row */}
        <View style={{ flexDirection: "row", marginHorizontal: 24, gap: 8, marginBottom: 24 }}>
          {PERIODS.map(({ key, label }) => (
            <Pressable
              key={key}
              onPress={() => setPeriod(key)}
              style={{
                flex: 1,
                paddingVertical: 7,
                borderRadius: 50,
                alignItems: "center",
                backgroundColor: period === key ? PILL_ACTIVE_BG : PILL_INACTIVE_BG,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "800", color: period === key ? accentColor : PILL_INACTIVE_TEXT }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Branding footer */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
          <Image
            source={require("@/assets/images/silhouette.png")}
            style={{ width: 26, height: 26, borderRadius: 13 }}
          />
          <View>
            <Text style={{ fontSize: 12, fontWeight: "900", color: TEXT }}>flow</Text>
            <Text style={{ fontSize: 10, fontWeight: "600", color: TEXT_SUB }}>Made by Matthew Vargas</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
