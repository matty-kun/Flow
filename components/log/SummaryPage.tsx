import { CategoryIcon } from "@/components/category/CategoryIcon";
import { Activity, Category } from "@/context/TrackingContext";
import { formatDuration } from "@/utils/time";
import { mergePomoActivities } from "@/utils/pomodoroMerge";
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

const BG = "#FBBF24";
const TEXT = "#121212";
const TEXT_SUB = "rgba(18,18,18,0.5)";
const DIVIDER = "rgba(18,18,18,0.12)";
const PILL_INACTIVE_BG = "rgba(18,18,18,0.1)";
const PILL_ACTIVE_BG = "#121212";
const PILL_ACTIVE_TEXT = "#FBBF24";
const PILL_INACTIVE_TEXT = "rgba(18,18,18,0.6)";

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

function getHeadline(period: Period, totalMins: number): { main: string; sub: string } {
  if (totalMins === 0) {
    return {
      main: `No sessions.`,
      sub: "A fresh slate. Start tracking!",
    };
  }
  const formatted = formatDuration(totalMins);
  return {
    main: `${formatted} tracked.`,
    sub: period === "today" ? "Keep the momentum going." : "Nice work — keep it up.",
  };
}

export default function SummaryPage({ activities, categories, width }: Props) {
  const [period, setPeriod] = useState<Period>("today");

  const { start, end, dateLabel } = useMemo(() => getPeriodRange(period), [period]);

  const filtered = useMemo(
    () => activities.filter((a) => a.start_time >= start.getTime() && a.start_time <= end.getTime()),
    [activities, start, end],
  );

  const totalMins = useMemo(
    () => Math.round(filtered.reduce((sum, a) => sum + (a.duration || 0), 0) / 60),
    [filtered],
  );

  const recentSessions = useMemo(() => mergePomoActivities(filtered).slice(0, 5), [filtered]);

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

  const { main: headlineMain, sub: headlineSub } = getHeadline(period, totalMins);

  return (
    <SafeAreaView style={{ flex: 1, width, backgroundColor: BG }} edges={["top", "bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: BG }}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Date top-left */}
        <Text style={{ fontSize: 12, fontWeight: "800", color: TEXT, letterSpacing: 1.2, paddingHorizontal: 24, paddingTop: 16 }}>
          {dateLabel}
        </Text>

        {/* Mascot right, lower */}
        <View style={{ alignItems: "flex-end", paddingHorizontal: 24, marginTop: 12 }}>
          <Image
            source={require("@/assets/images/flow portrait.png")}
            style={{ width: 90, height: 90, borderRadius: 45, overflow: "hidden" }}
            resizeMode="contain"
          />
        </View>

        {/* Headline */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 }}>
          <Text style={{ fontSize: 40, fontWeight: "900", color: TEXT, lineHeight: 46 }}>
            {headlineMain}
          </Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: TEXT_SUB, marginTop: 10 }}>
            {headlineSub}
          </Text>
        </View>

        {/* Sessions section */}
        <View style={{ paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: TEXT, marginBottom: 12 }}>
            Sessions
          </Text>

          {recentSessions.length === 0 ? (
            <Text style={{ fontSize: 15, color: TEXT_SUB, fontWeight: "500" }}>Nothing logged here.</Text>
          ) : (
            recentSessions.map((log, i) => {
              const cat = categories.find((c) => c.id === log.category);
              return (
                <View key={i}>
                  <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 11 }}>
                    <View style={{
                      width: 34, height: 34, borderRadius: 10,
                      backgroundColor: "rgba(18,18,18,0.1)",
                      alignItems: "center", justifyContent: "center", marginRight: 12,
                    }}>
                      {cat && <CategoryIcon name={cat.iconName} size={15} color={TEXT} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "700", color: TEXT }} numberOfLines={1}>{log.title}</Text>
                      {cat && <Text style={{ fontSize: 12, color: TEXT_SUB, marginTop: 1 }}>{cat.label}</Text>}
                    </View>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: TEXT_SUB }}>
                      {formatDuration(Math.round((log.duration || 0) / 60))}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Spacer */}
        <View style={{ flex: 1, minHeight: 32 }} />

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: DIVIDER, marginHorizontal: 24, marginBottom: 20 }} />

        {/* Stats row */}
        <View style={{ flexDirection: "row", paddingHorizontal: 24, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: "900", color: TEXT_SUB, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Total</Text>
            <Text style={{ fontSize: 22, fontWeight: "900", color: TEXT }}>{totalMins > 0 ? formatDuration(totalMins) : "—"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: "900", color: TEXT_SUB, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Top</Text>
            <Text style={{ fontSize: 22, fontWeight: "900", color: TEXT }} numberOfLines={1}>{topCategory ? topCategory.label : "—"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 10, fontWeight: "900", color: TEXT_SUB, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Longest</Text>
            <Text style={{ fontSize: 22, fontWeight: "900", color: TEXT }} numberOfLines={1}>{longestSession ? formatDuration(Math.round((longestSession.duration || 0) / 60)) : "—"}</Text>
          </View>
        </View>

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
              <Text style={{ fontSize: 13, fontWeight: "800", color: period === key ? PILL_ACTIVE_TEXT : PILL_INACTIVE_TEXT }}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Branding footer */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <Image
            source={require("@/assets/images/splash-icon.png")}
            style={{ width: 30, height: 30, borderRadius: 15 }}
          />
          <View>
            <Text style={{ fontSize: 13, fontWeight: "900", color: TEXT }}>flow</Text>
            <Text style={{ fontSize: 11, fontWeight: "600", color: TEXT_SUB }}>Made by Matthew Vargas</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
