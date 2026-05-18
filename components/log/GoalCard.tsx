import { CategoryIcon } from "@/components/category/CategoryIcon";
import ProgressBar from "@/components/analytics/ProgressBar";
import { useLanguage } from "@/context/LanguageContext";
import { Category } from "@/context/TrackingContext";
import { MoreHorizontal } from "lucide-react-native";
import { View as MotiView } from "moti";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { getContrastingColor, useAppTheme } from "@/context/ThemeContext";

type Props = {
  goal: {
    id: string;
    name: string;
    targetMins: number;
    categoryId: string;
    startDate: number;
    endDate: number;
    recurring?: "daily" | "weekly" | "monthly" | "none";
  };
  catData: Category;
  currentMins: number;
  index?: number;
  isRecentlyActive?: boolean;
  onPressMore: () => void;
  lastNote?: string;
};

export default function GoalCard({ goal, catData, currentMins, index = 0, isRecentlyActive = false, onPressMore, lastNote }: Props) {
  const { colorScheme } = useColorScheme();
  const { accentColor } = useAppTheme();
  const isDark = colorScheme === "dark";
  const { t } = useLanguage();

  const formatTime = (mins: number) =>
    mins < 60 ? `${mins}m` : `${(mins / 60).toFixed(1).replace(".0", "")}h`;
  const pct = Math.min(100, (currentMins / goal.targetMins) * 100) || 0;
  const isCompleted = pct >= 100;

  const freqLabel = goal.recurring === "daily" ? "Day" : goal.recurring === "monthly" ? "Month" : goal.recurring === "none" ? "Total" : "Week";

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 100 + index * 50, type: "spring" }}
      className="mb-4"
      style={{
        backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
        borderRadius: 36,
        padding: 24,
        borderWidth: 1,
        borderColor: isRecentlyActive ? accentColor : (isDark ? "#2A2A2A" : "#F0F0F0"),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 20,
        elevation: 5
      }}
    >
      <View className="flex-row items-center justify-between mb-6">
        <View className="flex-row items-center flex-1">
          <View
            style={{ backgroundColor: catData.color + "15" }}
            className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
          >
            <CategoryIcon name={catData.iconName} size={28} color={catData.color} customImageUri={catData.customImageUri} />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-black text-klowk-black dark:text-white leading-tight" numberOfLines={1}>
              {goal.name}
            </Text>
            <View className="flex-row items-center mt-1">
              <View 
                style={{ backgroundColor: catData.color }}
                className="w-2 h-2 rounded-full mr-2" 
              />
              <Text className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {formatTime(goal.targetMins)} / {freqLabel}
              </Text>
            </View>
          </View>
        </View>
        <Pressable onPress={onPressMore} hitSlop={20} className="p-2 -mr-2">
          <MoreHorizontal size={20} color={isDark ? "#52525b" : "#9ca3af"} />
        </Pressable>
      </View>

      <View className="mb-6">
        <View className="flex-row justify-between items-end mb-3">
          <View>
            <Text className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">CURRENT PROGRESS</Text>
            <Text className="text-2xl font-black text-klowk-black dark:text-white">
              {formatTime(currentMins)} <Text className="text-gray-400 text-sm">logged</Text>
            </Text>
          </View>
          <Text style={{ color: isCompleted ? "#10b981" : catData.color }} className="text-sm font-black">
            {Math.round(pct)}%
          </Text>
        </View>
        
        <ProgressBar
          progress={pct / 100}
          color={isCompleted ? "#10b981" : catData.color}
          trackColor={isDark ? "#27272a" : "#f3f4f6"}
          height={10}
        />
      </View>

      {lastNote && (
        <View className="bg-gray-50 dark:bg-black/20 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
          <Text className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Last State</Text>
          <Text className="text-xs font-bold text-gray-600 dark:text-gray-300 leading-5" numberOfLines={2}>
            "{lastNote}"
          </Text>
        </View>
      )}
    </MotiView>
  );
}
