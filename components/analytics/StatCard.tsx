import { View as MotiView } from "moti";
import React from "react";
import { Text, View, ViewStyle } from "react-native";

type Props = {
  label: string;
  children: React.ReactNode;
  delay?: number;
  animateFrom?: "left" | "right" | "bottom";
  style?: ViewStyle;
  className?: string;
};

export default function StatCard({
  label,
  children,
  delay = 400,
  animateFrom = "bottom",
  style,
  className = "",
}: Props) {
  const from =
    animateFrom === "left"
      ? { opacity: 0, translateX: -20 }
      : animateFrom === "right"
        ? { opacity: 0, translateX: 20 }
        : { opacity: 0, translateY: 10 };

  return (
    <MotiView
      from={from}
      animate={
        animateFrom === "left" || animateFrom === "right"
          ? { opacity: 1, translateX: 0 }
          : { opacity: 1, translateY: 0 }
      }
      transition={{ type: "spring", delay }}
      className={`bg-white dark:bg-zinc-900 rounded-[32px] p-5 border border-gray-50 dark:border-zinc-800 shadow-sm ${className}`}
      style={style}
    >
      <Text className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-5">
        {label}
      </Text>
      <View>{children}</View>
    </MotiView>
  );
}
