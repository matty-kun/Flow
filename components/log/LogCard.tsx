import { CategoryIcon } from "@/components/category/CategoryIcon";
import { useLanguage } from "@/context/LanguageContext";
import { formatDate, formatLogDuration, formatTimestamp } from "@/utils/time";
import { MoreHorizontal } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  log: {
    id: number;
    title: string;
    category: string | null;
    start_time: number;
    end_time: number | null;
    duration: number | null;
  };
  categoryColor: string;
  categoryLabel: string;
  categoryIconName: string;
  pomodoroRounds?: number;
  goalName?: string;
  onPressMore: () => void;
};

export default React.memo(function LogCard({ log, categoryColor, categoryLabel, categoryIconName, pomodoroRounds, goalName, onPressMore }: Props) {
  const { t } = useLanguage();

  return (
    <View className="bg-white dark:bg-zinc-900 rounded-[24px] p-4 mb-3 flex-row items-center border border-gray-50 dark:border-zinc-800 shadow-sm">
      <View
        style={{ backgroundColor: `${categoryColor}15` }}
        className="w-10 h-10 rounded-[12px] items-center justify-center mr-4"
      >
        <CategoryIcon name={categoryIconName} size={18} color={categoryColor} />
      </View>
      <View className="flex-1">
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 2, flexWrap: "wrap", gap: 4 }}>
          <Text className="font-bold text-klowk-black dark:text-white" numberOfLines={1} style={{ flexShrink: 1 }}>
            {log.title || t("untitled_session")}
          </Text>
          {goalName && (
            <View style={{ backgroundColor: "#14b8a620", borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 9 }}>🎯</Text>
              <Text style={{ color: "#14b8a6", fontSize: 9, fontWeight: "900", marginLeft: 3, textTransform: "uppercase" }} numberOfLines={1}>
                {goalName}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center flex-wrap gap-y-1">
          <Text style={{ color: categoryColor }} className="text-[10px] font-black uppercase mr-2">
            {categoryLabel}
          </Text>
          {pomodoroRounds != null && (
            <View style={{ backgroundColor: "#FBBF2420", borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2, marginRight: 6, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 9 }}>🍅</Text>
              <Text style={{ color: "#FBBF24", fontSize: 9, fontWeight: "900", marginLeft: 3, textTransform: "uppercase" }}>
                {pomodoroRounds} {pomodoroRounds === 1 ? "round" : "rounds"}
              </Text>
            </View>
          )}
          <Text className="text-[8px] text-gray-400 dark:text-gray-500 font-bold uppercase">
            {formatDate(log.start_time)} • {formatTimestamp(log.start_time)}
          </Text>
        </View>
      </View>
      <View className="items-end ml-4">
        <Text className="font-black text-klowk-black dark:text-white mb-1">
          {formatLogDuration(log.start_time, log.end_time, log.duration)}
        </Text>
        <Pressable hitSlop={10} onPress={onPressMore} className="p-1">
          <MoreHorizontal size={16} color="#9ca3af" />
        </Pressable>
      </View>
    </View>
  );
});
