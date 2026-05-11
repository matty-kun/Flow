import { impact } from "@/utils/haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import { router } from "expo-router";
import { Flame, History, Settings2 } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { View as MotiView } from "moti";
import { useNavigation } from "@react-navigation/native";
import StreakModal from "./StreakModal";

interface Props {
  streak?: number;
  onStreakSaved?: () => void;
}

export default function HomeHeader({ streak = 0, onStreakSaved }: Props) {
  const { colorScheme } = useColorScheme();
  const navigation = useNavigation<any>();
  const [streakModalVisible, setStreakModalVisible] = useState(false);

  return (
    <>
      <MotiView
        from={{ opacity: 0, scale: 0.9, translateY: -20 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 700 }}
        className="px-6 py-2 mb-2 flex-row justify-between items-center"
      >
        {streak > 0 ? (
          <TouchableOpacity
            onPress={() => { impact(ImpactFeedbackStyle.Medium); setStreakModalVisible(true); }}
            className="flex-row items-center bg-amber-100 dark:bg-[#2a1f0e] rounded-full px-3 py-1.5 gap-1.5"
          >
            <Flame size={13} color={colorScheme === "dark" ? "#f59e0b" : "#d97706"} fill={colorScheme === "dark" ? "#f59e0b" : "#d97706"} />
            <Text className="text-amber-600 dark:text-amber-400 font-black text-[12px]">x{streak} day streak!</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity
            onPress={() => { impact(ImpactFeedbackStyle.Medium); router.push("/history"); }}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-full mr-2"
          >
            <History size={20} color={colorScheme === "dark" ? "#fff" : "#121212"} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { impact(ImpactFeedbackStyle.Medium); navigation.navigate("settings"); }}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            className="p-2 bg-gray-50 dark:bg-zinc-900 rounded-full"
          >
            <Settings2 size={20} color={colorScheme === "dark" ? "#fff" : "#121212"} />
          </TouchableOpacity>
        </View>
      </MotiView>

      <StreakModal
        visible={streakModalVisible}
        streak={streak}
        onClose={() => setStreakModalVisible(false)}
        onSaved={onStreakSaved}
      />
    </>
  );
}
