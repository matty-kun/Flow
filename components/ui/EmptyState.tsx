import { impact } from "@/utils/haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import React from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  icon: React.ReactNode;
  /** Background color of the icon circle */
  iconBg?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
};

export default function EmptyState({ icon, iconBg, title, description, action }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-10 pb-20">
      <View
        style={{ backgroundColor: iconBg ?? "rgba(20,184,166,0.1)" }}
        className="w-24 h-24 rounded-full items-center justify-center mb-8"
      >
        {icon}
      </View>
      <Text className="text-2xl font-black text-klowk-black dark:text-white mb-3 text-center">
        {title}
      </Text>
      {description && (
        <Text className="text-[14px] font-bold text-gray-400 dark:text-zinc-500 text-center mb-10 leading-6">
          {description}
        </Text>
      )}
      {action && (
        <Pressable
          onPress={() => {
            impact(ImpactFeedbackStyle.Medium);
            action.onPress();
          }}
          className="w-full bg-[#FBBF24] py-4 rounded-[20px] items-center justify-center shadow-lg shadow-[#FBBF24]/30"
        >
          <Text className="text-white font-black text-[15px] tracking-wider uppercase">
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
