import AnalyticsRow from "@/components/analytics/AnalyticsRow";
import BentoCards from "@/components/home/BentoCards";
import GreetingSection from "@/components/home/GreetingSection";
import HomeHeader from "@/components/home/HomeHeader";
import QuickActions from "@/components/home/QuickActions";
import RecentLogs from "@/components/home/RecentLogs";
import SummaryPage from "@/components/log/SummaryPage";
import { Activity, Category, useTracking } from "@/context/TrackingContext";
import { useSummaryVisible } from "@/context/SummaryVisibleContext";
import { getForecast } from "@/utils/forecast";
import { computeStreak } from "@/utils/streak";
import { loadStreakMode, StreakMode } from "@/components/sheets/StreakModal";
import { mergePomoActivities } from "@/utils/pomodoroMerge";
import { useColorScheme } from "nativewind";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default React.memo(function TabOneScreen() {
  const { activities, deleteActivity, duplicateActivity, categories, customGoals } = useTracking();
  const { setIsSummaryVisible } = useSummaryVisible();
  const { colorScheme } = useColorScheme();
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("today");
  const [streakMode, setStreakMode] = useState<StreakMode>("logging");

  useEffect(() => {
    loadStreakMode().then(setStreakMode);
  }, []);
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

    return activities
      .filter((a: Activity) => {
        const t = new Date(a.start_time).getTime();
        return t >= startOfRange.getTime() && t <= endOfRange.getTime();
      })
      .reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
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
      const label = d.toLocaleDateString("en-US", { weekday: "narrow" });
      const mins = activities
        .filter((a: Activity) => new Date(a.start_time).toDateString() === dayStr)
        .reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
      return { mins, label, isToday: dayStr === now.toDateString() };
    }),
    [activities],
  );

  const { dayOfWeek, dayOfMonth, greetingKey } = React.useMemo(() => {
    const d = new Date();
    const w = d.toLocaleDateString(undefined, { weekday: "long" });
    const m = d.toLocaleDateString(undefined, { day: "numeric", month: "long" });
    let gk = "good_evening";
    if (d.getHours() < 12) gk = "good_morning";
    else if (d.getHours() < 17) gk = "good_afternoon";
    return { dayOfWeek: w, dayOfMonth: m, greetingKey: gk };
  }, []);

  const maxWeeklyMins = React.useMemo(
    () => Math.max(...dailyChartData.map((d) => d.mins), 1),
    [dailyChartData],
  );

  const recentLogs = React.useMemo(() => mergePomoActivities(activities).slice(0, 5), [activities]);

  const categoryStats = React.useMemo(() => {
    const total = activities.reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
    return categories
      .map((cat: Category) => {
        const logs = activities.filter((a: Activity) => a.category === cat.id);
        const totalMins = logs.reduce((sum: number, a: Activity) => sum + (a.duration || 0), 0);
        return { ...cat, totalMins, sessionCount: logs.length, totalAll: total };
      })
      .filter((c: any) => c.totalMins > 0)
      .sort((a: any, b: any) => b.totalMins - a.totalMins);
  }, [activities, categories]);

  const activeGoalsCount = customGoals?.filter((g) => g.endDate >= Date.now()).length ?? 0;

  const klowkForecast = React.useMemo(
    () => getForecast({ activities, goals: customGoals || [], range: "week" }),
    [activities, customGoals],
  );

  const streak = React.useMemo(
    () => streakMode === "off" ? 0 : computeStreak(activities),
    [activities, streakMode],
  );

  const { width, height } = Dimensions.get("window");
  const pagerRef = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={pagerRef}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      bounces={false}
      style={{ flex: 1 }}
      onLayout={() => pagerRef.current?.scrollTo({ x: width, y: 0, animated: false })}
      onMomentumScrollEnd={(e) => {
        const page = Math.round(e.nativeEvent.contentOffset.x / width);
        setIsSummaryVisible(page === 0);
      }}
    >
      {/* Page 0 — Summary (swipe left to reveal) */}
      <SummaryPage activities={activities} categories={categories} width={width} />

      {/* Page 1 — Home (default) */}
      <SafeAreaView style={{ width }} className="bg-white dark:bg-klowk-black" edges={["top"]}>
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          <HomeHeader streak={streak} onStreakSaved={() => loadStreakMode().then(setStreakMode)} />

          <GreetingSection
            klowkForecastStatus={klowkForecast.status}
            klowkForecastMessage={klowkForecast.message}
            todayMinsTotal={todayMinsTotal}
            dayOfWeek={dayOfWeek}
            dayOfMonth={dayOfMonth}
            greetingKey={greetingKey}
          />

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
        </ScrollView>
      </SafeAreaView>
    </ScrollView>
  );
});
