import { ArrowLeft } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Pressable, Text, View } from "react-native";

type Props = {
  title: string;
  onBack: () => void;
  right?: React.ReactNode;
};

export default function ScreenHeader({ title, onBack, right }: Props) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <View className="flex-row items-center mb-8">
      <Pressable
        onPress={onBack}
        className="w-12 h-12 items-center justify-center rounded-[16px] bg-gray-50 dark:bg-zinc-900 mr-4"
      >
        <ArrowLeft size={24} color={isDark ? "#fff" : "#121212"} />
      </Pressable>
      <Text className="text-[28px] font-black text-klowk-black dark:text-white flex-1">
        {title}
      </Text>
      {right}
    </View>
  );
}
