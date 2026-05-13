import { CategoryIcon } from "@/components/category/CategoryIcon";
import ActionSheet from "@/components/ui/ActionSheet";
import CategoryDetailSheet from "@/components/sheets/CategoryDetailSheet";
import ProgressBar from "@/components/analytics/ProgressBar";
import ToggleBar from "@/components/ui/ToggleBar";
import { Text } from "react-native";
import { useLanguage } from "@/context/LanguageContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useTracking, Activity, Category } from "@/context/TrackingContext";
import { getContrastingColor, useAppTheme } from "@/context/ThemeContext";
import { getForecast } from "@/utils/forecast";
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
    Copy,
    Edit2,
    Heart,
    Layers,
    MoreHorizontal,
    Music,
    Plus,
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

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showForecast, setShowForecast] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month">(
    "today",
  );

  // New Category State
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("briefcase");
  const [newCatColor, setNewCatColor] = useState(accentColor);

  const forecastAnim = useRef(new Animated.Value(width)).current;
  const sheetSlide = useRef(new Animated.Value(150)).current;
  const sheetBackdrop = useRef(new Animated.Value(0)).current;

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

  // Analytics logic scoped to selected period
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

  useEffect(() => {
    Animated.spring(forecastAnim, {
      toValue: showForecast ? 0 : width,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, [showForecast]);

  const openAddSheet = () => {
    sheetBackdrop.setValue(0);
    sheetSlide.setValue(150);
    setShowAddCategory(true);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(sheetBackdrop, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(sheetSlide, { toValue: 0, duration: 380, easing: Easing.out(Easing.exp), useNativeDriver: true }),
      ]).start();
    }, 10);
  };

  const closeAddSheet = () => {
    Animated.parallel([
      Animated.timing(sheetBackdrop, { toValue: 0, duration: 260, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.timing(sheetSlide, { toValue: 150, duration: 300, easing: Easing.in(Easing.exp), useNativeDriver: true }),
    ]).start(() => setShowAddCategory(false));
  };

  const handleAddCategory = () => {
    if (!newCatName) return;
    const formatted = newCatName.trim().charAt(0).toUpperCase() + newCatName.trim().slice(1);
    addCategory(formatted, newCatIcon, newCatColor);
    closeAddSheet();
    setNewCatName("");
  };

  const ICONS = [
    "briefcase", "heart", "book-open", "dumbbell", "coffee",
    "music", "gamepad", "camera", "plane", "home",
    "wallet", "star", "flame", "brain", "palette",
  ];
  const COLORS = [
    accentColor, "#f97316", "#ef4444", "#f43f5e", "#ec4899",
    "#a855f7", "#6366f1", "#3b82f6", "#0ea5e9", "#06b6d4",
    "#14b8a6", "#10b981", "#22c55e", "#84cc16",
    "#78716c", "#6b7280", "#ffffff", "#e5e7eb",
  ];

  const forecast = useMemo(
    () =>
      getForecast({ activities, goals: customGoals || [], range: timeRange }),
    [activities, customGoals, timeRange],
  );

  const dynamicInsight = useMemo(
    () =>
      generateDynamicInsight(
        filteredActivities,
        categoryStats,
        timeRange,
        categories,
        userName,
      ),
    [filteredActivities, categoryStats, timeRange, categories, userName],
  );

  const forecastContent = useMemo(() => {
    const titleByStatus: Record<string, string> = {
      on_track: "On Track",
      behind: "Behind Schedule",
      burnout: "Burnout Risk",
      at_risk: "Almost There",
      no_goal: "No Active Goal",
    };
    const strategyByStatus: Record<
      string,
      {
        title: string;
        detail: string;
        icon: any;
        route?: "/goals" | "/live" | "/logmanual";
      }[]
    > = {
      on_track: [
        {
          title: "Keep your rhythm",
          detail:
            "Protect your current focus blocks and avoid context switching.",
          icon: Target,
          route: "/live",
        },
        {
          title: "Finish strong",
          detail: "Lock one final deep work sprint to stay ahead.",
          icon: Calendar,
          route: "/live",
        },
      ],
      behind: [
        {
          title: "Find an updraft",
          detail: "Add one extra Deep Work hour today to recover pace.",
          icon: TrendIcon,
          route: "/live",
        },
        {
          title: "30-minute rescue sprint",
          detail: "A short burst now keeps your weekly target alive.",
          icon: Clock,
          route: "/live",
        },
      ],
      burnout: [
        {
          title: "Recover before pushing",
          detail: "Log Health or Leisure time before your next Work block.",
          icon: Heart,
          route: "/logmanual",
        },
        {
          title: "Protect energy",
          detail: "Reduce intensity and split work into smaller sessions.",
          icon: Coffee,
          route: "/logmanual",
        },
      ],
      at_risk: [
        {
          title: "Small correction",
          detail: "You are close. Add one focused session today.",
          icon: ArrowRight,
          route: "/live",
        },
        {
          title: "Hold consistency",
          detail: "Keep momentum with repeatable daily blocks.",
          icon: Calendar,
          route: "/live",
        },
      ],
      no_goal: [
        {
          title: "Set a goal",
          detail:
            "Create a weekly or monthly goal to unlock smarter forecasting.",
          icon: Target,
          route: "/goals",
        },
        {
          title: "Start with one habit",
          detail: "A simple daily focus goal is enough to begin.",
          icon: Zap,
          route: "/live",
        },
      ],
    };

    return {
      title: titleByStatus[forecast.status] || "Forecast",
      heroText: forecast.message,
      statsText: (() => {
        const fmt = (mins: number) => mins < 60 ? `${Math.round(mins)}m` : `${(mins / 60).toFixed(1)}h`;
        return forecast.targetMins > 0
          ? `Current: ${fmt(forecast.currentMins)}  •  Projected: ${fmt(forecast.projectedMins)}  •  Target: ${fmt(forecast.targetMins)}`
          : `Current: ${fmt(forecast.currentMins)} in this ${timeRange}`;
      })(),
      strategies: strategyByStatus[forecast.status] || strategyByStatus.no_goal,
    };
  }, [forecast, timeRange]);

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
                    backgroundColor: isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.12)",
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

                {filteredActivities.length > 0 && (
                  <Pressable
                    onPress={() => {
                      impact(ImpactFeedbackStyle.Medium);
                      setShowForecast(true);
                    }}
                    className="mt-4 py-2.5 px-4 rounded-xl flex-row items-center justify-center border"
                    style={{ backgroundColor: accentColor + "1A", borderColor: accentColor + "33" }}
                  >
                    <Sparkles size={12} color={getContrastingColor(accentColor, isDark)} />
                    <Text style={{ color: getContrastingColor(accentColor, isDark) }} className="ml-2 text-[10px] font-black uppercase tracking-wider">
                      {t("forecast")}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          {/* AI Insight only after real tracking data exists */}
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

          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-6 px-1">
              <Text className="font-black text-xl text-klowk-black dark:text-white">
                {t("categories")}
              </Text>
              <Pressable
                onPress={() => {
                  impact(ImpactFeedbackStyle.Medium);
                  openAddSheet();
                }}
                className="w-10 h-10 items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-full border border-gray-100 dark:border-zinc-800"
              >
                <Plus size={20} color={getContrastingColor(accentColor, isDark)} strokeWidth={3} />
              </Pressable>
            </View>

            {categoryStats.map((stat: any, i: number) => {
              const percentage =
                totalTimeRecorded > 0
                  ? (stat.totalMins / totalTimeRecorded) * 100
                  : 0;
              if (stat.totalMins === 0 && i > 3) return null;

              return (
                <Pressable
                  key={stat.id}
                  onPress={() => {
                    impact(ImpactFeedbackStyle.Light);
                    setSelectedCategory(stat.id);
                  }}
                  className="bg-white dark:bg-zinc-900 p-5 rounded-[32px] mb-4 shadow-sm border border-gray-50 dark:border-zinc-800 active:scale-[0.98] active:bg-gray-50 dark:active:bg-zinc-800 flex-row items-center"
                >
                  <View
                    style={{ backgroundColor: `${stat.color}10` }}
                    className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                  >
                    <CategoryIcon
                      name={stat.iconName}
                      size={20}
                      color={stat.color}
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between items-end mb-3">
                      <View>
                        <Text className="font-black text-klowk-black dark:text-white text-base">
                          {capitalize(
                            t(stat.label.toLowerCase() as any) || stat.label,
                          )}
                        </Text>
                        <Text className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">
                          {stat.sessionCount} {t("sessions")}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="font-black text-klowk-black dark:text-white text-lg">
                          {formatDuration(Math.floor(stat.totalMins / 60))}
                        </Text>
                      </View>
                    </View>
                    <ProgressBar
                      progress={Math.max(0.02, percentage / 100)}
                      color={stat.color}
                      trackColor={isDark ? "#27272a" : "#f9fafb"}
                      height={6}
                    />
                  </View>
                  <View className="ml-4">
                    <ChevronRight size={18} color="#e5e7eb" />
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View className="h-40 bg-transparent" />
        </View>
      </Animated.ScrollView>

      <CategoryDetailSheet
        categoryId={selectedCategory}
        categories={categories}
        activities={filteredActivities}
        onClose={() => setSelectedCategory(null)}
        onDeleteActivity={deleteActivity}
        onDuplicateActivity={duplicateActivity}
      />

      {/* Forecast Overlay (Stay on same page) */}
      {filteredActivities.length > 0 && (
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isDark ? "#121212" : "#fff",
            zIndex: 110,
            transform: [{ translateX: forecastAnim }],
          }}
        >
          <SafeAreaView
            className="flex-1 bg-white dark:bg-klowk-black"
            edges={["top"]}
          >
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-zinc-800">
              <Pressable
                onPress={() => setShowForecast(false)}
                className="w-10 h-10 items-center justify-center bg-gray-50 dark:bg-zinc-900 rounded-full active:bg-gray-100 dark:active:bg-zinc-800"
              >
                <ArrowLeft size={20} color={isDark ? "#fff" : "#121212"} />
              </Pressable>
              <Text className="text-lg font-black text-klowk-black dark:text-white">
                {t("forecast")}
              </Text>
              <View className="w-10" />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              className="flex-1 px-6 bg-white dark:bg-klowk-black"
            >
              <View className="items-center py-4 mb-2">
                <View style={{ backgroundColor: accentColor + "1A" }} className="w-24 h-24 rounded-[32px] items-center justify-center">
                  <Sparkles size={40} color={getContrastingColor(accentColor, isDark)} />
                </View>
                <Text className="text-3xl font-black text-klowk-black dark:text-white mt-6 text-center">
                  {forecastContent.title}
                </Text>
              </View>

              <LinearGradient
                colors={[accentColor, accentColor + "B3"]}
                style={{
                  borderRadius: 34,
                  padding: 32,
                  marginBottom: 32,
                  marginTop: 24,
                }}
              >
                <Text className="text-white text-2xl font-black leading-9">
                  {forecastContent.heroText}
                </Text>
                <Text className="text-white/80 text-xs font-bold mt-4">
                  {forecastContent.statsText}
                </Text>
              </LinearGradient>

              {/* Rich Strategies List */}
              <View className="mb-8">
                <Text className="text-xl font-black text-klowk-black dark:text-white mb-6">
                  {t("winning_strategy")}
                </Text>
                {forecastContent.strategies.map((s: any, i: number) => {
                  const Icon = s.icon || Target;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => {
                        impact(ImpactFeedbackStyle.Light);
                        if (s.route) router.push(s.route);
                      }}
                      className="bg-gray-50 dark:bg-zinc-900 p-6 rounded-[32px] mb-4 flex-row items-center border border-transparent dark:border-zinc-800 active:opacity-80"
                    >
                      <View className="bg-white dark:bg-zinc-800 w-12 h-12 rounded-2xl items-center justify-center shadow-sm">
                        <Icon size={20} color={getContrastingColor(accentColor, isDark)} />
                      </View>
                      <View className="flex-1 ml-4">
                        <Text className="font-bold text-klowk-black dark:text-white text-base">
                          {s.title}
                        </Text>
                        <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {s.detail}
                        </Text>
                      </View>
                      <ArrowRight
                        size={16}
                        color={isDark ? "#3f3f46" : "#d1d5db"}
                      />
                    </Pressable>
                  );
                })}
              </View>

              <View className="h-48" />
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      )}

      {/* Add Category Sheet */}
      <Modal
        visible={showAddCategory}
        transparent
        animationType="none"
        onRequestClose={closeAddSheet}
      >
        <View style={{ flex: 1 }}>
          <Animated.View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", opacity: sheetBackdrop }} />
          <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} onPress={closeAddSheet} />
          <Animated.View style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: screenHeight * 0.9, transform: [{ translateY: sheetSlide }] }}>
            <Pressable onPress={(e) => e.stopPropagation()} style={{ backgroundColor: isDark ? "#121212" : "#fff", borderTopLeftRadius: 40, borderTopRightRadius: 40, flex: 1 }}>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 32, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                  <Text style={{ fontSize: 22, fontWeight: "900", color: isDark ? "#fff" : "#121212" }}>New Category</Text>
                  <Pressable onPress={closeAddSheet} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? "#27272a" : "#f3f4f6", alignItems: "center", justifyContent: "center" }}>
                    <X size={18} color={isDark ? "#fff" : "#121212"} />
                  </Pressable>
                </View>

                <Text style={{ fontSize: 10, fontWeight: "900", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Category Name</Text>
                <View style={{ backgroundColor: isDark ? "#18181b" : "#f9fafb", borderRadius: 20, borderWidth: 1, borderColor: isDark ? "#27272a" : "#f3f4f6", marginBottom: 24 }}>
                  <TextInput
                    value={newCatName}
                    onChangeText={setNewCatName}
                    placeholder="e.g. Learning, Workout..."
                    placeholderTextColor={isDark ? "#3f3f46" : "#d1d5db"}
                    autoFocus
                    style={{ padding: 18, fontSize: 15, fontWeight: "700", color: isDark ? "#fff" : "#121212" }}
                  />
                </View>

                <Text style={{ fontSize: 10, fontWeight: "900", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Icon</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    {ICONS.map((icon) => (
                      <Pressable key={icon} onPress={() => { setNewCatIcon(icon); impact(ImpactFeedbackStyle.Light); }} style={{ width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: newCatIcon === icon ? accentColor : isDark ? "#18181b" : "#f9fafb", borderWidth: 1, borderColor: newCatIcon === icon ? accentColor : isDark ? "#27272a" : "#f3f4f6" }}>
                        <CategoryIcon name={icon} size={20} color={newCatIcon === icon ? "#fff" : isDark ? "#52525b" : "#9ca3af"} />
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                <Text style={{ fontSize: 10, fontWeight: "900", color: isDark ? "#71717a" : "#9ca3af", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 32 }}>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {COLORS.map((color) => (
                      <Pressable key={color} onPress={() => { setNewCatColor(color); impact(ImpactFeedbackStyle.Light); }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: color, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: newCatColor === color ? isDark ? "#fff" : "#121212" : "transparent" }}>
                        {newCatColor === color && <Check size={16} color="#fff" />}
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                <Pressable onPress={handleAddCategory} disabled={!newCatName.trim()} style={{ paddingVertical: 18, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: !newCatName.trim() ? isDark ? "#27272a" : "#f3f4f6" : accentColor }}>
                  <Text style={{ fontSize: 15, fontWeight: "900", color: !newCatName.trim() ? isDark ? "#52525b" : "#9ca3af" : "#fff", textTransform: "uppercase", letterSpacing: 1 }}>Create Category</Text>
                </Pressable>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
});
