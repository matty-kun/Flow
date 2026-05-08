import { useLanguage } from "@/context/LanguageContext";
import { impact } from "@/utils/haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import { View as MotiView } from "moti";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import { Pressable, Text, View, ViewStyle } from "react-native";

type Range = "today" | "week" | "month";

type Props = {
  value: Range;
  onChange: (v: Range) => void;
  style?: ViewStyle;
};

export default function ToggleBar({ value, onChange, style }: Props) {
  const { colorScheme } = useColorScheme();
  const { t } = useLanguage();
  const [toggleWidth, setToggleWidth] = useState(0);

  return (
    <View
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0) setToggleWidth(w);
      }}
      style={[{ width: 160 }, style]}
      className="flex-row bg-gray-50 dark:bg-zinc-800 p-1 rounded-[16px] relative overflow-hidden"
    >
      <MotiView
        animate={{
          translateX:
            (value === "today" ? 0 : value === "week" ? 1 : 2) *
            ((toggleWidth - 8) / 3),
        }}
        transition={{ type: "spring", damping: 20, stiffness: 160 }}
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: 4,
          width: (toggleWidth - 8) / 3 || "31.5%",
          backgroundColor: colorScheme === "dark" ? "#3f3f46" : "#fff",
          borderRadius: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        }}
      />
      {(["today", "week", "month"] as const).map((r) => (
        <Pressable
          key={r}
          onPress={() => {
            impact(ImpactFeedbackStyle.Light);
            onChange(r);
          }}
          className="flex-1 items-center py-2 z-10"
        >
          <Text
            className={`text-[8px] font-black uppercase tracking-wide ${value === r ? "text-amber-400" : "text-gray-400 dark:text-zinc-500"}`}
          >
            {t(r === "week" ? "this_week" : r === "month" ? "this_month" : "today")}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
