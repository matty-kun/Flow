import { CategoryIcon } from "@/components/category/CategoryIcon";
import ProgressBar from "@/components/analytics/ProgressBar";
import { useLanguage } from "@/context/LanguageContext";
import { Activity, CustomGoal } from "@/context/TrackingContext";
import { router } from "expo-router";
import { Target } from "lucide-react-native";
import { View as MotiView } from "moti";
import { useColorScheme } from "nativewind";
import React from "react";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";
import { getContrastingColor, useAppTheme } from "@/context/ThemeContext";

interface CategoryStat {
  id: string;
  label: string;
  color: string;
  iconName: string;
  totalMins: number;
  sessionCount: number;
  customImageUri?: string;
}

interface Props {
  categoryStats: CategoryStat[];
  activeGoalsCount: number;
  customGoals: CustomGoal[];
  activities: Activity[];
}

export default function BentoCards({ categoryStats, activeGoalsCount, customGoals, activities }: Props) {
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();
  const { accentColor } = useAppTheme();
  const isDark = colorScheme === "dark";

  if (categoryStats.length === 0) return null;

  const themeBase = getContrastingColor(accentColor, isDark);
  const cardBg = isDark ? themeBase + "15" : accentColor + "12"; 
  const goalsBg = isDark ? themeBase + "25" : accentColor + "20"; 
  const displayColor = isDark ? themeBase : accentColor;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", delay: 600 }}
      style={{ paddingHorizontal: 24, marginBottom: 28, flexDirection: "row", justifyContent: "space-between" }}
    >
      {/* Categories Card */}
      <Pressable
        onPress={() => router.push("/categories")}
        style={{ width: "48.5%", backgroundColor: cardBg, borderRadius: 32, padding: 20 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <View style={{ width: 26, height: 26, borderRadius: 9, backgroundColor: displayColor + "1A", alignItems: "center", justifyContent: "center" }}>
              <CategoryIcon name="layers" size={13} color={displayColor} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: "800", color: isDark ? "#fff" : "#1a1a1a" }}>{t("categories")}</Text>
          </View>
          <Text style={{ fontSize: 14, color: displayColor, fontWeight: "700" }}>›</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 14 }}>
          <Text style={{ fontSize: 20, fontWeight: "900", color: isDark ? "#fff" : "#1a1a1a" }}>{categoryStats.length}</Text>
          <Text style={{ fontSize: 11, fontWeight: "700", color: isDark ? "#71717a" : "#9ca3af", marginLeft: 4 }}>
            {categoryStats.length === 1 ? "category" : "categories"}
          </Text>
        </View>

        {categoryStats.slice(0, 3).map((stat, i) => {
          const hrs = Math.floor(stat.totalMins / 3600);
          const mins = Math.floor((stat.totalMins % 3600) / 60);
          const timeStr = hrs > 0 ? `${hrs}h ${mins > 0 ? mins + "m" : ""}`.trim() : `${mins}m`;
          const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
          const displayLabel = t(stat.id as any);
          const finalLabel = (displayLabel && displayLabel !== stat.id) ? displayLabel : stat.label;

          return (
            <View key={stat.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 7, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: isDark ? displayColor + "20" : displayColor + "30" }}>
              <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: `${stat.color}22`, alignItems: "center", justifyContent: "center", marginRight: 8 }}>
                <CategoryIcon name={stat.iconName} size={11} color={stat.color} customImageUri={stat.customImageUri} />
              </View>
              <Text style={{ flex: 1, fontSize: 11, fontWeight: "700", color: isDark ? "#d4d4d8" : "#374151" }} numberOfLines={1}>
                {capitalize(finalLabel)}
              </Text>
              <Text style={{ fontSize: 10, fontWeight: "800", color: isDark ? "#fff" : "#1a1a1a" }}>{timeStr}</Text>
            </View>
          );
        })}
      </Pressable>

      <Pressable
        onPress={() => router.push("/goals")}
        style={{ width: "48.5%", backgroundColor: goalsBg, borderRadius: 32, padding: 20 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <View style={{ width: 26, height: 26, borderRadius: 9, backgroundColor: displayColor + "1A", alignItems: "center", justifyContent: "center" }}>
              <Target size={13} color={displayColor} />
            </View>
            <Text style={{ fontSize: 13, fontWeight: "800", color: isDark ? "#fff" : "#1a1a1a" }}>{t("goals")}</Text>
          </View>
          <Text style={{ fontSize: 14, color: displayColor, fontWeight: "700" }}>›</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "baseline", marginBottom: 14 }}>
          <Text style={{ fontSize: 20, fontWeight: "900", color: isDark ? "#fff" : "#1a1a1a" }}>{activeGoalsCount}</Text>
          <Text style={{ fontSize: 11, fontWeight: "700", color: isDark ? "#71717a" : "#9ca3af", marginLeft: 4 }}>
            {activeGoalsCount === 1 ? t("goal") : t("goals_plural")}
          </Text>
        </View>

        {customGoals
          ?.filter((g) => g.endDate >= Date.now())
          .slice(0, 3)
          .map((goal, i) => {
            const loggedSecs = activities
              .filter((a) =>
                (a.title === goal.name || (a.title.startsWith(goal.name + " —") && !a.title.endsWith(" — Short Break") && !a.title.endsWith(" — Long Break"))) &&
                a.category === goal.categoryId &&
                a.start_time >= goal.startDate &&
                a.start_time <= goal.endDate,
              )
              .reduce((sum, a) => sum + (a.duration || 0), 0);
            const loggedMins = Math.floor(loggedSecs / 60);
            const progress = Math.min(1, loggedMins / goal.targetMins);
            const isComplete = loggedMins >= goal.targetMins;
            const fmtTime = (mins: number) =>
              mins >= 60 ? `${(mins / 60).toFixed(1).replace(".0", "")}h` : `${mins}m`;

            return (
              <View key={goal.id} style={{ paddingVertical: 7, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: isDark ? accentColor + "20" : accentColor + "30" }}>
                <Text style={{ fontSize: 11, fontWeight: "800", color: isDark ? "#fff" : "#1a1a1a", marginBottom: 4 }} numberOfLines={1}>
                  {goal.name}
                </Text>
                <ProgressBar
                  progress={progress}
                  color={isComplete ? "#22c55e" : displayColor}
                  trackColor={isDark ? displayColor + "20" : displayColor + "30"}
                  height={4}
                  className="mb-1"
                />
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 9, fontWeight: "700", color: isComplete ? "#22c55e" : isDark ? "#a1a1aa" : displayColor }}>
                    {isComplete ? "Complete!" : `${fmtTime(loggedMins)} of ${fmtTime(goal.targetMins)}`}
                  </Text>
                  {!isComplete && (
                    <Text style={{ fontSize: 9, fontWeight: "700", color: isDark ? "#71717a" : "#9ca3af" }}>
                      {Math.max(0, Math.ceil((goal.endDate - Date.now()) / (1000 * 60 * 60 * 24)))}d left
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

        {activeGoalsCount === 0 && (
          <View style={{ marginTop: "auto" }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: isDark ? "#71717a" : "#9ca3af", lineHeight: 16 }}>
              No active goals right now. Let's set some!
            </Text>
          </View>
        )}
      </Pressable>
    </MotiView>
  );
}
