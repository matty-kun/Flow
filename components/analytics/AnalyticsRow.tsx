import ToggleBar from "@/components/ui/ToggleBar";
import { useLanguage } from "@/context/LanguageContext";
import { View as MotiView } from "moti";
import { useColorScheme } from "nativewind";
import React from "react";
import { Text, View } from "react-native";
import { ArrowDown, ArrowUp } from "lucide-react-native";

interface DayData {
  mins: number;
  label: string;
  isToday: boolean;
}

interface Props {
  dailyChartData: DayData[];
  maxWeeklyMins: number;
  rangeMinsTotal: number;
  trendUp: boolean;
  isNeutral: boolean;
  trendColor: string;
  timeRange: "today" | "week" | "month";
  setTimeRange: (v: "today" | "week" | "month") => void;
}

export default function AnalyticsRow({
  dailyChartData,
  maxWeeklyMins,
  rangeMinsTotal,
  trendUp,
  isNeutral,
  trendColor,
  timeRange,
  setTimeRange,
}: Props) {
  const { t } = useLanguage();
  const { colorScheme } = useColorScheme();

  return (
    <View className="px-6 flex-row justify-between mb-8">
      {/* Intensity Card */}
      <MotiView
        from={{ opacity: 0, translateX: -20 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: "spring", delay: 400 }}
        className="w-[48.5%] bg-white dark:bg-zinc-900 rounded-[32px] p-5 border border-gray-50 dark:border-zinc-800 shadow-sm"
      >
        <Text className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-5">
          {t("intensity")}
        </Text>
        <View className="flex-row items-end justify-between h-16">
          {dailyChartData.map((item, i) => {
            const intensity = item.mins / maxWeeklyMins || 0;
            const barHeight = Math.max(4, intensity * 40);
            return (
              <View key={i} className="w-[12%] items-center justify-end h-full">
                <MotiView
                  from={{ height: 0 }}
                  animate={{ height: barHeight }}
                  transition={{ type: "spring", delay: 600 + i * 50 }}
                  style={{
                    width: 10,
                    borderRadius: 5,
                    backgroundColor: item.isToday
                      ? "#FBBF24"
                      : intensity > 0.05
                        ? `rgba(255, 90, 0, ${0.15 + intensity * 0.7})`
                        : colorScheme === "dark" ? "#27272a" : "#f3f4f6",
                  }}
                />
                <Text className={`mt-2 text-[7px] font-black uppercase ${item.isToday ? "text-amber-400" : "text-gray-400 dark:text-zinc-600"}`}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </MotiView>

      {/* Summary Card */}
      <MotiView
        from={{ opacity: 0, translateX: 20 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: "spring", delay: 400 }}
        className="w-[48.5%] bg-white dark:bg-zinc-900 rounded-[32px] p-5 border border-gray-50 dark:border-zinc-800 shadow-sm justify-between"
      >
        <View>
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {t(timeRange === "today" ? "today" : timeRange === "week" ? "this_week" : "this_month")}
            </Text>
            {!isNeutral && (trendUp
              ? <ArrowUp size={12} color="#10b981" strokeWidth={3} />
              : <ArrowDown size={12} color="#ef4444" strokeWidth={3} />
            )}
          </View>
          <View className="flex-row items-baseline">
            <Text style={{ color: trendColor }} className="text-[34px] font-black">
              {rangeMinsTotal >= 3600
                ? (rangeMinsTotal / 3600).toFixed(1)
                : Math.round(rangeMinsTotal / 60)}
            </Text>
            <Text className="text-[10px] font-black text-gray-300 dark:text-zinc-600 ml-1">
              {rangeMinsTotal >= 3600 ? t("hrs").toLowerCase() : t("min")}
            </Text>
          </View>
        </View>
        <ToggleBar value={timeRange} onChange={setTimeRange} style={{ width: "100%" }} />
      </MotiView>
    </View>
  );
}
