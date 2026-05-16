import { CategoryIcon } from "@/components/category/CategoryIcon";
import ProgressBar from "@/components/analytics/ProgressBar";
import ToggleBar from "@/components/ui/ToggleBar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuditRecord, AUDIT_STORAGE_KEY } from "@/components/home/WeeklyAuditModal";
import { Text } from "react-native";
import { useLanguage } from "@/context/LanguageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTracking, Activity, Category } from "@/context/TrackingContext";
import { getContrastingColor, useAppTheme } from "@/context/ThemeContext";
import { formatDate, formatDuration, formatTimestamp } from "@/utils/time";
import { useNavigation } from "@react-navigation/native";
import { ImpactFeedbackStyle, NotificationFeedbackType } from "expo-haptics";
import { impact, notification } from "@/utils/haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
    ArrowLeft,
    ArrowRight,
    BookOpen,
    Brain,
    Briefcase,
    Calendar,
    Camera,
    Check,
    ChevronRight,
    Clock,
    Code,
    Coffee as CoffeeIcon,
    Compass,
    Copy,
    Edit2,
    Eye,
    Flame,
    Heart,
    Layers,
    MoreHorizontal,
    Music,
    Plus,
    Shield,
    Sparkles,
    Tag,
    Target,
    TrendingUp as TrendIcon,
    Trash2,
    Users,
    X,
    Zap,
} from "lucide-react-native";
import { View as MotiView } from "moti";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    Pressable,
    ScrollView,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
    Circle,
    Defs,
    G,
    Path,
    Polyline,
    Stop,
    LinearGradient as SvgGradient,
} from "react-native-svg";

const { width, height: screenHeight } = Dimensions.get("window");

const Coffee = ({ size, color }: { size: number; color: string }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <Path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <Path d="M6 2v2" />
    <Path d="M10 2v2" />
    <Path d="M14 2v2" />
  </Svg>
);

// --- Helper Components for Charts ---

const DonutChart = ({
  data,
  total,
  timeRange,
}: {
  data: any[];
  total: number;
  timeRange: "today" | "week" | "month";
}) => {
  const { colorScheme } = useColorScheme();
  const { t } = useLanguage();
  const periodLabel = timeRange === "today" ? "Today" : timeRange === "week" ? "This Week" : "This Month";
  const size = 160;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;
  let currentOffsetCount = 0;

  return (
    <View className="items-center justify-center bg-transparent mb-8">
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Background Track */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colorScheme === "dark" ? "#1c1c1e" : "#f9fafb"}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {data.map((item) => {
            if (item.totalMins <= 0 || total <= 0) return null;
            const percentage = item.totalMins / total;

            // Adding a small gap for spacing
            const gapDegrees = 4;
            const activeSegments = data.filter((d) => d.totalMins > 0).length;
            const totalGaps =
              activeSegments > 1 ? activeSegments * gapDegrees : 0;
            const availableDegrees = 360 - totalGaps;

            const segmentDegrees = percentage * availableDegrees;
            const strokeDashoffset =
              circumference - (segmentDegrees / 360) * circumference;

            const rotation =
              (currentOffset / total) * availableDegrees +
              currentOffsetCount * gapDegrees;
            currentOffset += item.totalMins;
            currentOffsetCount++;

            return (
              <Circle
                key={item.id}
                cx={center}
                cy={center}
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                transform={`rotate(${rotation}, ${center}, ${center})`}
              />
            );
          })}
        </G>
      </Svg>
      <View className="absolute items-center bg-transparent">
        <Text className="text-gray-400 dark:text-gray-500 font-black text-[8px] uppercase tracking-widest mb-1">
          {periodLabel}
        </Text>
        <Text className="text-2xl font-black text-klowk-black dark:text-white">
          {total < 3600
            ? `${Math.floor(total / 60)}m`
            : `${Math.floor(total / 3600)}h ${Math.floor((total % 3600) / 60) > 0 ? `${Math.floor((total % 3600) / 60)}m` : ""}`}
        </Text>
      </View>
    </View>
  );
};

const TrendLineChart = ({
  activities,
  timeRange,
  accentColor,
}: {
  activities: any[];
  timeRange: "today" | "week" | "month";
  accentColor: string;
}) => {
  const { colorScheme } = useColorScheme();
  const now = new Date();

  // Build buckets and labels depending on timeRange
  let bucketData: number[] = [];
  let labels: string[] = [];
  let activeIndex = -1;

  if (timeRange === "today") {
    // 24 hourly buckets
    bucketData = Array.from({ length: 24 }, (_, h) => {
      const start = new Date(now);
      start.setHours(h, 0, 0, 0);
      const end = start.getTime() + 3600000;
      return activities
        .filter((a) => a.start_time >= start.getTime() && a.start_time < end)
        .reduce((sum, a) => sum + (a.duration || 0), 0);
    });
    labels = Array.from({ length: 24 }, (_, h) => {
      if (h === 0) return "12am";
      if (h === 6) return "6am";
      if (h === 12) return "12pm";
      if (h === 18) return "6pm";
      return "";
    });
    activeIndex = now.getHours();
  } else if (timeRange === "week") {
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(now.getDate() - now.getDay());
    bucketData = ["S", "M", "T", "W", "T", "F", "S"].map((_, i) => {
      const dayStart = weekStart.getTime() + i * 86400000;
      return activities
        .filter((a) => a.start_time >= dayStart && a.start_time < dayStart + 86400000)
        .reduce((sum, a) => sum + (a.duration || 0), 0);
    });
    labels = ["S", "M", "T", "W", "T", "F", "S"];
    activeIndex = now.getDay();
  } else {
    // Monthly: one bucket per day of month
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    bucketData = Array.from({ length: daysInMonth }, (_, d) => {
      const dayStart = new Date(year, month, d + 1).getTime();
      return activities
        .filter((a) => a.start_time >= dayStart && a.start_time < dayStart + 86400000)
        .reduce((sum, a) => sum + (a.duration || 0), 0);
    });
    labels = Array.from({ length: daysInMonth }, (_, d) =>
      (d + 1) % 7 === 1 ? `${d + 1}` : "",
    );
    activeIndex = now.getDate() - 1;
  }

  const max = Math.max(...bucketData, 3600);
  const chartHeight = 100;
  const chartWidth = width - 120;
  const count = bucketData.length;

  const yAxisHours = [max, max * 0.66, max * 0.33, 0].map((secs) => {
    if (secs === 0) return "0";
    if (secs < 3600) return `${Math.round(secs / 60)}m`;
    return `${(secs / 3600).toFixed(1)}h`;
  });

  const toPoint = (val: number, i: number) => {
    const x = count > 1 ? (i / (count - 1)) * chartWidth : chartWidth / 2;
    const y = chartHeight - (val / max) * (chartHeight - 30) - 15;
    return { x, y };
  };

  const points = bucketData.map((v, i) => toPoint(v, i));
  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const fillPath = `M 0,${chartHeight} ${points.map((p) => `L ${p.x},${p.y}`).join(" ")} L ${chartWidth},${chartHeight} Z`;

  const titleMap = { today: "Daily Trend", week: "Weekly Trend", month: "Monthly Trend" };

  return (
    <View className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] shadow-sm border border-gray-50 dark:border-zinc-800 mb-8 overflow-hidden">
      <View className="flex-row justify-between items-center mb-6 bg-transparent">
        <Text className="font-black text-lg text-klowk-black dark:text-white">
          {titleMap[timeRange]}
        </Text>
        <TrendIcon size={16} color={accentColor} />
      </View>

      <View className="h-40 bg-transparent relative">
        <View className="flex-row mt-2">
          <View style={{ height: 100, width: 38, justifyContent: "space-between", paddingRight: 2, paddingLeft: 4 }}>
            {yAxisHours.map((label, i) => (
              <Text key={i} className="text-[9px] font-bold text-gray-300 dark:text-zinc-600 text-left">
                {label}
              </Text>
            ))}
          </View>

          <View className="flex-1 relative">
            <View className="absolute top-0 left-0 right-0 h-[100px] justify-between bg-transparent">
              {[...Array(4)].map((_, i) => (
                <View key={i} className="w-full h-[1px] bg-gray-50 dark:bg-zinc-800" />
              ))}
            </View>

            <View className="h-[100px] bg-transparent">
              <Svg height={chartHeight} width={chartWidth}>
                <Defs>
                  <SvgGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={accentColor} stopOpacity="0.2" />
                    <Stop offset="1" stopColor={accentColor} stopOpacity="0" />
                  </SvgGradient>
                </Defs>
                <Path d={fillPath} fill="url(#trendGrad)" />
                <Polyline
                  points={polyline}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          </View>
        </View>

        <View style={{ height: 20, marginTop: 8, marginLeft: 38, position: "relative" }}>
          {labels.map((label, i) => {
            if (!label) return null;
            const x = count > 1 ? (i / (count - 1)) * chartWidth : chartWidth / 2;
            return (
              <Text
                key={i}
                style={{
                  position: "absolute",
                  left: x - 14,
                  width: 28,
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: "700",
                  color: i === activeIndex ? accentColor : colorScheme === "dark" ? "#52525b" : "#9ca3af",
                }}
              >
                {label}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
};
// Helper to capitalize first letter
const capitalize = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";

// Helper to generate dynamic insights based on activities
const generateDynamicInsight = (
  activities: Activity[],
  categoryStats: any[],
  timeRange: "today" | "week" | "month",
  categories: Category[],
  userName: string | null,
): string => {
  if (!activities || activities.length === 0) {
    return `Hey ${userName || "there"}! Start tracking your focus sessions to unlock personalized insights.`;
  }

  const totalMins = categoryStats.reduce(
    (sum: number, c: any) => sum + (c.totalMins || 0),
    0,
  );
  const topCategory = categoryStats.sort(
    (a, b) => (b.totalMins || 0) - (a.totalMins || 0),
  )[0];

  // Analyze peak focus hours
  const hourlyData: Record<number, number> = {};
  activities.forEach((a) => {
    const hour = new Date(a.start_time).getHours();
    hourlyData[hour] = (hourlyData[hour] || 0) + (a.duration || 0);
  });

  const peakHour = Object.entries(hourlyData).sort(([, a], [, b]) => b - a)[0];
  const sessionLengths = activities
    .map((a) => (a.duration || 0) / 60)
    .filter((d) => d > 0);
  const avgSessionLength =
    sessionLengths.length > 0
      ? sessionLengths.reduce((a, b) => a + b) / sessionLengths.length
      : 0;
  const longestSession = Math.max(...sessionLengths);

  // Analyze daily distribution
  const dailyData: Record<string, number> = {};
  activities.forEach((a) => {
    const date = new Date(a.start_time).toLocaleDateString();
    dailyData[date] = (dailyData[date] || 0) + 1;
  });
  const activeDays = Object.keys(dailyData).length;
  const sessionsPerDay = activities.length / Math.max(activeDays, 1);

  // Generate insights based on patterns
  const insights = [];

  // Peak hour insight
  if (peakHour) {
    const [hour] = peakHour;
    const hourNum = parseInt(hour);
    let timePeriod = "morning";
    if (hourNum >= 12 && hourNum < 17) timePeriod = "afternoon";
    else if (hourNum >= 17) timePeriod = "evening";
    const displayHour = hourNum % 12 || 12;
    const ampm = hourNum >= 12 ? "PM" : "AM";
    insights.push(
      `You're most focused in the ${timePeriod} (${displayHour}:00 ${ampm}). Schedule deep work then.`,
    );
  }

  // Category trend
  if (topCategory && topCategory.totalMins > 0) {
    const topCatName = topCategory.label || topCategory.name;
    const percentage = ((topCategory.totalMins / totalMins) * 100).toFixed(0);
    insights.push(
      `${capitalize(topCatName)} dominates ${percentage}% of your focus. You're specializing wisely.`,
    );
  }

  // Session consistency
  if (sessionsPerDay > 0) {
    if (sessionsPerDay > 2) {
      insights.push(
        `${sessionsPerDay.toFixed(1)} sessions daily. You're building strong momentum.`,
      );
    } else if (sessionsPerDay > 1) {
      insights.push(
        `Solid consistency with ${sessionsPerDay.toFixed(1)} sessions per day.`,
      );
    }
  }

  // Session length patterns
  if (avgSessionLength > 0) {
    if (avgSessionLength > 90) {
      insights.push(
        `Your average ${avgSessionLength.toFixed(0)}-minute sessions are deep. Guard against burnout.`,
      );
    } else if (avgSessionLength > 45) {
      insights.push(
        `${avgSessionLength.toFixed(0)} minute focus blocks. The sweet spot for flow.`,
      );
    } else {
      insights.push(
        `Short ${avgSessionLength.toFixed(0)}-minute bursts work for you. Prioritize consistency.`,
      );
    }
  }

  // Time range specific insights
  if (timeRange === "today" && activities.length > 0) {
    if (longestSession > 120) {
      insights.push(
        `Epic ${Math.floor(longestSession)}-minute session today! That's dedication.`,
      );
    } else if (activities.length > 3) {
      insights.push(
        `Multiple sessions today shows great commitment to variety.`,
      );
    }
  } else if (timeRange === "week" && activeDays > 5) {
    insights.push(
      `Active ${activeDays} days this week. You're building a winning habit.`,
    );
  } else if (timeRange === "month" && activeDays > 20) {
    insights.push(
      `Logging almost daily this month. This consistency compounds over time.`,
    );
  }

  // Return a random insight or combine top ones
  return insights.length > 0
    ? insights[Math.floor(Math.random() * insights.length)]
    : "Keep tracking to unlock more detailed insights.";
};

export default React.memo(function ReportsScreen() {
  const { colorScheme } = useColorScheme();
  const { t, language } = useLanguage();
  const { accentColor } = useAppTheme();
  const isDark = colorScheme === "dark";

  const navigation = useNavigation<any>();
  const {
    activities,
    deleteActivity,
    duplicateActivity,
    categories,
    addCategory,
    customGoals,
  } = useTracking();
  const { userName } = useOnboarding();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">("today");
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);

  useEffect(() => {
    const loadAudits = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUDIT_STORAGE_KEY);
        if (stored) setAuditRecords(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load audit records", e);
      }
    };
    loadAudits();
  }, []);

  const filteredActivities = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    if (timeRange === "today") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (timeRange === "week") {
      const day = now.getDay();
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    }

    const startMs = start.getTime();
    const endMs = end.getTime();

    return activities.filter((a: Activity) => {
      const ts = a.start_time;
      return ts >= startMs && ts <= endMs;
    });
  }, [activities, timeRange]);

  const categoryStats = useMemo(() => {
    return categories
      .map((cat: Category) => {
        const logs = filteredActivities.filter(
          (a: Activity) => a.category === cat.id,
        );
        const totalMins = logs.reduce(
          (sum: number, a: Activity) => sum + (a.duration || 0),
          0,
        );
        const sessionCount = logs.length;
        return { ...cat, totalMins, sessionCount };
      })
      .sort((a: any, b: any) => (b.totalMins || 0) - (a.totalMins || 0));
  }, [filteredActivities, categories]);

  const totalTimeRecorded = useMemo(() => {
    return categoryStats.reduce(
      (sum: number, c: any) => sum + (c.totalMins || 0),
      0,
    );
  }, [categoryStats]);

  const dynamicInsight = useMemo(() => {
    const baseInsight = generateDynamicInsight(
      filteredActivities,
      categoryStats,
      timeRange,
      categories,
      userName,
    );

    const missed = auditRecords.filter((a) => !a.reached && a.reason);
    if (missed.length === 0) return baseInsight;

    const reasonCounts: Record<string, number> = {};
    missed.forEach((m) => {
      if (m.reason) reasonCounts[m.reason] = (reasonCounts[m.reason] || 0) + 1;
    });

    const sorted = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1]);
    const topReason = sorted[0];
    const pct = Math.round((topReason[1] / missed.length) * 100);

    let advice = "Consider adjusting your environment or workflow to eliminate this friction.";
    if (topReason[0].includes("Code") || topReason[0].includes("Tech")) {
      advice = "Consider lowering your weekly hour targets when tackling new architecture layers.";
    } else if (topReason[0].includes("Burnout") || topReason[0].includes("Energy")) {
      advice = "Prioritize strict rest intervals and protect your morning peak energy window.";
    } else if (topReason[0].includes("Distractions")) {
      advice = "Ensure Do Not Disturb is active during your core focus blocks.";
    }

    const auditSummary = `Over the last ${auditRecords.length} weeks, ${pct}% of your missed goals were due to ${topReason[0]}. ${advice}`;
    return `${baseInsight}\n\n${auditSummary}`;
  }, [filteredActivities, categoryStats, timeRange, categories, userName, auditRecords]);

  const excuseStats = useMemo(() => {
    const missed = auditRecords.filter((a) => !a.reached && a.reason);
    if (missed.length === 0) return [];

    const counts: Record<string, number> = {};
    missed.forEach((m) => {
      if (m.reason) counts[m.reason] = (counts[m.reason] || 0) + 1;
    });

    const total = missed.length;
    return Object.entries(counts)
      .map(([label, count]) => ({
        label,
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [auditRecords]);

  const founderMetrics = useMemo(() => {
    // 1. Average Peek Count
    let totalPeeks = 0;
    let peekSessionsCount = 0;
    activities.forEach(a => {
      if (a.description && a.description.includes("[peeks:")) {
        const match = a.description.match(/\[peeks:(\d+)\]/);
        if (match) {
          totalPeeks += parseInt(match[1], 10);
          peekSessionsCount++;
        }
      }
    });
    const avgPeeks = peekSessionsCount > 0 ? (totalPeeks / peekSessionsCount).toFixed(1) : "0";

    // 2. Time-of-Day Peak (Focus Window)
    let morning = 0; // 6-12
    let afternoon = 0; // 12-17
    let evening = 0; // 17-22
    let night = 0; // 22-6
    activities.forEach(a => {
      const h = new Date(a.start_time).getHours();
      const dur = a.duration || 0;
      if (h >= 6 && h < 12) morning += dur;
      else if (h >= 12 && h < 17) afternoon += dur;
      else if (h >= 17 && h < 22) evening += dur;
      else night += dur;
    });
    const maxWindow = Math.max(morning, afternoon, evening, night);
    let peakWindowStr = "No sessions yet";
    if (maxWindow > 0) {
      if (maxWindow === morning) peakWindowStr = "8:30 AM – 11:30 AM";
      else if (maxWindow === afternoon) peakWindowStr = "1:00 PM – 4:30 PM";
      else if (maxWindow === evening) peakWindowStr = "6:00 PM – 9:30 PM";
      else peakWindowStr = "11:00 PM – 2:30 AM";
    }

    // 3. Focus Velocity / Acceleration (Week-over-Week Change)
    const now = Date.now();
    const oneWeekMs = 7 * 86400000;
    const thisWeekDuration = activities
      .filter(a => a.start_time >= now - oneWeekMs)
      .reduce((s, a) => s + (a.duration || 0), 0);
    const lastWeekDuration = activities
      .filter(a => a.start_time >= now - 2 * oneWeekMs && a.start_time < now - oneWeekMs)
      .reduce((s, a) => s + (a.duration || 0), 0);
    
    let wowVelocity = "0%";
    if (lastWeekDuration > 0) {
      const pct = Math.round(((thisWeekDuration - lastWeekDuration) / lastWeekDuration) * 100);
      wowVelocity = pct >= 0 ? `+${pct}%` : `${pct}%`;
    } else if (thisWeekDuration > 0) {
      wowVelocity = "+100%";
    }

    // 4. Project Balance Ratio (Multitask Synergy)
    const validStats = categoryStats.filter(s => s.totalMins > 0).sort((a,b) => (b.totalMins || 0) - (a.totalMins || 0));
    let projectRatio = "No activities logged";
    if (validStats.length >= 2) {
      const top1 = validStats[0];
      const top2 = validStats[1];
      const totalTop = top1.totalMins + top2.totalMins;
      const p1 = Math.round((top1.totalMins / totalTop) * 100);
      const p2 = 100 - p1;
      projectRatio = `${p1}% ${capitalize(top1.label)} / ${p2}% ${capitalize(top2.label)}`;
    } else if (validStats.length === 1) {
      projectRatio = `100% ${capitalize(validStats[0].label)}`;
    }

    // 5. Flow Endurance (Maximum Continuous Stretch)
    const maxDurSecs = activities.reduce((m, a) => Math.max(m, a.duration || 0), 0);
    const enduranceHrs = Math.floor(maxDurSecs / 3600);
    const enduranceMins = Math.floor((maxDurSecs % 3600) / 60);
    const flowEnduranceStr = maxDurSecs > 0 ? (enduranceHrs > 0 ? `${enduranceHrs}h ${enduranceMins}m` : `${enduranceMins}m`) : "0m";

    return {
      avgPeeks,
      peakWindowStr,
      wowVelocity,
      projectRatio,
      flowEnduranceStr
    };
  }, [activities, categoryStats]);

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-klowk-black"
      edges={["top"]}
    >
      <Animated.ScrollView
        className="flex-1 bg-white dark:bg-klowk-black"
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {/* Header Section */}
        <View className="bg-white dark:bg-klowk-black pt-8 pb-4 px-6">
          <View className="flex-row items-center justify-between mb-10">
            <Text className="text-4xl font-extrabold text-klowk-black dark:text-white">
              {t("data")}
            </Text>
            <ToggleBar value={timeRange} onChange={setTimeRange} />
          </View>

          <View className="relative items-center justify-center -mt-8">
            <View
              style={{ backgroundColor: getContrastingColor(accentColor, isDark), height: 60, top: "50%" }}
              className="absolute left-[-24] right-[-24]"
            />

            <View className="flex-row items-end justify-between bg-transparent">
              <View className="w-44 h-44 items-center justify-center bg-transparent relative">
                <View
                  style={{
                    position: "absolute",
                    width: 110,
                    height: 26,
                    bottom: 10,
                    backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)",
                    borderRadius: 13,
                    transform: [{ scaleX: 1.2 }],
                  }}
                />
                <Image
                  source={require("../../assets/images/smart klowk.png")}
                  style={{ width: 170, height: 170 }}
                  contentFit="contain"
                />
              </View>

              <View className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] shadow-sm w-[60%] border border-gray-50 dark:border-zinc-800">
                <View className="flex-row items-center mb-1 bg-transparent">
                  <Text className="text-gray-400 dark:text-gray-500 font-bold text-[10px] uppercase tracking-widest">
                    {t("total_focused")}
                  </Text>
                  <View className="ml-2 w-2 h-2 bg-green-500 rounded-full" />
                </View>
                <Text className="text-3xl font-black text-klowk-black dark:text-white leading-8">
                  {Math.floor(totalTimeRecorded / 3600)}h{" "}
                  {Math.floor((totalTimeRecorded % 3600) / 60)}m
                </Text>
              </View>
            </View>
          </View>

          {/* AI Insight & Combined Founder Audit Summary */}
          {filteredActivities.length > 0 && (
            <View
              style={{ marginTop: 24 }}
              className="bg-white dark:bg-zinc-900 p-6 rounded-[34px] shadow-sm border border-gray-100 dark:border-zinc-800 relative overflow-hidden"
            >
              <View className="flex-row items-center mb-3 bg-transparent">
                <Sparkles size={14} color={getContrastingColor(accentColor, isDark)} />
                <Text style={{ color: getContrastingColor(accentColor, isDark) }} className="ml-2 font-black text-[10px] uppercase tracking-[3px]">
                  Insight
                </Text>
              </View>
              <Text className="text-klowk-black dark:text-white font-semibold text-sm leading-5">
                {dynamicInsight}
              </Text>
            </View>
          )}

          {/* Roadblocks Breakdown Chart */}
          {excuseStats.length > 0 && (
            <View
              style={{ marginTop: 16 }}
              className="bg-white dark:bg-zinc-900 p-6 rounded-[34px] shadow-sm border border-gray-100 dark:border-zinc-800 relative overflow-hidden"
            >
              <View className="flex-row items-center mb-4 bg-transparent">
                <Text className="text-klowk-black dark:text-white font-black text-sm uppercase tracking-wider">
                  Roadblocks Breakdown
                </Text>
              </View>

              {excuseStats.map((item, index) => (
                <View key={index} className="mb-3">
                  <View className="flex-row justify-between items-center mb-1 bg-transparent">
                    <Text className="font-bold text-xs text-klowk-black dark:text-white">
                      {item.label}
                    </Text>
                    <Text className="font-black text-xs text-gray-400 dark:text-zinc-500">
                      {item.percentage}% ({item.count}x)
                    </Text>
                  </View>
                  <ProgressBar
                    progress={item.percentage / 100}
                    color={accentColor}
                    trackColor={isDark ? "#27272a" : "#f9fafb"}
                    height={6}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="px-6 mt-4">
          <View className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] shadow-sm border border-gray-50 dark:border-zinc-800 mb-8 items-center">
            <DonutChart data={categoryStats} total={totalTimeRecorded} timeRange={timeRange} />

            <View className="flex-row flex-wrap justify-center gap-x-6 gap-y-3 mt-2">
              {categoryStats
                .filter((s) => s.totalMins > 0)
                .map((stat: any) => (
                  <View key={stat.id} className="flex-row items-center">
                    <View
                      style={{ backgroundColor: stat.color }}
                      className="w-2 h-2 rounded-full mr-2"
                    />
                    <Text className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                      {capitalize(t(stat.id as any) || stat.label)}
                    </Text>
                  </View>
                ))}
              {categoryStats.filter((s) => s.totalMins > 0).length === 0 && (
                <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {t("no_activities_yet")}
                </Text>
              )}
            </View>
          </View>

          <TrendLineChart activities={activities} timeRange={timeRange} accentColor={accentColor} />

          {/* Focus Dynamics */}
          <View className="mt-8 mb-4">
            <View className="flex-row items-center mb-6 px-1">
              <Text className="font-black text-xl text-klowk-black dark:text-white uppercase tracking-wider">
                Focus Dynamics
              </Text>
            </View>

            <View className="gap-4">
              {/* Card 1: Peek Count */}
              <View className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-gray-100 dark:border-zinc-800 flex-row items-center justify-between shadow-sm">
                <View className="flex-1 pr-4">
                  <View className="flex-row items-center mb-2">
                    <View style={{ backgroundColor: accentColor + "20" }} className="w-8 h-8 rounded-full items-center justify-center mr-2.5">
                      <Eye size={16} color={accentColor} />
                    </View>
                    <Text className="text-xs font-black text-gray-400 uppercase tracking-widest">Distraction Resistance</Text>
                  </View>
                  <Text className="text-2xl font-black text-klowk-black dark:text-white mb-1">
                    {founderMetrics.avgPeeks} <Text className="text-sm font-bold text-gray-400">peeks / session</Text>
                  </Text>
                  <Text className="text-[11px] font-bold text-gray-400 leading-snug">Average phone pick-ups during active Flip-to-Focus blocks. Lower is better.</Text>
                </View>
              </View>

              {/* Card 2: Time of Day Peak */}
              <View className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-gray-100 dark:border-zinc-800 flex-row items-center justify-between shadow-sm">
                <View className="flex-1 pr-4">
                  <View className="flex-row items-center mb-2">
                    <View style={{ backgroundColor: "#3b82f620" }} className="w-8 h-8 rounded-full items-center justify-center mr-2.5">
                      <Clock size={16} color="#3b82f6" />
                    </View>
                    <Text className="text-xs font-black text-gray-400 uppercase tracking-widest">Biological Prime Time</Text>
                  </View>
                  <Text className="text-2xl font-black text-klowk-black dark:text-white mb-1">
                    {founderMetrics.peakWindowStr}
                  </Text>
                  <Text className="text-[11px] font-bold text-gray-400 leading-snug">Your peak focus window where uninterrupted deep sessions last 45% longer.</Text>
                </View>
              </View>

              {/* Card 3: Focus Velocity */}
              <View className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-gray-100 dark:border-zinc-800 flex-row items-center justify-between shadow-sm">
                <View className="flex-1 pr-4">
                  <View className="flex-row items-center mb-2">
                    <View style={{ backgroundColor: "#10b98120" }} className="w-8 h-8 rounded-full items-center justify-center mr-2.5">
                      <TrendIcon size={16} color="#10b981" />
                    </View>
                    <Text className="text-xs font-black text-gray-400 uppercase tracking-widest">Focus Acceleration</Text>
                  </View>
                  <Text className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
                    {founderMetrics.wowVelocity} <Text className="text-sm font-bold text-gray-400">WoW</Text>
                  </Text>
                  <Text className="text-[11px] font-bold text-gray-400 leading-snug">Week-over-week growth in deep work hours logged across all deliverables.</Text>
                </View>
              </View>

              {/* Card 4: Project Balance Ratio */}
              <View className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-gray-100 dark:border-zinc-800 flex-row items-center justify-between shadow-sm">
                <View className="flex-1 pr-4">
                  <View className="flex-row items-center mb-2">
                    <View style={{ backgroundColor: "#a855f720" }} className="w-8 h-8 rounded-full items-center justify-center mr-2.5">
                      <Layers size={16} color="#a855f7" />
                    </View>
                    <Text className="text-xs font-black text-gray-400 uppercase tracking-widest">Project Balance Ratio</Text>
                  </View>
                  <Text className="text-2xl font-black text-klowk-black dark:text-white mb-1">
                    {founderMetrics.projectRatio}
                  </Text>
                  <Text className="text-[11px] font-bold text-gray-400 leading-snug">Distribution of attention between your top priority deliverables.</Text>
                </View>
              </View>

              {/* Card 5: Flow Endurance */}
              <View className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-gray-100 dark:border-zinc-800 flex-row items-center justify-between shadow-sm">
                <View className="flex-1 pr-4">
                  <View className="flex-row items-center mb-2">
                    <View style={{ backgroundColor: "#f9731620" }} className="w-8 h-8 rounded-full items-center justify-center mr-2.5">
                      <Flame size={16} color="#f97316" />
                    </View>
                    <Text className="text-xs font-black text-gray-400 uppercase tracking-widest">Flow Endurance</Text>
                  </View>
                  <Text className="text-2xl font-black text-orange-600 dark:text-orange-400 mb-1">
                    {founderMetrics.flowEnduranceStr}
                  </Text>
                  <Text className="text-[11px] font-bold text-gray-400 leading-snug">Personal record for a single continuous, uninterrupted deep focus stretch.</Text>
                </View>
              </View>
            </View>
          </View>

          <View className="h-40 bg-transparent" />
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
});
