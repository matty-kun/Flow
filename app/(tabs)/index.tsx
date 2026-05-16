import AnalyticsRow from "@/components/analytics/AnalyticsRow";
import BentoCards from "@/components/home/BentoCards";
import GreetingSection from "@/components/home/GreetingSection";
import QuickActions from "@/components/home/QuickActions";
import RecentLogs from "@/components/home/RecentLogs";
import SummaryPage from "@/components/log/SummaryPage";
import { useSummaryVisible } from "@/context/SummaryVisibleContext";
import { Activity, Category, useTracking } from "@/context/TrackingContext";
import { getForecast } from "@/utils/forecast";
import { mergePomoActivities } from "@/utils/pomodoroMerge";
import { useAppTheme } from "@/context/ThemeContext";
import { useColorScheme } from "nativewind";
import React, { useCallback, useRef, useState } from "react";
import { Dimensions, ScrollView, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

export default React.memo(function TabOneScreen() {
  const { activities, deleteActivity, duplicateActivity, categories, customGoals } = useTracking();
  const { accentColor } = useAppTheme();
  const { setIsSummaryVisible } = useSummaryVisible();
  const { colorScheme } = useColorScheme();
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("today");
  const now = new Date();

  const getPeriodTotal = useCallback((range: "today" | "week" | "month", offset: number = 0) => {
    const ref = new Date(now);
    const startOfRange = new Date(ref);
    const endOfRange = new Date(ref);
    if (range === "today") {
      startOfRange.setDate(ref.getDate() + offset);
      startOfRange.setHours(0, 0, 0, 0);
      endOfRange.setDate(ref.getDate() + offset);
      endOfRange.setHours(23, 59, 59, 999);
    } else if (range === "week") {
      const day = ref.getDay();
      startOfRange.setDate(ref.getDate() - day + offset * 7);
      startOfRange.setHours(0, 0, 0, 0);
      endOfRange.setDate(startOfRange.getDate() + 6);
      endOfRange.setHours(23, 59, 59, 999);
    } else if (range === "month") {
      startOfRange.setMonth(ref.getMonth() + offset, 1);
      startOfRange.setHours(0, 0, 0, 0);
      endOfRange.setMonth(ref.getMonth() + offset + 1, 0);
      endOfRange.setHours(23, 59, 59, 999);
    }
    return activities.filter((a: Activity) => {
        const t = new Date(a.start_time).getTime();
        return t >= startOfRange.getTime() && t <= endOfRange.getTime();
      }).reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
  }, [activities]);

  const rangeMinsTotal = React.useMemo(() => getPeriodTotal(timeRange, 0), [timeRange, activities]);
  const prevRangeMinsTotal = React.useMemo(() => getPeriodTotal(timeRange, -1), [timeRange, activities]);
  const trendUp = rangeMinsTotal > prevRangeMinsTotal;
  const isNeutral = rangeMinsTotal === prevRangeMinsTotal;
  const trendColor = isNeutral ? (colorScheme === "dark" ? "#ffffff" : "#121212") : trendUp ? "#10b981" : "#ef4444";

  const todayMinsTotal = React.useMemo(
    () => activities
      .filter((a: Activity) => new Date(a.start_time).toDateString() === now.toDateString())
      .reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0),
    [activities],
  );

  const dailyChartData = React.useMemo(
    () => [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - d.getDay() + i);
      const dayStr = d.toDateString();
      const mins = activities
        .filter((a: Activity) => new Date(a.start_time).toDateString() === dayStr)
        .reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
      return { mins, label: d.toLocaleDateString("en-US", { weekday: "narrow" }), isToday: dayStr === now.toDateString() };
    }),
    [activities],
  );

  const { dayOfWeek, dayOfMonth, greetingKey } = React.useMemo(() => {
    const d = new Date();
    let gk = "good_evening";
    if (d.getHours() < 12) gk = "good_morning";
    else if (d.getHours() < 17) gk = "good_afternoon";
    return { 
      dayOfWeek: d.toLocaleDateString(undefined, { weekday: "long" }), 
      dayOfMonth: d.toLocaleDateString(undefined, { day: "numeric", month: "long" }), 
      greetingKey: gk 
    };
  }, []);

  const maxWeeklyMins = React.useMemo(() => Math.max(...dailyChartData.map((d) => d.mins), 1), [dailyChartData]);
  const recentLogs = React.useMemo(() => mergePomoActivities(activities).slice(0, 5), [activities]);
  const categoryStats = React.useMemo(() => {
    const total = activities.reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
    return categories.map((cat: Category) => {
        const logs = activities.filter((a: Activity) => a.category === cat.id);
        return { ...cat, totalMins: logs.reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0), sessionCount: logs.length, totalAll: total };
      }).filter((c: any) => c.totalMins > 0).sort((a: any, b: any) => b.totalMins - a.totalMins);
  }, [activities, categories]);

  const activeGoalsCount = customGoals?.filter((g) => g.endDate >= Date.now()).length ?? 0;
  const klowkForecast = React.useMemo(() => getForecast({ activities, goals: customGoals || [], range: "week" }), [activities, customGoals]);
  const { width } = Dimensions.get("window");
  const pagerRef = useRef<ScrollView>(null);

  const isDark = colorScheme === "dark";

  const isWhiteTheme = accentColor.toLowerCase().trim() === "#ffffff" || accentColor.toLowerCase().trim() === "#fff";

  return (
    <ScrollView
      ref={pagerRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      bounces={false}
      style={{ flex: 1 }}
      contentOffset={{ x: width, y: 0 }}
      onLayout={() => pagerRef.current?.scrollTo({ x: width, y: 0, animated: false })}
      onMomentumScrollEnd={(e) => {
        const page = Math.round(e.nativeEvent.contentOffset.x / width);
        setIsSummaryVisible(page === 0);
      }}
      scrollEventThrottle={16}
    >
      <SummaryPage activities={activities} categories={categories} width={width} />

      <View style={{ width, backgroundColor: isDark ? (isWhiteTheme ? "#FFFFFF" : "#0A0A0A") : "#F1F3F1" }}>
        {isWhiteTheme && isDark && (
          <LinearGradient
            colors={["#FFFFFF", "#E2E8F0"]}
            style={StyleSheet.absoluteFill}
          />
        )}
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <GreetingSection
            klowkForecastStatus={klowkForecast.status}
            klowkForecastMessage={klowkForecast.message}
            todayMinsTotal={todayMinsTotal}
            dayOfWeek={dayOfWeek}
            dayOfMonth={dayOfMonth}
            greetingKey={greetingKey}
          />

          {/* Content Sheet with rounded top corners */}
          <View 
            style={{ 
              marginTop: -60, 
              borderTopLeftRadius: 36, 
              borderTopRightRadius: 36, 
              backgroundColor: isDark ? "#121212" : "#FFFFFF",
              paddingTop: 32,
              minHeight: 600,
              shadowColor: isDark ? "#888" : "#000",
              shadowOffset: { width: 0, height: -10 },
              shadowOpacity: isDark ? 0.1 : 0.05,
              shadowRadius: 10,
              elevation: 5
            }}
          >
            {activities.length <= 1 && <QuickActions />}

            {activities.length > 0 && (
              <>
                <AnalyticsRow
                  dailyChartData={dailyChartData}
                  maxWeeklyMins={maxWeeklyMins}
                  rangeMinsTotal={rangeMinsTotal}
                  trendUp={trendUp}
                  isNeutral={isNeutral}
                  trendColor={trendColor}
                  timeRange={timeRange}
                  setTimeRange={setTimeRange}
                />
                <BentoCards
                  categoryStats={categoryStats}
                  activeGoalsCount={activeGoalsCount}
                  customGoals={customGoals || []}
                  activities={activities}
                />
                <RecentLogs
                  recentLogs={recentLogs}
                  categories={categories}
                  customGoals={customGoals || []}
                  deleteActivity={deleteActivity}
                  duplicateActivity={duplicateActivity}
                />
              </>
            )}
            <View style={{ height: 120 }} />
          </View>
        </ScrollView>
      </View>
    </ScrollView>
  );
});
